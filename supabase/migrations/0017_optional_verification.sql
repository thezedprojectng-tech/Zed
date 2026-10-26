BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0017_optional_verification.sql
-- Zed Project: Make NIN Verification Optional
--
-- Summary of Changes:
-- 1. market_listings: Add seller_verified BOOLEAN NOT NULL DEFAULT FALSE.
--    Grant SELECT (seller_verified) to authenticated.
--    Backfill seller_verified from public.users.
--    Create bidirectional sync trigger on public.users (AFTER UPDATE OF is_verified).
-- 2. create_listing: Remove strict is_verified requirement.
--    Tiered active limits: 10 (verified) vs 3 (unverified).
--    Tiered 24h creation limits: 5 (verified) vs 2 (unverified).
--    Persist seller_verified upon creation. Keep 60 days expiration.
-- 3. report_listing: Allow any authenticated caller to report.
--    Only reports by verified users increment report_count and trigger auto-hide at >= 3.
-- 4. get_listing_contact: Remove strict is_verified requirement for caller.
--    Tiered 24h distinct contact views: 30 (verified) vs 10 (unverified).
--    Return seller_verified in JSON response.
-- 5. market_can_upload_image: Remove strict is_verified requirement.
--    Tiered image storage cap: 40 (verified) vs 12 (unverified).
-- 6. claim_daily_mining: Remove is_verified requirement so unverified users can mine.
-- 7. complete_lesson: Remove is_verified requirement so unverified users can learn.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Column Addition & Backfill: market_listings.seller_verified ───────────

ALTER TABLE public.market_listings
  ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN NOT NULL DEFAULT FALSE;

GRANT SELECT (seller_verified) ON public.market_listings TO authenticated;

-- Backfill existing listings from seller's current verification status
UPDATE public.market_listings ml
SET seller_verified = COALESCE(u.is_verified, FALSE)
FROM public.users u
WHERE ml.seller_id = u.id;

-- ── 2. Bidirectional Verification Sync Trigger on public.users ────────────────

CREATE OR REPLACE FUNCTION public.trg_sync_user_verification_to_market()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- When is_verified changes in either direction (true -> false or false/null -> true)
  IF (OLD.is_verified IS DISTINCT FROM NEW.is_verified) THEN
    UPDATE public.market_listings
    SET seller_verified = COALESCE(NEW.is_verified, FALSE),
        updated_at = now()
    WHERE seller_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_sync_verification_market ON public.users;
CREATE TRIGGER trg_users_sync_verification_market
  AFTER UPDATE OF is_verified ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_user_verification_to_market();

-- ── 3. Helper Function: market_can_upload_image ──────────────────────────────
-- Verified users: up to 40 images. Unverified users: up to 12 images.

CREATE OR REPLACE FUNCTION public.market_can_upload_image()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
DECLARE
  v_caller_id   uuid;
  v_is_verified boolean;
  v_count       integer;
  v_max_files   integer;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN false;
  END IF;

  -- Read verification status
  SELECT is_verified INTO v_is_verified
  FROM public.users
  WHERE id = v_caller_id;

  -- Tiered image limits
  v_max_files := CASE WHEN v_is_verified IS TRUE THEN 40 ELSE 12 END;

  -- Count existing objects in caller's user folder
  SELECT count(*) INTO v_count
  FROM storage.objects
  WHERE bucket_id = 'market-images'
    AND split_part(name, '/', 1) = v_caller_id::text;

  RETURN v_count < v_max_files;
END;
$$;

REVOKE ALL ON FUNCTION public.market_can_upload_image() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.market_can_upload_image() TO authenticated;

-- Ensure storage policy delegates to market_can_upload_image without recursive queries
DROP POLICY IF EXISTS "market-images: authenticated user insert" ON storage.objects;
CREATE POLICY "market-images: authenticated user insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'market-images'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND public.market_can_upload_image() IS TRUE
  );

-- ── 4. SECURITY DEFINER RPC: create_listing ──────────────────────────────────
-- Tiered limits:
-- Verified:   max 10 active listings, max 5 creations per 24 hours.
-- Unverified: max 3 active listings,  max 2 creations per 24 hours.

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
  --    The lock is released automatically at transaction end.
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

  IF p_category NOT IN ('electronics', 'fashion', 'books-and-notes', 'services', 'food', 'creative', 'other') THEN
    RAISE EXCEPTION 'Invalid category selected.';
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
    IF char_length(v_clean_whatsapp) < 7 OR char_length(v_clean_whatsapp) > 25 OR v_clean_whatsapp !~ '^\+?[0-9\s\-]+$' THEN
      RAISE EXCEPTION 'Please provide a valid WhatsApp phone number.';
    END IF;
  END IF;

  -- 7. Insert listing (no private data in market_listings)
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
    COALESCE(v_is_verified, FALSE),
    v_clean_title,
    v_clean_desc,
    p_category,
    p_price_ngn,
    p_condition,
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

-- ── 5. SECURITY DEFINER RPC: report_listing ──────────────────────────────────
-- Any authenticated user can submit a report.
-- Only reports by verified users count towards report_count and the 3-report auto-hide.

CREATE OR REPLACE FUNCTION public.report_listing(
  p_listing_id uuid,
  p_reason     text,
  p_note       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id               uuid;
  v_seller_id               uuid;
  v_status                  text;
  v_clean_note              text;
  v_verified_report_count   int;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_reason NOT IN ('scam', 'prohibited', 'duplicate', 'other') THEN
    RAISE EXCEPTION 'Invalid report reason.';
  END IF;

  v_clean_note := NULLIF(trim(p_note), '');
  IF v_clean_note IS NOT NULL AND char_length(v_clean_note) > 300 THEN
    RAISE EXCEPTION 'Report note cannot exceed 300 characters.';
  END IF;

  SELECT seller_id, status
  INTO v_seller_id, v_status
  FROM public.market_listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_seller_id = v_caller_id THEN
    RAISE EXCEPTION 'You cannot report your own listing.';
  END IF;

  -- Prevent duplicate reports by the same user on the same listing
  IF EXISTS (
    SELECT 1 FROM public.market_reports
    WHERE listing_id = p_listing_id AND reporter_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'You have already reported this listing.';
  END IF;

  -- Record report
  INSERT INTO public.market_reports (
    listing_id,
    reporter_id,
    reason,
    note,
    created_at
  )
  VALUES (
    p_listing_id,
    v_caller_id,
    p_reason,
    v_clean_note,
    now()
  );

  -- Count only UNDISMISSED reports from verified users
  SELECT count(*)
  INTO v_verified_report_count
  FROM public.market_reports r
  JOIN public.users u ON r.reporter_id = u.id
  WHERE r.listing_id    = p_listing_id
    AND u.is_verified   IS TRUE
    AND r.dismissed_at  IS NULL;

  -- Sync report_count on listing
  UPDATE public.market_listings
  SET report_count = v_verified_report_count, updated_at = now()
  WHERE id = p_listing_id;

  -- Auto-hide when undismissed verified report_count >= 3 and listing still active
  IF v_verified_report_count >= 3 AND v_status = 'active' THEN
    UPDATE public.market_listings
    SET
      status         = 'removed',
      removed_reason = 'Auto-hidden: Received 3 or more verified user reports pending admin review.',
      updated_at     = now()
    WHERE id = p_listing_id;
  END IF;

  RETURN jsonb_build_object(
    'success',    true,
    'listing_id', p_listing_id,
    'message',    'Report submitted. Thank you for keeping our marketplace safe.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.report_listing(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_listing(uuid, text, text) TO authenticated;

-- ── 6. SECURITY DEFINER RPC: get_listing_contact ─────────────────────────────
-- Caller must be authenticated (unverified callers now allowed).
-- Tiered 24h rate limit on distinct listings viewed:
-- Verified:   30 distinct listings per 24 hours.
-- Unverified: 10 distinct listings per 24 hours.
-- Returns seller_verified in the response JSON.

CREATE OR REPLACE FUNCTION public.get_listing_contact(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id        uuid;
  v_is_verified      boolean;
  v_contact          text;
  v_status           text;
  v_seller_id        uuid;
  v_seller_verified  boolean;
  v_expires_at       timestamptz;
  v_already_viewed   boolean;
  v_distinct_24h     int;
  v_max_contacts     int;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in to contact the seller.';
  END IF;

  SELECT is_verified
  INTO v_is_verified
  FROM public.users
  WHERE id = v_caller_id;

  SELECT status, seller_id, expires_at, seller_verified
  INTO v_status, v_seller_id, v_expires_at, v_seller_verified
  FROM public.market_listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Non-seller, non-admin callers: require listing to be active and unexpired
  IF v_seller_id <> v_caller_id AND public.is_admin() IS NOT TRUE THEN
    IF v_status <> 'active' OR v_expires_at <= now() THEN
      RAISE EXCEPTION 'This listing is no longer available.';
    END IF;
  END IF;

  -- Rate-limiting and view tracking (skip for seller viewing own listing or admin)
  IF v_seller_id <> v_caller_id AND public.is_admin() IS NOT TRUE THEN

    -- Has this user already viewed this specific listing in the last 24 hours?
    SELECT EXISTS (
      SELECT 1 FROM public.market_contact_views
      WHERE user_id    = v_caller_id
        AND listing_id = p_listing_id
        AND created_at > (now() - interval '24 hours')
    ) INTO v_already_viewed;

    IF NOT v_already_viewed THEN
      -- Tiered limits: 30 for verified, 10 for unverified
      v_max_contacts := CASE WHEN v_is_verified IS TRUE THEN 30 ELSE 10 END;

      -- Count distinct listings seen by this user in the last 24 hours
      SELECT count(DISTINCT listing_id)
      INTO v_distinct_24h
      FROM public.market_contact_views
      WHERE user_id    = v_caller_id
        AND created_at > (now() - interval '24 hours');

      IF v_distinct_24h >= v_max_contacts THEN
        IF v_is_verified IS TRUE THEN
          RAISE EXCEPTION 'Daily contact limit reached: You can view at most 30 seller contacts per 24 hours.';
        ELSE
          RAISE EXCEPTION 'Daily contact limit reached: Unverified accounts can view at most 10 seller contacts per 24 hours. Verify your account to view up to 30 contacts.';
        END IF;
      END IF;

      -- Record this contact view
      INSERT INTO public.market_contact_views (user_id, listing_id, created_at)
      VALUES (v_caller_id, p_listing_id, now());
    END IF;
    -- If already_viewed = true: return the contact silently without re-inserting
  END IF;

  -- Read from isolated market_listing_contacts table
  SELECT whatsapp
  INTO v_contact
  FROM public.market_listing_contacts
  WHERE listing_id = p_listing_id;

  IF v_contact IS NULL OR v_contact = '' THEN
    RETURN jsonb_build_object(
      'success',         true,
      'has_contact',     false,
      'whatsapp',        NULL,
      'seller_verified', COALESCE(v_seller_verified, FALSE),
      'message',         'The seller has not provided a WhatsApp contact number.'
    );
  END IF;

  RETURN jsonb_build_object(
    'success',         true,
    'has_contact',     true,
    'whatsapp',        v_contact,
    'seller_verified', COALESCE(v_seller_verified, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;

-- ── 7. SECURITY DEFINER RPC: claim_daily_mining ──────────────────────────────
-- Live production definition with the is_verified check removed.

CREATE OR REPLACE FUNCTION public.claim_daily_mining()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id     uuid;
  v_level_id    smallint;
  v_multiplier  numeric(3,1);
  v_amount      numeric(8,2);
  v_today       date;
  v_last_date   date;
  v_wallet      record;
  v_streak      int;
  v_new_balance numeric(12,2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT level_id INTO v_level_id
  FROM   public.users
  WHERE  id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  v_multiplier := CASE v_level_id
    WHEN 2 THEN 2.0
    WHEN 3 THEN 3.5
    WHEN 4 THEN 5.0
    WHEN 5 THEN 10.0
    ELSE        1.0
  END;

  v_amount := ROUND(100.0 * v_multiplier, 2);
  v_today  := (now() AT TIME ZONE 'Africa/Lagos')::date;

  IF EXISTS (
    SELECT 1 FROM public.mining_logs
    WHERE user_id = v_user_id AND claim_date = v_today
  ) THEN
    RAISE EXCEPTION 'Already claimed today';
  END IF;

  SELECT * INTO v_wallet
  FROM   public.token_wallets
  WHERE  user_id = v_user_id
  FOR UPDATE;

  IF FOUND THEN
    v_last_date := (v_wallet.last_mined_at AT TIME ZONE 'Africa/Lagos')::date;
    IF v_last_date = v_today THEN
      RAISE EXCEPTION 'Already claimed today';
    END IF;

    IF v_last_date = v_today - 1 THEN
      v_streak := v_wallet.streak_days + 1;
    ELSE
      v_streak := 1;
    END IF;

    v_new_balance := v_wallet.balance_zed + v_amount;

    UPDATE public.token_wallets SET
      balance_zed   = v_new_balance,
      total_mined   = total_mined + v_amount,
      streak_days   = v_streak,
      last_mined_at = now(),
      updated_at    = now()
    WHERE user_id = v_user_id;
  ELSE
    v_streak := 1;
    v_new_balance := v_amount;

    INSERT INTO public.token_wallets
      (user_id, balance_zed, total_mined, streak_days, last_mined_at, updated_at)
    VALUES
      (v_user_id, v_amount, v_amount, 1, now(), now());
  END IF;

  INSERT INTO public.mining_logs
    (user_id, amount_mined, multiplier_applied, claim_date, mined_at)
  VALUES
    (v_user_id, v_amount, v_multiplier, v_today, now());

  RETURN jsonb_build_object(
    'ok',          true,
    'amount',      v_amount,
    'new_balance', v_new_balance,
    'streak_days', v_streak
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Already claimed today';
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_daily_mining() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_mining() TO authenticated;

-- ── 8. SECURITY DEFINER RPC: complete_lesson ─────────────────────────────────
-- Live production definition with the is_verified check removed.
-- Targets public.skill_progress.

CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id             uuid;
  v_lesson_points       int;
  v_already_completed   boolean;
  v_points_awarded      int := 0;
  v_total_skill_points  int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT l.skill_points
  INTO   v_lesson_points
  FROM   public.skill_lessons l
  JOIN   public.skill_tracks t ON t.id = l.track_id
  WHERE  l.id = p_lesson_id
    AND  t.is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.skill_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id
  ) INTO v_already_completed;

  IF NOT v_already_completed THEN
    INSERT INTO public.skill_progress (user_id, lesson_id, points_awarded, completed_at)
    VALUES (v_user_id, p_lesson_id, v_lesson_points, now())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    IF FOUND THEN
      v_points_awarded := v_lesson_points;
    ELSE
      v_already_completed := true;
      v_points_awarded := 0;
    END IF;
  END IF;

  SELECT COALESCE(SUM(p.points_awarded), 0)::int
  INTO   v_total_skill_points
  FROM   public.skill_progress p
  WHERE  p.user_id = v_user_id;

  RETURN jsonb_build_object(
    'ok',                 true,
    'points_awarded',     v_points_awarded,
    'total_skill_points', v_total_skill_points,
    'already_completed',  v_already_completed
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_lesson(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_lesson(uuid) TO authenticated;

COMMIT;
