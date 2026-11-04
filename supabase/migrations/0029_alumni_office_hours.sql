BEGIN;

-- ─── 0029_alumni_office_hours.sql ────────────────────────────────────────────
-- Alumni Office Hours: A vetted directory of Nigerian university alumni
-- offering mentorship and career advice to current students and youth.
-- Two-table architecture:
--   1. alumni_applications (PRIVATE) - Admin only, holds private contact & audit data.
--   2. alumni_profiles (PUBLIC) - Public directory, strictly sanitized public fields.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. alumni_applications Table (Private Submissions) ───────────────────────

CREATE TABLE IF NOT EXISTS public.alumni_applications (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  full_name        text         NOT NULL,
  email            text         NOT NULL,
  graduation_year  smallint     NOT NULL,
  institution      text         NOT NULL,
  field            text         NOT NULL,
  occupation       text         NOT NULL,
  bio              text         NOT NULL,
  topics           text         NOT NULL,
  availability     text         NOT NULL,
  contact_url      text         NOT NULL,
  consent_public   boolean      NOT NULL,
  ip_hash          text         NOT NULL,
  status           text         NOT NULL DEFAULT 'new',
  admin_notes      text         NULL,
  reviewed_by      uuid         REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at      timestamptz  NULL,

  CONSTRAINT alumni_applications_full_name_len CHECK (
    char_length(trim(full_name)) >= 2 AND
    char_length(trim(full_name)) <= 80
  ),
  CONSTRAINT alumni_applications_email_check CHECK (
    char_length(email) <= 255 AND
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$'
  ),
  CONSTRAINT alumni_applications_grad_year_check CHECK (
    graduation_year >= 1970 AND
    graduation_year <= 2100
  ),
  CONSTRAINT alumni_applications_institution_len CHECK (
    char_length(trim(institution)) >= 2 AND
    char_length(trim(institution)) <= 120
  ),
  CONSTRAINT alumni_applications_field_len CHECK (
    char_length(trim(field)) >= 2 AND
    char_length(trim(field)) <= 100
  ),
  CONSTRAINT alumni_applications_occupation_len CHECK (
    char_length(trim(occupation)) >= 2 AND
    char_length(trim(occupation)) <= 120
  ),
  CONSTRAINT alumni_applications_bio_len CHECK (
    char_length(trim(bio)) >= 20 AND
    char_length(trim(bio)) <= 600
  ),
  CONSTRAINT alumni_applications_topics_len CHECK (
    char_length(trim(topics)) >= 2 AND
    char_length(trim(topics)) <= 300
  ),
  CONSTRAINT alumni_applications_availability_len CHECK (
    char_length(trim(availability)) >= 2 AND
    char_length(trim(availability)) <= 200
  ),
    CONSTRAINT alumni_profiles_contact_url_check CHECK (
    char_length(trim(contact_url)) <= 200 AND
    contact_url ~* '^https://(www\.)?(linkedin\.com|x\.com|twitter\.com)(/[^[:space:]]*)?$'
  ),
  CONSTRAINT alumni_applications_consent_check CHECK (
    consent_public = true
  ),
  CONSTRAINT alumni_applications_ip_hash_len CHECK (
    char_length(ip_hash) = 64
  ),
  CONSTRAINT alumni_applications_status_check CHECK (
    status IN ('new', 'reviewing', 'approved', 'declined')
  ),
  CONSTRAINT alumni_applications_admin_notes_len CHECK (
    admin_notes IS NULL OR char_length(admin_notes) <= 2000
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS alumni_applications_email_uidx
  ON public.alumni_applications (lower(email));

CREATE INDEX IF NOT EXISTS alumni_applications_status_idx
  ON public.alumni_applications (status);

CREATE INDEX IF NOT EXISTS alumni_applications_created_at_idx
  ON public.alumni_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS alumni_applications_ip_hash_idx
  ON public.alumni_applications (ip_hash, created_at DESC);

-- ── 2. alumni_profiles Table (Public Directory) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid         NULL REFERENCES public.alumni_applications(id) ON DELETE SET NULL,
  display_name     text         NOT NULL,
  graduation_year  smallint     NOT NULL,
  institution      text         NOT NULL,
  field            text         NOT NULL,
  occupation       text         NOT NULL,
  bio              text         NOT NULL,
  topics           text         NOT NULL,
  availability     text         NOT NULL,
  contact_url      text         NOT NULL,
  status           text         NOT NULL DEFAULT 'unpublished',
  published_at     timestamptz  NOT NULL DEFAULT now(),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT alumni_profiles_display_name_len CHECK (
    char_length(trim(display_name)) >= 2 AND
    char_length(trim(display_name)) <= 80
  ),
  CONSTRAINT alumni_profiles_grad_year_check CHECK (
    graduation_year >= 1970 AND
    graduation_year <= 2100
  ),
  CONSTRAINT alumni_profiles_institution_len CHECK (
    char_length(trim(institution)) >= 2 AND
    char_length(trim(institution)) <= 120
  ),
  CONSTRAINT alumni_profiles_field_len CHECK (
    char_length(trim(field)) >= 2 AND
    char_length(trim(field)) <= 100
  ),
  CONSTRAINT alumni_profiles_occupation_len CHECK (
    char_length(trim(occupation)) >= 2 AND
    char_length(trim(occupation)) <= 120
  ),
  CONSTRAINT alumni_profiles_bio_len CHECK (
    char_length(trim(bio)) >= 20 AND
    char_length(trim(bio)) <= 600
  ),
  CONSTRAINT alumni_profiles_topics_len CHECK (
    char_length(trim(topics)) >= 2 AND
    char_length(trim(topics)) <= 300
  ),
  CONSTRAINT alumni_profiles_availability_len CHECK (
    char_length(trim(availability)) >= 2 AND
    char_length(trim(availability)) <= 200
  ),
    CONSTRAINT alumni_profiles_contact_url_check CHECK (
    char_length(trim(contact_url)) <= 200 AND
    contact_url ~* '^https://(www\.)?(linkedin\.com|x\.com|twitter\.com)(/[^[:space:]]*)?$'
  ),
  CONSTRAINT alumni_profiles_status_check CHECK (
    status IN ('published', 'unpublished')
  )
);

CREATE INDEX IF NOT EXISTS alumni_profiles_status_idx
  ON public.alumni_profiles (status);

CREATE INDEX IF NOT EXISTS alumni_profiles_published_at_idx
  ON public.alumni_profiles (published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS alumni_profiles_application_id_idx
  ON public.alumni_profiles (application_id);

CREATE INDEX IF NOT EXISTS alumni_profiles_field_idx
  ON public.alumni_profiles (field);

-- -- Trigger for auto-updating updated_at
-- DROP TRIGGER IF EXISTS alumni_profiles_updated_at ON public.alumni_profiles;
-- CREATE TRIGGER alumni_profiles_updated_at
--   BEFORE UPDATE ON public.alumni_profiles
--   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 3. Row Level Security & Permissions ──────────────────────────────────────

-- 3A. alumni_applications (Strictly Private)
ALTER TABLE public.alumni_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.alumni_applications FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.alumni_applications TO authenticated;

DROP POLICY IF EXISTS "alumni_applications: admin select all" ON public.alumni_applications;
CREATE POLICY "alumni_applications: admin select all"
  ON public.alumni_applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 3B. alumni_profiles (Public Directory)
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.alumni_profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.alumni_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "alumni_profiles: public select published" ON public.alumni_profiles;
CREATE POLICY "alumni_profiles: public select published"
  ON public.alumni_profiles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "alumni_profiles: admin select all" ON public.alumni_profiles;
CREATE POLICY "alumni_profiles: admin select all"
  ON public.alumni_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── 4. Admin RPC: Set Application Status ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_alumni_application_status(
  p_id     uuid,
  p_status text,
  p_notes  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id   uuid;
  v_old_status text;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Validate status parameter
  IF p_status NOT IN ('new', 'reviewing', 'approved', 'declined') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 3. Fetch current status and confirm existence
  SELECT status
    INTO v_old_status
  FROM public.alumni_applications
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alumni application not found: %', p_id;
  END IF;

  -- 4. Update the record
  UPDATE public.alumni_applications
  SET status      = p_status,
      admin_notes = COALESCE(p_notes, admin_notes),
      reviewed_by = v_admin_id,
      reviewed_at = now()
  WHERE id = p_id;

  -- 5. Record entry in admin_audit_log without PII or created_at
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'set_alumni_application_status',
    'alumni_applications',
    p_id::text,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_status
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id,
    'status', p_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_alumni_application_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_alumni_application_status(uuid, text, text) TO authenticated;

-- ── 5. Admin RPC: Publish Alumni Profile ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_publish_alumni(
  p_application_id  uuid,
  p_display_name    text,
  p_graduation_year smallint,
  p_institution     text,
  p_field           text,
  p_occupation      text,
  p_bio             text,
  p_topics          text,
  p_availability    text,
  p_contact_url     text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id    uuid;
  v_profile_id  uuid;
  v_name        text;
  v_institution text;
  v_field       text;
  v_occupation  text;
  v_bio         text;
  v_topics      text;
  v_avail       text;
  v_contact     text;
  v_exists      boolean := FALSE;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Validate application exists
  PERFORM 1
  FROM public.alumni_applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alumni application not found: %', p_application_id;
  END IF;

  -- 3. Clean and validate inputs
  v_name        := trim(p_display_name);
  v_institution := trim(p_institution);
  v_field       := trim(p_field);
  v_occupation  := trim(p_occupation);
  v_bio         := trim(p_bio);
  v_topics      := trim(p_topics);
  v_avail       := trim(p_availability);
  v_contact     := trim(p_contact_url);

  IF char_length(v_name) < 2 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 80 characters';
  END IF;

  IF p_graduation_year < 1970 OR p_graduation_year > 2100 THEN
    RAISE EXCEPTION 'Graduation year must be between 1970 and 2100';
  END IF;

  IF char_length(v_institution) < 2 OR char_length(v_institution) > 120 THEN
    RAISE EXCEPTION 'Institution must be between 2 and 120 characters';
  END IF;

  IF char_length(v_field) < 2 OR char_length(v_field) > 100 THEN
    RAISE EXCEPTION 'Field must be between 2 and 100 characters';
  END IF;

  IF char_length(v_occupation) < 2 OR char_length(v_occupation) > 120 THEN
    RAISE EXCEPTION 'Occupation must be between 2 and 120 characters';
  END IF;

  IF char_length(v_bio) < 20 OR char_length(v_bio) > 600 THEN
    RAISE EXCEPTION 'Bio must be between 20 and 600 characters';
  END IF;

  IF char_length(v_topics) < 2 OR char_length(v_topics) > 300 THEN
    RAISE EXCEPTION 'Topics must be between 2 and 300 characters';
  END IF;

  IF char_length(v_avail) < 2 OR char_length(v_avail) > 200 THEN
    RAISE EXCEPTION 'Availability must be between 2 and 200 characters';
  END IF;

   IF char_length(v_contact) > 200
     OR v_contact !~* '^https://(www\.)?(linkedin\.com|x\.com|twitter\.com)(/[^[:space:]]*)?$' THEN
    RAISE EXCEPTION 'Contact URL must be a LinkedIn or X (Twitter) HTTPS link up to 200 characters';
  END IF;

  -- 4. Check if profile already exists for this application
  SELECT id INTO v_profile_id
  FROM public.alumni_profiles
  WHERE application_id = p_application_id;

  IF v_profile_id IS NOT NULL THEN
    v_exists := TRUE;
  END IF;

  -- 5. Insert or update the public profile
  IF v_exists THEN
    UPDATE public.alumni_profiles
    SET display_name    = v_name,
        graduation_year = p_graduation_year,
        institution     = v_institution,
        field           = v_field,
        occupation      = v_occupation,
        bio             = v_bio,
        topics          = v_topics,
        availability    = v_avail,
        contact_url     = v_contact,
        status          = 'published',
        published_at    = now(),
        updated_at      = now()
    WHERE id = v_profile_id;
  ELSE
    INSERT INTO public.alumni_profiles (
      application_id,
      display_name,
      graduation_year,
      institution,
      field,
      occupation,
      bio,
      topics,
      availability,
      contact_url,
      status,
      published_at
    )
    VALUES (
      p_application_id,
      v_name,
      p_graduation_year,
      v_institution,
      v_field,
      v_occupation,
      v_bio,
      v_topics,
      v_avail,
      v_contact,
      'published',
      now()
    )
    RETURNING id INTO v_profile_id;
  END IF;

  -- 6. Mark the application approved and set reviewed metadata
  UPDATE public.alumni_applications
  SET status      = 'approved',
      reviewed_by = v_admin_id,
      reviewed_at = now()
  WHERE id = p_application_id;

  -- 7. Audit log (non-PII metadata)
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'publish_alumni',
    'alumni_profiles',
    v_profile_id::text,
    jsonb_build_object(
      'application_id', p_application_id,
      'display_name', v_name
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', v_profile_id,
    'application_id', p_application_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_publish_alumni(uuid, text, smallint, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_publish_alumni(uuid, text, smallint, text, text, text, text, text, text, text) TO authenticated;

-- ── 6. Admin RPC: Set Profile Status (Publish / Unpublish) ────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_alumni_profile_status(
  p_id     uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id   uuid;
  v_old_status text;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Validate status parameter
  IF p_status NOT IN ('published', 'unpublished') THEN
    RAISE EXCEPTION 'Invalid profile status: %', p_status;
  END IF;

  -- 3. Confirm existence and get current status
  SELECT status
    INTO v_old_status
  FROM public.alumni_profiles
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alumni profile not found: %', p_id;
  END IF;

  -- 4. Update status
  UPDATE public.alumni_profiles
  SET status       = p_status,
      published_at = CASE WHEN p_status = 'published' THEN now() ELSE published_at END,
      updated_at   = now()
  WHERE id = p_id;

  -- 5. Audit log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'set_alumni_profile_status',
    'alumni_profiles',
    p_id::text,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_status
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id,
    'status', p_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_alumni_profile_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_alumni_profile_status(uuid, text) TO authenticated;

-- ── 7. Admin RPC: Delete Alumni Application (And Associated Profile) ──────────

CREATE OR REPLACE FUNCTION public.admin_delete_alumni_application(
  p_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Verify existence before deletion
  PERFORM 1
  FROM public.alumni_applications
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alumni application not found: %', p_id;
  END IF;

  -- 3. Delete any public profile linked to this application
  DELETE FROM public.alumni_profiles
  WHERE application_id = p_id;

  -- 4. Delete the application record
  DELETE FROM public.alumni_applications
  WHERE id = p_id;

  -- 5. Audit log entry without PII or created_at
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'delete_alumni_application',
    'alumni_applications',
    p_id::text,
    '{}'::jsonb
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_alumni_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_alumni_application(uuid) TO authenticated;

COMMIT;

