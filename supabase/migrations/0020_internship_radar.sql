-- ==============================================================================
-- Migration 0020: Internship Radar
-- 
-- 1. Table `public.internships` (Public, no submitter or reviewer columns)
-- 2. Table `public.internship_reviews` (Private, holds submitter/reviewer data)
-- 3. Row Level Security & Column Grants
-- 4. RPCs: submit_internship_lead, my_internship_submissions,
--    admin_publish_internship, admin_reject_internship,
--    admin_unpublish_internship, admin_delete_internship
-- ==============================================================================

BEGIN;

-- 1. Create public.internships table
CREATE TABLE IF NOT EXISTS public.internships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  organization TEXT NOT NULL,
  location     TEXT NOT NULL,
  work_mode    TEXT NOT NULL,
  field        TEXT NOT NULL,
  type         TEXT NOT NULL,
  paid_status  TEXT NOT NULL,
  description  TEXT NOT NULL,
  eligibility  TEXT,
  apply_url    TEXT,
  apply_email  TEXT,
  deadline     DATE,
  status       TEXT NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT internships_title_len CHECK (char_length(trim(title)) BETWEEN 5 AND 120),
  CONSTRAINT internships_org_len CHECK (char_length(trim(organization)) BETWEEN 2 AND 100),
  CONSTRAINT internships_location_len CHECK (char_length(trim(location)) BETWEEN 2 AND 100),
  CONSTRAINT internships_desc_len CHECK (char_length(trim(description)) BETWEEN 30 AND 3000),
  CONSTRAINT internships_eligibility_len CHECK (eligibility IS NULL OR char_length(eligibility) <= 1500),
  CONSTRAINT internships_apply_email_len CHECK (apply_email IS NULL OR char_length(apply_email) <= 120),
  CONSTRAINT internships_work_mode_check CHECK (work_mode IN ('remote', 'onsite', 'hybrid')),
  CONSTRAINT internships_field_check CHECK (
    field IN (
      'tech',
      'design',
      'marketing',
      'finance',
      'engineering',
      'media',
      'healthcare',
      'business',
      'legal',
      'other'
    )
  ),
  CONSTRAINT internships_type_check CHECK (
    type IN (
      'internship',
      'siwes',
      'industrial-training',
      'graduate-trainee',
      'volunteer',
      'fellowship',
      'other'
    )
  ),
  CONSTRAINT internships_paid_status_check CHECK (paid_status IN ('paid', 'unpaid', 'stipend', 'unknown')),
  CONSTRAINT internships_status_check CHECK (status IN ('pending', 'published', 'rejected', 'expired')),
  CONSTRAINT internships_contact_method CHECK (
    (apply_url IS NOT NULL AND trim(apply_url) <> '') OR
    (apply_email IS NOT NULL AND trim(apply_email) <> '')
  )
);

-- 2. Create private public.internship_reviews table
-- Stores submitter and reviewer data isolated from public table
CREATE TABLE IF NOT EXISTS public.internship_reviews (
  internship_id    UUID PRIMARY KEY REFERENCES public.internships(id) ON DELETE CASCADE,
  submitted_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS internships_status_deadline_idx 
  ON public.internships (status, deadline);

CREATE INDEX IF NOT EXISTS internships_published_at_idx 
  ON public.internships (published_at DESC) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS internships_field_idx 
  ON public.internships (field) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS internships_work_mode_idx 
  ON public.internships (work_mode) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS internships_paid_status_idx 
  ON public.internships (paid_status) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS internships_apply_url_lower_idx 
  ON public.internships (lower(apply_url)) 
  WHERE apply_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS internship_reviews_submitted_by_idx 
  ON public.internship_reviews (submitted_by);

CREATE INDEX IF NOT EXISTS internship_reviews_reviewed_by_idx 
  ON public.internship_reviews (reviewed_by);

-- 4. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_internships_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_internships_updated ON public.internships;
CREATE TRIGGER on_internships_updated
  BEFORE UPDATE ON public.internships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_internships_updated_at();

-- 5. Row Level Security & Permissions
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_reviews ENABLE ROW LEVEL SECURITY;

-- Grants for internships:
-- Anon and authenticated can read via policy, service_role can do all
REVOKE ALL ON public.internships FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.internships TO anon, authenticated;
GRANT ALL ON public.internships TO service_role;

-- Grants for internship_reviews:
-- Authenticated users have SELECT grant, BUT RLS permits only admins!
REVOKE ALL ON public.internship_reviews FROM PUBLIC, anon;
GRANT SELECT ON public.internship_reviews TO authenticated;
GRANT ALL ON public.internship_reviews TO service_role;

-- Policies for public.internships
DROP POLICY IF EXISTS "internships: public select published" ON public.internships;
CREATE POLICY "internships: public select published"
  ON public.internships
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published' AND (deadline IS NULL OR deadline >= CURRENT_DATE)
  );

DROP POLICY IF EXISTS "internships: admin all" ON public.internships;
CREATE POLICY "internships: admin all"
  ON public.internships
  FOR ALL
  TO authenticated
  USING (public.is_admin() IS TRUE)
  WITH CHECK (public.is_admin() IS TRUE);

-- Policies for public.internship_reviews
-- Admin only: non-admin authenticated users evaluate to FALSE and see 0 rows.
DROP POLICY IF EXISTS "internship_reviews: admin select all" ON public.internship_reviews;
CREATE POLICY "internship_reviews: admin select all"
  ON public.internship_reviews
  FOR SELECT
  TO authenticated
  USING (public.is_admin() IS TRUE);

-- ==============================================================================
-- SQL PROOF DEMONSTRATIONS:
-- 1. Structurally Impossible to Leak submitter/reviewer from public.internships:
--    SELECT submitted_by, reviewed_by, rejection_reason FROM public.internships;
--    --> ERROR: column "submitted_by" does not exist (Proof: columns are isolated)
-- 
-- 2. Non-admin authenticated user reading internship_reviews:
--    SELECT * FROM public.internship_reviews;
--    --> Returns 0 rows (Proof: RLS policy "internship_reviews: admin select all" 
--        requires public.is_admin() IS TRUE; non-admins get empty set)
-- 
-- 3. Anonymous user reading internship_reviews:
--    SELECT * FROM public.internship_reviews;
--    --> ERROR: permission denied for table internship_reviews (Proof: REVOKE ALL FROM anon)
-- ==============================================================================

-- 6. RPC: submit_internship_lead (Authenticated users)
CREATE OR REPLACE FUNCTION public.submit_internship_lead(
  p_title TEXT,
  p_organization TEXT,
  p_location TEXT,
  p_work_mode TEXT,
  p_field TEXT,
  p_type TEXT,
  p_paid_status TEXT,
  p_description TEXT,
  p_eligibility TEXT DEFAULT NULL,
  p_apply_url TEXT DEFAULT NULL,
  p_apply_email TEXT DEFAULT NULL,
  p_deadline DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_internship_id UUID;
  v_recent_count INT;
  v_pending_count INT;
  v_clean_title TEXT;
  v_clean_org TEXT;
  v_clean_location TEXT;
  v_clean_desc TEXT;
  v_clean_eligibility TEXT;
  v_clean_apply_url TEXT;
  v_clean_apply_email TEXT;
BEGIN
  -- 1. Ensure authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Advisory lock per user to avoid race condition on rate limit counts
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- 3. Clean and sanitize text fields
  v_clean_title := trim(p_title);
  v_clean_org := trim(p_organization);
  v_clean_location := trim(p_location);
  v_clean_desc := trim(p_description);
  v_clean_eligibility := NULLIF(trim(p_eligibility), '');
  v_clean_apply_url := NULLIF(trim(p_apply_url), '');
  v_clean_apply_email := NULLIF(lower(trim(p_apply_email)), '');

  -- 4. Validate lengths
  IF char_length(v_clean_title) < 5 OR char_length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Title must be between 5 and 120 characters';
  END IF;

  IF char_length(v_clean_org) < 2 OR char_length(v_clean_org) > 100 THEN
    RAISE EXCEPTION 'Organization must be between 2 and 100 characters';
  END IF;

  IF char_length(v_clean_location) < 2 OR char_length(v_clean_location) > 100 THEN
    RAISE EXCEPTION 'Location must be between 2 and 100 characters';
  END IF;

  IF char_length(v_clean_desc) < 30 OR char_length(v_clean_desc) > 3000 THEN
    RAISE EXCEPTION 'Description must be between 30 and 3000 characters';
  END IF;

  IF v_clean_eligibility IS NOT NULL AND char_length(v_clean_eligibility) > 1500 THEN
    RAISE EXCEPTION 'Eligibility criteria cannot exceed 1500 characters';
  END IF;

  -- 5. Validate work_mode, field, type, and paid_status
  IF p_work_mode NOT IN ('remote', 'onsite', 'hybrid') THEN
    RAISE EXCEPTION 'Please select a valid work mode (remote, onsite, or hybrid).';
  END IF;

  IF p_field NOT IN (
    'tech',
    'design',
    'marketing',
    'finance',
    'engineering',
    'media',
    'healthcare',
    'business',
    'legal',
    'other'
  ) THEN
    RAISE EXCEPTION 'Please select a valid field or discipline.';
  END IF;

  IF p_type NOT IN (
    'internship',
    'siwes',
    'industrial-training',
    'graduate-trainee',
    'volunteer',
    'fellowship',
    'other'
  ) THEN
    RAISE EXCEPTION 'Please select a valid internship type.';
  END IF;

  IF p_paid_status NOT IN ('paid', 'unpaid', 'stipend', 'unknown') THEN
    RAISE EXCEPTION 'Please select a valid compensation status (paid, unpaid, stipend, or unknown).';
  END IF;

  -- 6. Validate contact method
  IF v_clean_apply_url IS NULL AND v_clean_apply_email IS NULL THEN
    RAISE EXCEPTION 'Please provide at least one contact method: Application URL or Application Email.';
  END IF;

  IF v_clean_apply_url IS NOT NULL THEN
    IF v_clean_apply_url ~ '\s' OR v_clean_apply_url ~ '@' OR v_clean_apply_url !~* '^https://[^\s@]+$' OR char_length(v_clean_apply_url) > 500 THEN
      RAISE EXCEPTION 'Application URL must be a valid https:// URL without credentials, spaces, or exceeding 500 characters';
    END IF;

    -- Reject duplicate apply_url in pending or published
    IF EXISTS (
      SELECT 1 FROM public.internships
      WHERE lower(apply_url) = lower(v_clean_apply_url)
        AND status IN ('pending', 'published')
    ) THEN
      RAISE EXCEPTION 'This application URL has already been submitted and is currently pending review or active.';
    END IF;
  END IF;

  IF v_clean_apply_email IS NOT NULL THEN
    IF v_clean_apply_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR char_length(v_clean_apply_email) > 120 THEN
      RAISE EXCEPTION 'Invalid application email address (must be valid email format and at most 120 characters)';
    END IF;
  END IF;

  -- 7. Validate deadline
  IF p_deadline IS NOT NULL AND p_deadline < CURRENT_DATE THEN
    RAISE EXCEPTION 'Deadline cannot be in the past';
  END IF;

  -- 8. Rate limits
  -- Max 3 submissions per rolling 24 hours
  SELECT COUNT(*) INTO v_recent_count
  FROM public.internship_reviews
  WHERE submitted_by = v_user_id
    AND created_at > (now() - interval '24 hours');

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit reached: Maximum 3 internship submissions per 24 hours.';
  END IF;

  -- Max 10 pending submissions at one time
  SELECT COUNT(*) INTO v_pending_count
  FROM public.internships i
  JOIN public.internship_reviews r ON r.internship_id = i.id
  WHERE r.submitted_by = v_user_id
    AND i.status = 'pending';

  IF v_pending_count >= 10 THEN
    RAISE EXCEPTION 'Pending limit reached: You have 10 pending submissions awaiting review.';
  END IF;

  -- 9. Insert into public.internships
  INSERT INTO public.internships (
    title,
    organization,
    location,
    work_mode,
    field,
    type,
    paid_status,
    description,
    eligibility,
    apply_url,
    apply_email,
    deadline,
    status
  ) VALUES (
    v_clean_title,
    v_clean_org,
    v_clean_location,
    p_work_mode,
    p_field,
    p_type,
    p_paid_status,
    v_clean_desc,
    v_clean_eligibility,
    v_clean_apply_url,
    v_clean_apply_email,
    p_deadline,
    'pending'
  )
  RETURNING id INTO v_internship_id;

  -- 10. Insert into public.internship_reviews
  INSERT INTO public.internship_reviews (
    internship_id,
    submitted_by
  ) VALUES (
    v_internship_id,
    v_user_id
  );

  RETURN v_internship_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_internship_lead(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_internship_lead(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE
) TO authenticated;

-- 7. RPC: my_internship_submissions (Authenticated users)
CREATE OR REPLACE FUNCTION public.my_internship_submissions()
RETURNS TABLE (
  id               UUID,
  title            TEXT,
  organization     TEXT,
  location         TEXT,
  work_mode        TEXT,
  field            TEXT,
  type             TEXT,
  paid_status      TEXT,
  deadline         DATE,
  status           TEXT,
  created_at       TIMESTAMPTZ,
  published_at     TIMESTAMPTZ,
  rejection_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.organization,
    i.location,
    i.work_mode,
    i.field,
    i.type,
    i.paid_status,
    i.deadline,
    i.status,
    i.created_at,
    i.published_at,
    r.rejection_reason
  FROM public.internships i
  JOIN public.internship_reviews r ON r.internship_id = i.id
  WHERE r.submitted_by = v_user_id
  ORDER BY i.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.my_internship_submissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_internship_submissions() TO authenticated;

-- 8. Admin RPC: admin_publish_internship
CREATE OR REPLACE FUNCTION public.admin_publish_internship(
  p_id            UUID,
  p_title         TEXT,
  p_organization  TEXT,
  p_location      TEXT,
  p_work_mode     TEXT,
  p_field         TEXT,
  p_type          TEXT,
  p_paid_status   TEXT,
  p_description   TEXT,
  p_eligibility   TEXT DEFAULT NULL,
  p_apply_url     TEXT DEFAULT NULL,
  p_apply_email   TEXT DEFAULT NULL,
  p_deadline      DATE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_old_status TEXT;
  v_clean_title TEXT;
  v_clean_org TEXT;
  v_clean_location TEXT;
  v_clean_desc TEXT;
  v_clean_eligibility TEXT;
  v_clean_apply_url TEXT;
  v_clean_apply_email TEXT;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  SELECT status INTO v_old_status
  FROM public.internships
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Internship not found: %', p_id;
  END IF;

  v_clean_title := trim(p_title);
  v_clean_org := trim(p_organization);
  v_clean_location := trim(p_location);
  v_clean_desc := trim(p_description);
  v_clean_eligibility := NULLIF(trim(p_eligibility), '');
  v_clean_apply_url := NULLIF(trim(p_apply_url), '');
  v_clean_apply_email := NULLIF(lower(trim(p_apply_email)), '');

  -- Validate title, org, location, desc lengths
  IF char_length(v_clean_title) < 5 OR char_length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Title must be between 5 and 120 characters';
  END IF;

  IF char_length(v_clean_org) < 2 OR char_length(v_clean_org) > 100 THEN
    RAISE EXCEPTION 'Organization must be between 2 and 100 characters';
  END IF;

  IF char_length(v_clean_location) < 2 OR char_length(v_clean_location) > 100 THEN
    RAISE EXCEPTION 'Location must be between 2 and 100 characters';
  END IF;

  IF char_length(v_clean_desc) < 30 OR char_length(v_clean_desc) > 3000 THEN
    RAISE EXCEPTION 'Description must be between 30 and 3000 characters';
  END IF;

  IF v_clean_eligibility IS NOT NULL AND char_length(v_clean_eligibility) > 1500 THEN
    RAISE EXCEPTION 'Eligibility criteria cannot exceed 1500 characters';
  END IF;

  -- Validate work_mode, field, type, paid_status
  IF p_work_mode NOT IN ('remote', 'onsite', 'hybrid') THEN
    RAISE EXCEPTION 'Please select a valid work mode (remote, onsite, or hybrid).';
  END IF;

  IF p_field NOT IN (
    'tech',
    'design',
    'marketing',
    'finance',
    'engineering',
    'media',
    'healthcare',
    'business',
    'legal',
    'other'
  ) THEN
    RAISE EXCEPTION 'Please select a valid field or discipline.';
  END IF;

  IF p_type NOT IN (
    'internship',
    'siwes',
    'industrial-training',
    'graduate-trainee',
    'volunteer',
    'fellowship',
    'other'
  ) THEN
    RAISE EXCEPTION 'Please select a valid internship type.';
  END IF;

  IF p_paid_status NOT IN ('paid', 'unpaid', 'stipend', 'unknown') THEN
    RAISE EXCEPTION 'Please select a valid compensation status (paid, unpaid, stipend, or unknown).';
  END IF;

  -- Validate at least one contact method
  IF v_clean_apply_url IS NULL AND v_clean_apply_email IS NULL THEN
    RAISE EXCEPTION 'Please provide at least one contact method: Application URL or Application Email.';
  END IF;

  IF v_clean_apply_url IS NOT NULL THEN
    IF v_clean_apply_url ~ '\s' OR v_clean_apply_url ~ '@' OR v_clean_apply_url !~* '^https://[^\s@]+$' OR char_length(v_clean_apply_url) > 500 THEN
      RAISE EXCEPTION 'Invalid apply URL (must be https:// without spaces or credentials, max 500 characters)';
    END IF;
  END IF;

  IF v_clean_apply_email IS NOT NULL THEN
    IF v_clean_apply_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR char_length(v_clean_apply_email) > 120 THEN
      RAISE EXCEPTION 'Invalid apply email (must be valid format and at most 120 characters)';
    END IF;
  END IF;

  -- Update public.internships
  UPDATE public.internships
  SET
    title = v_clean_title,
    organization = v_clean_org,
    location = v_clean_location,
    work_mode = p_work_mode,
    field = p_field,
    type = p_type,
    paid_status = p_paid_status,
    description = v_clean_desc,
    eligibility = v_clean_eligibility,
    apply_url = v_clean_apply_url,
    apply_email = v_clean_apply_email,
    deadline = p_deadline,
    status = 'published',
    published_at = COALESCE(published_at, now()),
    updated_at = now()
  WHERE id = p_id;

  -- Update review record
  UPDATE public.internship_reviews
  SET
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    rejection_reason = NULL,
    updated_at = now()
  WHERE internship_id = p_id;

  -- Audit log (do NOT pass created_at)
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    v_admin_id,
    'publish_internship',
    'internships',
    p_id::text,
    jsonb_build_object(
      'title', v_clean_title,
      'organization', v_clean_org,
      'previous_status', v_old_status
    )
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_publish_internship(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_publish_internship(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE
) TO authenticated;

-- 9. Admin RPC: admin_reject_internship
CREATE OR REPLACE FUNCTION public.admin_reject_internship(
  p_id     UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_clean_reason TEXT;
  v_title TEXT;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();
  v_clean_reason := trim(p_reason);

  IF char_length(v_clean_reason) < 5 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 5 characters';
  END IF;

  SELECT title INTO v_title
  FROM public.internships
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Internship not found: %', p_id;
  END IF;

  UPDATE public.internships
  SET
    status = 'rejected',
    updated_at = now()
  WHERE id = p_id;

  UPDATE public.internship_reviews
  SET
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    rejection_reason = v_clean_reason,
    updated_at = now()
  WHERE internship_id = p_id;

  -- Audit log (do NOT pass created_at)
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    v_admin_id,
    'reject_internship',
    'internships',
    p_id::text,
    jsonb_build_object(
      'title', v_title,
      'reason', v_clean_reason
    )
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_internship(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_internship(UUID, TEXT) TO authenticated;

-- 10. Admin RPC: admin_unpublish_internship
CREATE OR REPLACE FUNCTION public.admin_unpublish_internship(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_title TEXT;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  SELECT title INTO v_title
  FROM public.internships
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Internship not found: %', p_id;
  END IF;

  UPDATE public.internships
  SET
    status = 'pending',
    updated_at = now()
  WHERE id = p_id;

  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    v_admin_id,
    'unpublish_internship',
    'internships',
    p_id::text,
    jsonb_build_object('title', v_title)
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_unpublish_internship(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_unpublish_internship(UUID) TO authenticated;

-- 11. Admin RPC: admin_delete_internship
CREATE OR REPLACE FUNCTION public.admin_delete_internship(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_title TEXT;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  SELECT title INTO v_title
  FROM public.internships
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Internship not found: %', p_id;
  END IF;

  DELETE FROM public.internships
  WHERE id = p_id;

  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    v_admin_id,
    'delete_internship',
    'internships',
    p_id::text,
    jsonb_build_object('title', v_title)
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_internship(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_internship(UUID) TO authenticated;

COMMIT;
