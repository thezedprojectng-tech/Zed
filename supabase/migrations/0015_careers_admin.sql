-- ─────────────────────────────────────────────────────────────────────────────
-- 0015_careers_admin.sql
-- Zed Project: Database-Backed Careers Management Schema & Admin RPCs
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create table public.career_roles
CREATE TABLE IF NOT EXISTS public.career_roles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  department       TEXT NOT NULL,
  location         TEXT NOT NULL,
  type             TEXT NOT NULL,
  featured         BOOLEAN NOT NULL DEFAULT false,
  summary          TEXT NOT NULL,
  about            TEXT[] NOT NULL DEFAULT '{}'::text[],
  responsibilities TEXT[] NOT NULL DEFAULT '{}'::text[],
  requirements     TEXT[] NOT NULL DEFAULT '{}'::text[],
  nice_to_have     TEXT[] NOT NULL DEFAULT '{}'::text[],
  status           TEXT NOT NULL DEFAULT 'draft',
  posted_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT career_roles_slug_key UNIQUE (slug),
  CONSTRAINT career_roles_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 80),
  CONSTRAINT career_roles_title_len CHECK (length(trim(title)) BETWEEN 3 AND 120),
  CONSTRAINT career_roles_dept_len CHECK (length(trim(department)) BETWEEN 2 AND 40),
  CONSTRAINT career_roles_summary_len CHECK (length(trim(summary)) BETWEEN 1 AND 300),
  CONSTRAINT career_roles_location_check CHECK (location IN ('Remote', 'Hybrid', 'On-site')),
  CONSTRAINT career_roles_type_check CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
  CONSTRAINT career_roles_status_check CHECK (status IN ('draft', 'published', 'closed'))
);

-- 2. Indexes for query performance
CREATE INDEX IF NOT EXISTS career_roles_status_idx ON public.career_roles (status);
CREATE INDEX IF NOT EXISTS career_roles_department_idx ON public.career_roles (department);
CREATE INDEX IF NOT EXISTS career_roles_posted_at_idx ON public.career_roles (posted_at DESC);
CREATE INDEX IF NOT EXISTS career_roles_created_at_idx ON public.career_roles (created_at DESC);

-- 3. Automatic updated_at trigger using existing handle_updated_at()
DROP TRIGGER IF EXISTS on_career_roles_updated ON public.career_roles;
CREATE TRIGGER on_career_roles_updated
  BEFORE UPDATE ON public.career_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Row-Level Security
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_roles: public select published" ON public.career_roles;
CREATE POLICY "career_roles: public select published"
  ON public.career_roles
  FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "career_roles: admin select all" ON public.career_roles;
CREATE POLICY "career_roles: admin select all"
  ON public.career_roles
  FOR SELECT
  TO authenticated
  USING (public.is_admin() IS TRUE);

-- 5. Revoke direct mutations from client roles; only grant SELECT
REVOKE ALL ON public.career_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.career_roles TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin RPC 1: public.admin_save_career_role
-- Creates (p_id IS NULL) or updates (p_id IS NOT NULL) a career role
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_save_career_role(
  p_id               UUID,
  p_title            TEXT,
  p_slug             TEXT,
  p_department       TEXT,
  p_location         TEXT,
  p_type             TEXT,
  p_featured         BOOLEAN,
  p_summary          TEXT,
  p_about            TEXT[],
  p_responsibilities TEXT[],
  p_requirements     TEXT[],
  p_nice_to_have     TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id         UUID;
  v_res_id           UUID;
  v_is_create        BOOLEAN := (p_id IS NULL);
  v_existing         RECORD;
  v_clean_title      TEXT := trim(COALESCE(p_title, ''));
  v_clean_slug       TEXT := trim(COALESCE(p_slug, ''));
  v_clean_dept       TEXT := trim(COALESCE(p_department, ''));
  v_clean_loc        TEXT := trim(COALESCE(p_location, ''));
  v_clean_type       TEXT := trim(COALESCE(p_type, ''));
  v_clean_summary    TEXT := trim(COALESCE(p_summary, ''));
  v_featured         BOOLEAN := COALESCE(p_featured, false);
  v_about            TEXT[] := COALESCE(p_about, '{}'::text[]);
  v_responsibilities TEXT[] := COALESCE(p_responsibilities, '{}'::text[]);
  v_requirements     TEXT[] := COALESCE(p_requirements, '{}'::text[]);
  v_nice_to_have     TEXT[] := COALESCE(p_nice_to_have, '{}'::text[]);
  v_item             TEXT;
  v_status           TEXT := 'draft';
BEGIN
  -- Strict Admin check
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  -- Basic field length & format validations
  IF length(v_clean_title) < 3 OR length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Job title must be between 3 and 120 characters';
  END IF;

  IF length(v_clean_slug) < 3 OR length(v_clean_slug) > 80 OR v_clean_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Job slug must consist of lowercase alphanumeric characters and hyphens (3-80 chars)';
  END IF;

  IF length(v_clean_dept) < 2 OR length(v_clean_dept) > 40 THEN
    RAISE EXCEPTION 'Department must be between 2 and 40 characters';
  END IF;

  IF v_clean_loc NOT IN ('Remote', 'Hybrid', 'On-site') THEN
    RAISE EXCEPTION 'Location must be Remote, Hybrid, or On-site';
  END IF;

  IF v_clean_type NOT IN ('Full-time', 'Part-time', 'Contract', 'Internship') THEN
    RAISE EXCEPTION 'Job type must be Full-time, Part-time, Contract, or Internship';
  END IF;

  IF length(v_clean_summary) = 0 OR length(v_clean_summary) > 300 THEN
    RAISE EXCEPTION 'Job summary must be between 1 and 300 characters';
  END IF;

  -- Array validations: About (max 5 items, each 3-300 chars, no empty/null)
  IF cardinality(v_about) > 5 THEN
    RAISE EXCEPTION 'About section cannot exceed 5 items';
  END IF;
  FOREACH v_item IN ARRAY v_about LOOP
    IF v_item IS NULL OR length(trim(v_item)) < 3 OR length(trim(v_item)) > 300 THEN
      RAISE EXCEPTION 'Each about item must be between 3 and 300 characters, and cannot be empty';
    END IF;
  END LOOP;

  -- Array validations: Responsibilities (max 15 items, each 3-300 chars, no empty/null)
  IF cardinality(v_responsibilities) > 15 THEN
    RAISE EXCEPTION 'Responsibilities cannot exceed 15 items';
  END IF;
  FOREACH v_item IN ARRAY v_responsibilities LOOP
    IF v_item IS NULL OR length(trim(v_item)) < 3 OR length(trim(v_item)) > 300 THEN
      RAISE EXCEPTION 'Each responsibility item must be between 3 and 300 characters, and cannot be empty';
    END IF;
  END LOOP;

  -- Array validations: Requirements (max 15 items, each 3-300 chars, no empty/null)
  IF cardinality(v_requirements) > 15 THEN
    RAISE EXCEPTION 'Requirements cannot exceed 15 items';
  END IF;
  FOREACH v_item IN ARRAY v_requirements LOOP
    IF v_item IS NULL OR length(trim(v_item)) < 3 OR length(trim(v_item)) > 300 THEN
      RAISE EXCEPTION 'Each requirement item must be between 3 and 300 characters, and cannot be empty';
    END IF;
  END LOOP;

  -- Array validations: Nice to have (max 10 items, each 3-300 chars, no empty/null)
  IF cardinality(v_nice_to_have) > 10 THEN
    RAISE EXCEPTION 'Nice to have cannot exceed 10 items';
  END IF;
  FOREACH v_item IN ARRAY v_nice_to_have LOOP
    IF v_item IS NULL OR length(trim(v_item)) < 3 OR length(trim(v_item)) > 300 THEN
      RAISE EXCEPTION 'Each nice-to-have item must be between 3 and 300 characters, and cannot be empty';
    END IF;
  END LOOP;

  IF v_is_create THEN
    -- Ensure slug uniqueness
    IF EXISTS (SELECT 1 FROM public.career_roles WHERE slug = v_clean_slug) THEN
      RAISE EXCEPTION 'A role with this slug already exists';
    END IF;

    INSERT INTO public.career_roles (
      slug,
      title,
      department,
      location,
      type,
      featured,
      summary,
      about,
      responsibilities,
      requirements,
      nice_to_have,
      status
    )
    VALUES (
      v_clean_slug,
      v_clean_title,
      v_clean_dept,
      v_clean_loc,
      v_clean_type,
      v_featured,
      v_clean_summary,
      v_about,
      v_responsibilities,
      v_requirements,
      v_nice_to_have,
      'draft'
    )
    RETURNING id INTO v_res_id;

    v_status := 'draft';

    -- Audit log
    INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
    VALUES (
      v_admin_id,
      'careers.role.create',
      'career_roles',
      v_res_id::text,
      jsonb_build_object(
        'title', v_clean_title,
        'slug', v_clean_slug,
        'status', 'draft',
        'department', v_clean_dept
      )
    );
  ELSE
    -- Lock role for update
    SELECT * INTO v_existing
    FROM public.career_roles
    WHERE id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Career role not found';
    END IF;

    -- Slug immutability rule: slug cannot change once published or if previously published (posted_at is not null)
    IF (v_existing.status = 'published' OR v_existing.posted_at IS NOT NULL) AND v_existing.slug <> v_clean_slug THEN
      RAISE EXCEPTION 'Slug cannot be changed once a role has been published';
    END IF;

    -- Check slug uniqueness if changed
    IF v_existing.slug <> v_clean_slug AND EXISTS (SELECT 1 FROM public.career_roles WHERE slug = v_clean_slug AND id <> p_id) THEN
      RAISE EXCEPTION 'A role with this slug already exists';
    END IF;

    -- If currently published, require at least one responsibility and one requirement
    IF v_existing.status = 'published' THEN
      IF cardinality(v_responsibilities) < 1 THEN
        RAISE EXCEPTION 'Published role must have at least 1 responsibility';
      END IF;
      IF cardinality(v_requirements) < 1 THEN
        RAISE EXCEPTION 'Published role must have at least 1 requirement';
      END IF;
    END IF;

    UPDATE public.career_roles
    SET
      slug             = v_clean_slug,
      title            = v_clean_title,
      department       = v_clean_dept,
      location         = v_clean_loc,
      type             = v_clean_type,
      featured         = v_featured,
      summary          = v_clean_summary,
      about            = v_about,
      responsibilities = v_responsibilities,
      requirements     = v_requirements,
      nice_to_have     = v_nice_to_have
    WHERE id = p_id
    RETURNING id INTO v_res_id;

    v_status := v_existing.status;

    -- Audit log
    INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
    VALUES (
      v_admin_id,
      'careers.role.update',
      'career_roles',
      v_res_id::text,
      jsonb_build_object(
        'title', v_clean_title,
        'slug', v_clean_slug,
        'status', v_status,
        'department', v_clean_dept
      )
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'role_id', v_res_id, 'slug', v_clean_slug, 'status', v_status);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_career_role(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT[], TEXT[], TEXT[], TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_career_role(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT[], TEXT[], TEXT[], TEXT[]) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin RPC 2: public.admin_set_career_status
-- Updates role status ('draft' | 'published' | 'closed') and records posted_at
-- on first publication. Validates >= 1 responsibility and >= 1 requirement.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_career_status(
  p_role_id UUID,
  p_status  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id      UUID;
  v_role          RECORD;
  v_new_posted_at TIMESTAMPTZ;
BEGIN
  -- Strict Admin check
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  IF p_status NOT IN ('draft', 'published', 'closed') THEN
    RAISE EXCEPTION 'Status must be draft, published, or closed';
  END IF;

  -- Lock role row
  SELECT * INTO v_role
  FROM public.career_roles
  WHERE id = p_role_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Career role not found';
  END IF;

  -- Validation when publishing: must have at least 1 responsibility and 1 requirement
  IF p_status = 'published' THEN
    IF cardinality(v_role.responsibilities) < 1 THEN
      RAISE EXCEPTION 'A role needs at least one responsibility before it can be published';
    END IF;

    IF cardinality(v_role.requirements) < 1 THEN
      RAISE EXCEPTION 'A role needs at least one requirement before it can be published';
    END IF;
  END IF;

  -- Set posted_at the first time it is published; preserve existing posted_at thereafter
  IF p_status = 'published' AND v_role.posted_at IS NULL THEN
    v_new_posted_at := now();
  ELSE
    v_new_posted_at := v_role.posted_at;
  END IF;

  UPDATE public.career_roles
  SET
    status    = p_status,
    posted_at = v_new_posted_at
  WHERE id = p_role_id;

  -- Audit log
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    'careers.role.status_change',
    'career_roles',
    p_role_id::text,
    jsonb_build_object(
      'title', v_role.title,
      'slug', v_role.slug,
      'previous_status', v_role.status,
      'new_status', p_status,
      'posted_at', v_new_posted_at
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'role_id', p_role_id,
    'status', p_status,
    'posted_at', v_new_posted_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_career_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_career_status(UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin RPC 3: public.admin_delete_career_role
-- Deletes a role with full audit logging
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_career_role(
  p_role_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_role     RECORD;
BEGIN
  -- Strict Admin check
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  -- Lock role row
  SELECT * INTO v_role
  FROM public.career_roles
  WHERE id = p_role_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Career role not found';
  END IF;

  DELETE FROM public.career_roles
  WHERE id = p_role_id;

  -- Audit log
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    'careers.role.delete',
    'career_roles',
    p_role_id::text,
    jsonb_build_object(
      'title', v_role.title,
      'slug', v_role.slug,
      'status', v_role.status,
      'department', v_role.department
    )
  );

  RETURN jsonb_build_object('ok', true, 'role_id', p_role_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_career_role(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_career_role(UUID) TO authenticated;
