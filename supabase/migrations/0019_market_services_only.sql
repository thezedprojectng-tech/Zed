BEGIN;

-- ─── 0019_market_services_only.sql ──────────────────────────────────────────
-- Zed Market: Transition from general classifieds to SERVICES ONLY.
-- Scopes:
-- 1. Updates category CHECK constraint to new service categories while keeping
--    legacy categories allowed in schema for existing/historical rows.
-- 2. Hides existing physical goods listings (status = 'removed').
-- 3. Updates create_listing and update_listing RPCs to enforce service categories only.
-- ─── ALL statements idempotent; wrapped in a transaction. Do NOT run automatically.

-- ── 1. Update market_listings Category CHECK Constraint ───────────────────────

ALTER TABLE public.market_listings
  DROP CONSTRAINT IF EXISTS market_listings_category_check;

ALTER TABLE public.market_listings
  ADD CONSTRAINT market_listings_category_check
  CHECK (category IN (
    -- New Services Only Categories
    'design-and-creative',
    'tech-and-development',
    'tutoring-and-lessons',
    'writing-and-translation',
    'photography-and-video',
    'fashion-and-beauty-services',
    'repairs-and-maintenance',
    'errands-and-delivery',
    'events-and-entertainment',
    'business-and-admin',
    'other-services',
    -- Legacy Goods & Classified Categories (retained only for historical/hidden rows)
    'electronics',
    'fashion',
    'books-and-notes',
    'services',
    'food',
    'creative',
    'other'
  ));

-- ── 2. Hide Existing Physical Goods Listings ──────────────────────────────────
-- Exactly 1 active 'electronics' listing exists in production.
-- Set status to 'removed' with clear reason, making this fully auditable and reversible.

UPDATE public.market_listings
SET
  status = 'removed',
  removed_reason = 'Zed Market now supports services only.',
  updated_at = now()
WHERE category IN ('electronics', 'fashion', 'books-and-notes', 'food', 'other')
  AND status = 'active';

-- ── 3. Update create_listing RPC ──────────────────────────────────────────────
-- Based on 0017_optional_verification.sql:
-- Retains tiered limits (verified: max 10 active, max 5 daily; unverified: max 3 active, max 2 daily),
-- seller_verified flag, 60-day expiry, and WhatsApp contact handling.
-- Validates that only the 11 new service categories are accepted.

CREATE OR REPLACE FUNCTION public.create_listing(
  p_title            text,
  p_description      text,
  p_category         text,
  p_price_ngn        numeric,
  p_condition        text,
  p_location         text,
  p_image_paths      text[],
  p_contact_whatsapp text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id        uuid;
  v_is_verified      boolean;
  v_full_name        text;
  v_masked_name      text;
  v_max_active       int;
  v_max_recent       int;
  v_active_count     int;
  v_recent_count     int;
  v_new_id           uuid;
  v_clean_title      text;
  v_clean_desc       text;
  v_clean_loc        text;
  v_clean_whatsapp   text;
  v_path             text;
BEGIN
  -- 1. Authentication check
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Advisory lock on caller to serialise concurrent creates from the same user.
  PERFORM pg_advisory_xact_lock(hashtext(v_caller_id::text));

  -- 3. Verified user check & get seller full name
  SELECT is_verified, full_name
  INTO v_is_verified, v_full_name
  FROM public.users
  WHERE id = v_caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  v_masked_name := public.mask_user_name(v_full_name);

  -- 4. Tiered active listings limit
  v_max_active := CASE WHEN v_is_verified IS TRUE THEN 10 ELSE 3 END;
  v_max_recent := CASE WHEN v_is_verified IS TRUE THEN 5 ELSE 2 END;

  SELECT count(*)
  INTO v_active_count
  FROM public.market_listings
  WHERE seller_id = v_caller_id
    AND status = 'active'
    AND expires_at > now();

  IF v_active_count >= v_max_active THEN
    IF v_is_verified IS TRUE THEN
      RAISE EXCEPTION 'You have reached the limit of 10 active listings. Please mark completed listings as sold or delete inactive ones.';
    ELSE
      RAISE EXCEPTION 'Unverified accounts can have at most 3 active listings. Verify your account to create up to 10 active listings.';
    END IF;
  END IF;

  -- 5. Tiered 24-hour rate limit
  SELECT count(*)
  INTO v_recent_count
  FROM public.market_listings
  WHERE seller_id = v_caller_id
    AND created_at > (now() - interval '24 hours');

  IF v_recent_count >= v_max_recent THEN
    IF v_is_verified IS TRUE THEN
      RAISE EXCEPTION 'Daily limit reached: You can create at most 5 listings every 24 hours.';
    ELSE
      RAISE EXCEPTION 'Daily limit reached: Unverified accounts can create at most 2 listings every 24 hours. Verify your account for higher limits.';
    END IF;
  END IF;

  -- 6. Field validation & sanitization
  v_clean_title    := trim(p_title);
  v_clean_desc     := trim(p_description);
  v_clean_loc      := trim(p_location);
  v_clean_whatsapp := NULLIF(trim(p_contact_whatsapp), '');

  IF char_length(v_clean_title) < 3 OR char_length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Title must be between 3 and 120 characters.';
  END IF;

  IF char_length(v_clean_desc) < 20 OR char_length(v_clean_desc) > 2000 THEN
    RAISE EXCEPTION 'Description must be between 20 and 2000 characters.';
  END IF;

  -- Strict validation: Only service categories allowed
  IF p_category NOT IN (
    'design-and-creative',
    'tech-and-development',
    'tutoring-and-lessons',
    'writing-and-translation',
    'photography-and-video',
    'fashion-and-beauty-services',
    'repairs-and-maintenance',
    'errands-and-delivery',
    'events-and-entertainment',
    'business-and-admin',
    'other-services'
  ) THEN
    RAISE EXCEPTION 'Invalid category selected. Zed Market only supports services.';
  END IF;

  IF p_price_ngn IS NOT NULL AND p_price_ngn < 0 THEN
    RAISE EXCEPTION 'Price must be 0 or greater, or left blank for contact-for-price.';
  END IF;

  IF p_condition NOT IN ('new', 'used', 'na') THEN
    RAISE EXCEPTION 'Condition must be new, used, or na.';
  END IF;

  IF char_length(v_clean_loc) < 2 OR char_length(v_clean_loc) > 80 THEN
    RAISE EXCEPTION 'Location must be between 2 and 80 characters.';
  END IF;

  IF cardinality(p_image_paths) > 4 THEN
    RAISE EXCEPTION 'A listing can include at most 4 images.';
  END IF;

  -- Validate image paths; also reject NULL elements within the array
  IF p_image_paths IS NOT NULL THEN
    FOREACH v_path IN ARRAY p_image_paths LOOP
      IF v_path IS NULL THEN
        RAISE EXCEPTION 'Image paths must not contain NULL values.';
      END IF;
      IF v_path !~ ('^' || v_caller_id::text || '/[A-Za-z0-9_.-]{1,100}$') THEN
        RAISE EXCEPTION 'Invalid or unauthorized image path format: %', v_path;
      END IF;
    END LOOP;
  END IF;

  IF v_clean_whatsapp IS NOT NULL THEN
    IF char_length(v_clean_whatsapp) < 7 OR char_length(v_clean_whatsapp) > 25 OR v_clean_whatsapp !~ '^[+]?[0-9\s\-]+$' THEN
      RAISE EXCEPTION 'Please provide a valid WhatsApp phone number.';
    END IF;
  END IF;

  -- 7. Insert listing
  INSERT INTO public.market_listings (
    seller_id,
    seller_name_masked,
    seller_verified,
    title,
    description,
    category,
    price_ngn,
    condition,
    location,
    image_paths,
    status,
    created_at,
    updated_at,
    expires_at
  )
  VALUES (
    v_caller_id,
    v_masked_name,
    COALESCE(v_is_verified, false),
    v_clean_title,
    v_clean_desc,
    p_category,
    p_price_ngn,
    COALESCE(p_condition, 'na'),
    v_clean_loc,
    COALESCE(p_image_paths, '{}'::text[]),
    'active',
    now(),
    now(),
    now() + interval '60 days'
  )
  RETURNING id INTO v_new_id;

  -- 8. Write WhatsApp contact to market_listing_contacts if provided
  IF v_clean_whatsapp IS NOT NULL THEN
    INSERT INTO public.market_listing_contacts (listing_id, whatsapp, created_at, updated_at)
    VALUES (v_new_id, v_clean_whatsapp, now(), now())
    ON CONFLICT (listing_id) DO UPDATE
    SET whatsapp = EXCLUDED.whatsapp, updated_at = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id',      v_new_id,
    'message', 'Listing created successfully'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_listing(text, text, text, numeric, text, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_listing(text, text, text, numeric, text, text, text[], text) TO authenticated;

-- ── 4. Update update_listing RPC ──────────────────────────────────────────────
-- Based on 0013_zed_market.sql:
-- Retains permissions check, ownership verification, and WhatsApp contact handling.
-- Validates that only the 11 new service categories are accepted.

CREATE OR REPLACE FUNCTION public.update_listing(
  p_listing_id       uuid,
  p_title            text,
  p_description      text,
  p_category         text,
  p_price_ngn        numeric,
  p_condition        text,
  p_location         text,
  p_image_paths      text[],
  p_contact_whatsapp text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id        uuid;
  v_existing_seller  uuid;
  v_existing_status  text;
  v_clean_title      text;
  v_clean_desc       text;
  v_clean_loc        text;
  v_clean_whatsapp   text;
  v_path             text;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT seller_id, status
  INTO v_existing_seller, v_existing_status
  FROM public.market_listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_existing_seller <> v_caller_id THEN
    RAISE EXCEPTION 'You do not have permission to edit this listing.';
  END IF;

  IF v_existing_status = 'removed' THEN
    RAISE EXCEPTION 'This listing was removed by moderators and cannot be edited.';
  END IF;

  v_clean_title    := trim(p_title);
  v_clean_desc     := trim(p_description);
  v_clean_loc      := trim(p_location);
  v_clean_whatsapp := NULLIF(trim(p_contact_whatsapp), '');

  IF char_length(v_clean_title) < 3 OR char_length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Title must be between 3 and 120 characters.';
  END IF;

  IF char_length(v_clean_desc) < 20 OR char_length(v_clean_desc) > 2000 THEN
    RAISE EXCEPTION 'Description must be between 20 and 2000 characters.';
  END IF;

  -- Strict validation: Only service categories allowed
  IF p_category NOT IN (
    'design-and-creative',
    'tech-and-development',
    'tutoring-and-lessons',
    'writing-and-translation',
    'photography-and-video',
    'fashion-and-beauty-services',
    'repairs-and-maintenance',
    'errands-and-delivery',
    'events-and-entertainment',
    'business-and-admin',
    'other-services'
  ) THEN
    RAISE EXCEPTION 'Invalid category selected. Zed Market only supports services.';
  END IF;

  IF p_price_ngn IS NOT NULL AND p_price_ngn < 0 THEN
    RAISE EXCEPTION 'Price must be 0 or greater, or left blank for contact-for-price.';
  END IF;

  IF p_condition NOT IN ('new', 'used', 'na') THEN
    RAISE EXCEPTION 'Condition must be new, used, or na.';
  END IF;

  IF char_length(v_clean_loc) < 2 OR char_length(v_clean_loc) > 80 THEN
    RAISE EXCEPTION 'Location must be between 2 and 80 characters.';
  END IF;

  IF cardinality(p_image_paths) > 4 THEN
    RAISE EXCEPTION 'A listing can include at most 4 images.';
  END IF;

  -- Validate image paths; also reject NULL elements within the array
  IF p_image_paths IS NOT NULL THEN
    FOREACH v_path IN ARRAY p_image_paths LOOP
      IF v_path IS NULL THEN
        RAISE EXCEPTION 'Image paths must not contain NULL values.';
      END IF;
      IF v_path !~ ('^' || v_caller_id::text || '/[A-Za-z0-9_.-]{1,100}$') THEN
        RAISE EXCEPTION 'Invalid or unauthorized image path format: %', v_path;
      END IF;
    END LOOP;
  END IF;

  IF v_clean_whatsapp IS NOT NULL THEN
    IF char_length(v_clean_whatsapp) < 7 OR char_length(v_clean_whatsapp) > 25 OR v_clean_whatsapp !~ '^[+]?[0-9\s\-]+$' THEN
      RAISE EXCEPTION 'Please provide a valid WhatsApp phone number.';
    END IF;
  END IF;

  -- Update listing fields
  UPDATE public.market_listings
  SET
    title       = v_clean_title,
    description = v_clean_desc,
    category    = p_category,
    price_ngn   = p_price_ngn,
    condition   = COALESCE(p_condition, 'na'),
    location    = v_clean_loc,
    image_paths = COALESCE(p_image_paths, '{}'::text[]),
    updated_at  = now()
  WHERE id = p_listing_id;

  -- Write or clear contact_whatsapp in market_listing_contacts
  IF v_clean_whatsapp IS NOT NULL THEN
    INSERT INTO public.market_listing_contacts (listing_id, whatsapp, created_at, updated_at)
    VALUES (p_listing_id, v_clean_whatsapp, now(), now())
    ON CONFLICT (listing_id) DO UPDATE
    SET whatsapp = EXCLUDED.whatsapp, updated_at = now();
  ELSE
    DELETE FROM public.market_listing_contacts
    WHERE listing_id = p_listing_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id',      p_listing_id,
    'message', 'Listing updated successfully'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_listing(uuid, text, text, text, numeric, text, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_listing(uuid, text, text, text, numeric, text, text, text[], text) TO authenticated;

COMMIT;
