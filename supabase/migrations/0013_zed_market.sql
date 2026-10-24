-- â”€â”€â”€ 0013_zed_market.sql â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Zed Market v1: Peer-to-peer classified listings and verified WhatsApp contact.
-- Scope: Listings, safety moderation, report threshold, image storage, admin review.
-- Explicitly NOT included: payments, escrow, delivery, chat, ratings, token spending.
-- ALL statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€ 1. Helper Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Create handle_updated_at only if it does not already exist (avoids overwriting
-- any customised version from an earlier migration such as 0001_init.sql).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_updated_at'
  ) THEN
    EXECUTE $func$
      CREATE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $inner$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $inner$;
    $func$;
  END IF;
END;
$$;

-- mask_user_name is intentionally NOT redefined here; the function already
-- exists from an earlier migration. The DO block below creates a minimal
-- fallback only if it is genuinely absent, keeping this file self-contained.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'mask_user_name'
  ) THEN
    EXECUTE $func$
      CREATE FUNCTION public.mask_user_name(p_name text)
      RETURNS text
      LANGUAGE plpgsql
      IMMUTABLE
      AS $inner$
      DECLARE
        v_trimmed text;
        v_parts   text[];
      BEGIN
        IF p_name IS NULL THEN RETURN 'User'; END IF;
        v_trimmed := trim(p_name);
        IF v_trimmed = '' THEN RETURN 'User'; END IF;
        v_parts := regexp_split_to_array(v_trimmed, '\s+');
        IF array_length(v_parts, 1) = 1 THEN RETURN v_parts[1]; END IF;
        RETURN v_parts[1] || ' ' || upper(substr(v_parts[array_length(v_parts, 1)], 1, 1)) || '.';
      END;
      $inner$;
    $func$;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mask_user_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mask_user_name(text) TO authenticated;

-- â”€â”€ 2. Create market_listings Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.market_listings (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_name_masked  text           NOT NULL DEFAULT 'User',
  title               text           NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 120),
  description         text           NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 2000),
  category            text           NOT NULL CHECK (category IN (
                                       'electronics',
                                       'fashion',
                                       'books-and-notes',
                                       'services',
                                       'food',
                                       'creative',
                                       'other'
                                     )),
  price_ngn           numeric(14,2)  CHECK (price_ngn IS NULL OR price_ngn >= 0),
  condition           text           NOT NULL CHECK (condition IN ('new', 'used', 'na')),
  location            text           NOT NULL CHECK (char_length(location) >= 2 AND char_length(location) <= 80),
  image_paths         text[]         NOT NULL DEFAULT '{}'::text[] CHECK (cardinality(image_paths) <= 4),
  status              text           NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed')),
  removed_reason      text           CHECK (removed_reason IS NULL OR char_length(removed_reason) <= 500),
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now(),
  expires_at          timestamptz    NOT NULL DEFAULT (now() + interval '60 days'),
  report_count        int            NOT NULL DEFAULT 0 CHECK (report_count >= 0)
);

-- Ensure seller_name_masked column exists if table was previously created
ALTER TABLE public.market_listings
  ADD COLUMN IF NOT EXISTS seller_name_masked text NOT NULL DEFAULT 'User';

-- Ensure contact_whatsapp is removed from market_listings if it was previously present
ALTER TABLE public.market_listings
  DROP COLUMN IF EXISTS contact_whatsapp;

-- Indexes
CREATE INDEX IF NOT EXISTS market_listings_status_expires_created_idx
  ON public.market_listings (status, expires_at, created_at DESC);

CREATE INDEX IF NOT EXISTS market_listings_category_idx
  ON public.market_listings (category, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS market_listings_seller_id_idx
  ON public.market_listings (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS market_listings_report_count_idx
  ON public.market_listings (report_count DESC)
  WHERE report_count > 0;

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS market_listings_updated_at ON public.market_listings;
CREATE TRIGGER market_listings_updated_at
  BEFORE UPDATE ON public.market_listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- â”€â”€ 3. Create market_listing_contacts Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Isolated contact details: only accessible by the seller and admins via RLS,
-- or revealed to verified users via the get_listing_contact RPC.

CREATE TABLE IF NOT EXISTS public.market_listing_contacts (
  listing_id   uuid         PRIMARY KEY REFERENCES public.market_listings(id) ON DELETE CASCADE,
  whatsapp     text         NOT NULL CHECK (
                               char_length(whatsapp) >= 7 AND
                               char_length(whatsapp) <= 25 AND
                               whatsapp ~* '^\+?[0-9\s\-]+$'
                             ),
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS market_listing_contacts_updated_at ON public.market_listing_contacts;
CREATE TRIGGER market_listing_contacts_updated_at
  BEFORE UPDATE ON public.market_listing_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- â”€â”€ 4. Create market_reports Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.market_reports (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid         NOT NULL REFERENCES public.market_listings(id) ON DELETE CASCADE,
  reporter_id   uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason        text         NOT NULL CHECK (reason IN ('scam', 'prohibited', 'duplicate', 'other')),
  note          text         CHECK (note IS NULL OR char_length(note) <= 300),
  created_at    timestamptz  NOT NULL DEFAULT now(),
  dismissed_at  timestamptz  DEFAULT NULL,
  CONSTRAINT market_reports_unique_listing_reporter UNIQUE (listing_id, reporter_id)
);

-- Idempotently add dismissed_at if the table already existed without it
ALTER TABLE public.market_reports
  ADD COLUMN IF NOT EXISTS dismissed_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS market_reports_listing_id_idx
  ON public.market_reports (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS market_reports_reporter_id_idx
  ON public.market_reports (reporter_id, created_at DESC);

-- â”€â”€ 5. Create market_contact_views Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Rate limiting tracking: max 30 distinct listing contact reveals per user per 24 hours.

CREATE TABLE IF NOT EXISTS public.market_contact_views (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id  uuid         NOT NULL REFERENCES public.market_listings(id) ON DELETE CASCADE,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_contact_views_user_created_idx
  ON public.market_contact_views (user_id, created_at DESC);

-- â”€â”€ 6. Storage Bucket: market-images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Insert private bucket config idempotently
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'market-images',
  'market-images',
  false,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove any previously created public read policy
DROP POLICY IF EXISTS "market-images: public read" ON storage.objects;

-- Storage SELECT: own folder OR admin OR image belongs to an active, unexpired listing.
-- The third arm allows any authenticated user to see images for browsable listings â€”
-- this is required because the /api/market/image route proxies images server-side
-- using the session cookie, so the policy must cover general authenticated access.
DROP POLICY IF EXISTS "market-images: authenticated read" ON storage.objects;
CREATE POLICY "market-images: authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'market-images'
    AND (
      -- Own folder (seller always sees their own images, e.g. in edit form)
      split_part(name, '/', 1) = auth.uid()::text
      -- Admin bypass
      OR public.is_admin() IS TRUE
      -- Image referenced by an active, non-expired listing (enables feed browsing)
      OR EXISTS (
        SELECT 1 FROM public.market_listings l
        WHERE l.status = 'active'
          AND l.expires_at > now()
          AND name = ANY(l.image_paths)
      )
    )
  );

-- Storage INSERT: verified caller, own folder, fewer than 40 existing objects
DROP POLICY IF EXISTS "market-images: authenticated user insert" ON storage.objects;
CREATE POLICY "market-images: authenticated user insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'market-images'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND (
      SELECT is_verified FROM public.users WHERE id = auth.uid()
    ) IS TRUE
    AND (
      SELECT count(*) FROM storage.objects
      WHERE bucket_id = 'market-images'
        AND split_part(name, '/', 1) = auth.uid()::text
    ) < 40
  );

-- Storage DELETE: own images only
DROP POLICY IF EXISTS "market-images: authenticated user delete" ON storage.objects;
CREATE POLICY "market-images: authenticated user delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'market-images'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- â”€â”€ 7. Permissions & Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_listing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_contact_views ENABLE ROW LEVEL SECURITY;

-- Revoke ALL from authenticated before re-granting SELECT only.
-- This ensures no INSERT/UPDATE/DELETE can slip through directly.
REVOKE ALL ON public.market_listings FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.market_listing_contacts FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.market_reports FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.market_contact_views FROM anon, authenticated, PUBLIC;

-- Grant SELECT only (all writes are through SECURITY DEFINER RPCs)
GRANT SELECT ON public.market_listings TO authenticated;
GRANT SELECT ON public.market_listing_contacts TO authenticated;
GRANT SELECT ON public.market_reports TO authenticated;
GRANT SELECT ON public.market_contact_views TO authenticated;

-- RLS: market_listings SELECT policy
DROP POLICY IF EXISTS "market_listings: select access" ON public.market_listings;
CREATE POLICY "market_listings: select access"
  ON public.market_listings
  FOR SELECT
  TO authenticated
  USING (
    (status = 'active' AND expires_at > now())
    OR seller_id = auth.uid()
    OR public.is_admin() IS TRUE
  );

-- RLS: market_listing_contacts SELECT policy (seller and admin only)
DROP POLICY IF EXISTS "market_listing_contacts: seller and admin select" ON public.market_listing_contacts;
CREATE POLICY "market_listing_contacts: seller and admin select"
  ON public.market_listing_contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.market_listings l
      WHERE l.id = market_listing_contacts.listing_id
        AND (l.seller_id = auth.uid() OR public.is_admin() IS TRUE)
    )
  );

-- RLS: market_reports SELECT policy
DROP POLICY IF EXISTS "market_reports: select access" ON public.market_reports;
CREATE POLICY "market_reports: select access"
  ON public.market_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.is_admin() IS TRUE
  );

-- RLS: market_contact_views SELECT policy
DROP POLICY IF EXISTS "market_contact_views: select access" ON public.market_contact_views;
CREATE POLICY "market_contact_views: select access"
  ON public.market_contact_views
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin() IS TRUE
  );

-- â”€â”€ 8. SECURITY DEFINER RPC: create_listing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Only verified users can create marketplace listings. Please verify your account first.';
  END IF;

  v_masked_name := public.mask_user_name(v_full_name);

  -- 4. Active listings limit (max 10 active)
  SELECT count(*)
  INTO v_active_count
  FROM public.market_listings
  WHERE seller_id = v_caller_id
    AND status = 'active'
    AND expires_at > now();

  IF v_active_count >= 10 THEN
    RAISE EXCEPTION 'You have reached the limit of 10 active listings. Please mark completed listings as sold or delete inactive ones.';
  END IF;

  -- 5. 24-hour rate limit (max 5 creations per 24 hours)
  SELECT count(*)
  INTO v_recent_count
  FROM public.market_listings
  WHERE seller_id = v_caller_id
    AND created_at > (now() - interval '24 hours');

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Daily limit reached: You can create at most 5 listings every 24 hours.';
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

-- â”€â”€ 9. SECURITY DEFINER RPC: update_listing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  -- Update listing fields (no private contact stored in market_listings)
  UPDATE public.market_listings
  SET
    title       = v_clean_title,
    description = v_clean_desc,
    category    = p_category,
    price_ngn   = p_price_ngn,
    condition   = p_condition,
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

-- â”€â”€ 10. SECURITY DEFINER RPC: mark_listing_sold â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.mark_listing_sold(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id       uuid;
  v_existing_seller uuid;
  v_existing_status text;
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
    RAISE EXCEPTION 'You do not have permission to modify this listing.';
  END IF;

  IF v_existing_status = 'removed' THEN
    RAISE EXCEPTION 'Removed listings cannot be marked as sold.';
  END IF;

  UPDATE public.market_listings
  SET status = 'sold', updated_at = now()
  WHERE id = p_listing_id;

  RETURN jsonb_build_object(
    'success', true,
    'id',      p_listing_id,
    'status',  'sold'
  );
END;
$$;

-- â”€â”€ 11. SECURITY DEFINER RPC: delete_my_listing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Always soft-deletes: sets status='removed', removed_reason='Deleted by seller',
-- and removes the row from market_listing_contacts (phone no longer needed).
-- Raises an error if the listing is already removed.
-- Never hard-deletes, so the moderation audit trail is preserved.

CREATE OR REPLACE FUNCTION public.delete_my_listing(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id       uuid;
  v_existing_seller uuid;
  v_existing_status text;
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
    RAISE EXCEPTION 'You do not have permission to delete this listing.';
  END IF;

  IF v_existing_status = 'removed' THEN
    RAISE EXCEPTION 'This listing has already been removed.';
  END IF;

  -- Always soft-delete: preserve row for moderation audit trail
  UPDATE public.market_listings
  SET
    status         = 'removed',
    removed_reason = 'Deleted by seller',
    updated_at     = now()
  WHERE id = p_listing_id;

  -- Remove contact details â€” no longer needed after deletion
  DELETE FROM public.market_listing_contacts
  WHERE listing_id = p_listing_id;

  RETURN jsonb_build_object(
    'success', true,
    'id',      p_listing_id,
    'type',    'soft_delete',
    'message', 'Listing removed from marketplace'
  );
END;
$$;

-- â”€â”€ 12. SECURITY DEFINER RPC: report_listing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Reporter must be verified.
-- Auto-hide threshold counts only verified reports where dismissed_at IS NULL.

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
  v_is_verified             boolean;
  v_seller_id               uuid;
  v_status                  text;
  v_clean_note              text;
  v_verified_report_count   int;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Reporter must be verified
  SELECT is_verified
  INTO v_is_verified
  FROM public.users
  WHERE id = v_caller_id;

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Only verified users can submit marketplace reports.';
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

-- â”€â”€ 13. SECURITY DEFINER RPC: get_listing_contact â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Caller must be verified.
-- Non-seller, non-admin callers: listing must be active AND expires_at > now().
-- Rate limit: 30 distinct listings per user per 24 hours.
-- If the caller already viewed this listing in the last 24h, skip the insert
-- and skip the limit check entirely.

CREATE OR REPLACE FUNCTION public.get_listing_contact(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id      uuid;
  v_is_verified    boolean;
  v_contact        text;
  v_status         text;
  v_seller_id      uuid;
  v_expires_at     timestamptz;
  v_already_viewed boolean;
  v_distinct_24h   int;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in to contact the seller.';
  END IF;

  SELECT is_verified
  INTO v_is_verified
  FROM public.users
  WHERE id = v_caller_id;

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Only verified users can view seller contact details. Please complete verification on your profile.';
  END IF;

  SELECT status, seller_id, expires_at
  INTO v_status, v_seller_id, v_expires_at
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
      -- Count distinct listings seen by this user in the last 24 hours
      SELECT count(DISTINCT listing_id)
      INTO v_distinct_24h
      FROM public.market_contact_views
      WHERE user_id    = v_caller_id
        AND created_at > (now() - interval '24 hours');

      IF v_distinct_24h >= 30 THEN
        RAISE EXCEPTION 'Daily contact limit reached: You can view at most 30 seller contacts per 24 hours.';
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
      'success',     true,
      'has_contact', false,
      'whatsapp',    NULL,
      'message',     'The seller has not provided a WhatsApp contact number.'
    );
  END IF;

  RETURN jsonb_build_object(
    'success',     true,
    'has_contact', true,
    'whatsapp',    v_contact
  );
END;
$$;

-- â”€â”€ 14. SECURITY DEFINER RPC: get_my_listing_contact â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- For edit form: seller or admin can retrieve their existing contact_whatsapp.
-- When an admin who is not the seller reads the contact, an audit log row is written.

CREATE OR REPLACE FUNCTION public.get_my_listing_contact(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id       uuid;
  v_existing_seller uuid;
  v_listing_title   text;
  v_contact         text;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT seller_id, title
  INTO v_existing_seller, v_listing_title
  FROM public.market_listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_existing_seller <> v_caller_id AND public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'You do not have permission to view this contact information.';
  END IF;

  -- Write admin audit log when an admin reads someone else's contact
  IF public.is_admin() IS TRUE AND v_existing_seller <> v_caller_id THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    )
    VALUES (
      v_caller_id,
      'admin_view_listing_contact',
      'market_listings',
      p_listing_id::text,
      jsonb_build_object(
        'title',     v_listing_title,
        'seller_id', v_existing_seller
      )
    );
  END IF;

  SELECT whatsapp
  INTO v_contact
  FROM public.market_listing_contacts
  WHERE listing_id = p_listing_id;

  RETURN jsonb_build_object(
    'success',     true,
    'has_contact', (v_contact IS NOT NULL),
    'whatsapp',    v_contact
  );
END;
$$;

-- â”€â”€ 15. Admin RPC: admin_remove_listing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.admin_remove_listing(
  p_listing_id uuid,
  p_reason     text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id     uuid;
  v_title        text;
  v_seller_id    uuid;
  v_old_status   text;
  v_clean_reason text;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id     := auth.uid();
  v_clean_reason := trim(p_reason);

  IF char_length(v_clean_reason) < 3 THEN
    RAISE EXCEPTION 'A removal reason of at least 3 characters is required.';
  END IF;

  SELECT title, seller_id, status
  INTO v_title, v_seller_id, v_old_status
  FROM public.market_listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found: %', p_listing_id;
  END IF;

  UPDATE public.market_listings
  SET
    status         = 'removed',
    removed_reason = v_clean_reason,
    updated_at     = now()
  WHERE id = p_listing_id;

  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'admin_remove_listing',
    'market_listings',
    p_listing_id::text,
    jsonb_build_object(
      'title',      v_title,
      'seller_id',  v_seller_id,
      'old_status', v_old_status,
      'reason',     v_clean_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'id',      p_listing_id,
    'status',  'removed',
    'reason',  v_clean_reason
  );
END;
$$;

-- â”€â”€ 16. Admin RPC: admin_restore_listing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Restores a removed listing to active, resets report_count,
-- and dismisses all existing reports by setting dismissed_at = now().

CREATE OR REPLACE FUNCTION public.admin_restore_listing(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id   uuid;
  v_title      text;
  v_seller_id  uuid;
  v_old_status text;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  SELECT title, seller_id, status
  INTO v_title, v_seller_id, v_old_status
  FROM public.market_listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found: %', p_listing_id;
  END IF;

  -- Restore listing
  UPDATE public.market_listings
  SET
    status         = 'active',
    removed_reason = NULL,
    report_count   = 0,
    updated_at     = now(),
    expires_at     = now() + interval '60 days'
  WHERE id = p_listing_id;

  -- Dismiss all existing reports so future report_count starts from 0
  UPDATE public.market_reports
  SET dismissed_at = now()
  WHERE listing_id   = p_listing_id
    AND dismissed_at IS NULL;

  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'admin_restore_listing',
    'market_listings',
    p_listing_id::text,
    jsonb_build_object(
      'title',      v_title,
      'seller_id',  v_seller_id,
      'old_status', v_old_status
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'id',      p_listing_id,
    'status',  'active'
  );
END;
$$;

-- â”€â”€ 17. Function Grants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

REVOKE EXECUTE ON FUNCTION public.create_listing(text, text, text, numeric, text, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_listing(text, text, text, numeric, text, text, text[], text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_listing(uuid, text, text, text, numeric, text, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_listing(uuid, text, text, text, numeric, text, text, text[], text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_listing_sold(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_listing_sold(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_my_listing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_listing(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.report_listing(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_listing(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_listing_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_listing_contact(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_remove_listing(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_listing(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_restore_listing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_restore_listing(uuid) TO authenticated;
