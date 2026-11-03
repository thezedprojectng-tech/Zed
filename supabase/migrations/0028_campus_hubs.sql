BEGIN;

-- ─── 0028_campus_hubs.sql ───────────────────────────────────────────────────
-- Campus Hubs: Admin-managed campus guides covering clearance checklists,
-- hostels, and departmental walkthroughs across Nigerian universities.
-- Public read-only for published hubs, strict admin-only RPCs for all mutations.

-- ── 1. campus_hubs Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campus_hubs (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text          NOT NULL UNIQUE,
  name                text          NOT NULL UNIQUE,
  state               text          NOT NULL,
  summary             text          NULL,
  clearance_guide     text          NULL,
  hostel_guide        text          NULL,
  departments_guide   text          NULL,
  status              text          NOT NULL DEFAULT 'draft',
  published_at        timestamptz   NULL,
  last_reviewed_at    timestamptz   NULL,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT campus_hubs_slug_format CHECK (
    char_length(slug) >= 2 AND
    char_length(slug) <= 60 AND
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  CONSTRAINT campus_hubs_name_len CHECK (
    char_length(name) >= 2 AND
    char_length(name) <= 120
  ),
  CONSTRAINT campus_hubs_state_len CHECK (
    char_length(state) >= 2 AND
    char_length(state) <= 40
  ),
  CONSTRAINT campus_hubs_summary_len CHECK (
    summary IS NULL OR char_length(summary) <= 300
  ),
  CONSTRAINT campus_hubs_clearance_len CHECK (
    clearance_guide IS NULL OR char_length(clearance_guide) <= 8000
  ),
  CONSTRAINT campus_hubs_hostel_len CHECK (
    hostel_guide IS NULL OR char_length(hostel_guide) <= 8000
  ),
  CONSTRAINT campus_hubs_departments_len CHECK (
    departments_guide IS NULL OR char_length(departments_guide) <= 8000
  ),
  CONSTRAINT campus_hubs_status_check CHECK (
    status IN ('draft', 'published', 'archived')
  )
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS campus_hubs_slug_uidx
  ON public.campus_hubs (slug);

CREATE INDEX IF NOT EXISTS campus_hubs_status_idx
  ON public.campus_hubs (status);

CREATE INDEX IF NOT EXISTS campus_hubs_state_idx
  ON public.campus_hubs (state);

CREATE INDEX IF NOT EXISTS campus_hubs_published_at_idx
  ON public.campus_hubs (published_at DESC)
  WHERE status = 'published';

-- ── 2. Permissions & Row Level Security ───────────────────────────────────────

ALTER TABLE public.campus_hubs ENABLE ROW LEVEL SECURITY;

-- Revoke all direct table access
REVOKE ALL ON public.campus_hubs FROM anon, authenticated, PUBLIC;

GRANT SELECT ON public.campus_hubs TO anon, authenticated;

DROP POLICY IF EXISTS "campus_hubs: public select published" ON public.campus_hubs;
CREATE POLICY "campus_hubs: public select published"
  ON public.campus_hubs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "campus_hubs: admin select all" ON public.campus_hubs;
CREATE POLICY "campus_hubs: admin select all"
  ON public.campus_hubs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── 3. Admin RPC: Save Campus Hub (Insert or Update) ───────────────────────────

CREATE OR REPLACE FUNCTION public.admin_save_campus_hub(
  p_id                uuid,
  p_slug              text,
  p_name              text,
  p_state             text,
  p_summary           text DEFAULT NULL,
  p_clearance_guide   text DEFAULT NULL,
  p_hostel_guide      text DEFAULT NULL,
  p_departments_guide text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id   uuid;
  v_id         uuid;
  v_slug       text;
  v_name       text;
  v_state      text;
  v_summary    text;
  v_clearance  text;
  v_hostel     text;
  v_dept       text;
  v_is_update  boolean := FALSE;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Clean inputs
  v_slug      := lower(trim(p_slug));
  v_name      := trim(p_name);
  v_state     := trim(p_state);
  v_summary   := NULLIF(trim(p_summary), '');
  v_clearance := NULLIF(trim(p_clearance_guide), '');
  v_hostel    := NULLIF(trim(p_hostel_guide), '');
  v_dept      := NULLIF(trim(p_departments_guide), '');

  -- 3. Validate constraints
  IF char_length(v_slug) < 2 OR char_length(v_slug) > 60 THEN
    RAISE EXCEPTION 'Slug must be between 2 and 60 characters';
  END IF;

  IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug must contain only lowercase letters, numbers, and hyphens without consecutive hyphens';
  END IF;

  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'Name must be between 2 and 120 characters';
  END IF;

  IF char_length(v_state) < 2 OR char_length(v_state) > 40 THEN
    RAISE EXCEPTION 'State must be between 2 and 40 characters';
  END IF;

  IF v_summary IS NOT NULL AND char_length(v_summary) > 300 THEN
    RAISE EXCEPTION 'Summary cannot exceed 300 characters';
  END IF;

  IF v_clearance IS NOT NULL AND char_length(v_clearance) > 8000 THEN
    RAISE EXCEPTION 'Clearance guide cannot exceed 8,000 characters';
  END IF;

  IF v_hostel IS NOT NULL AND char_length(v_hostel) > 8000 THEN
    RAISE EXCEPTION 'Hostel guide cannot exceed 8,000 characters';
  END IF;

  IF v_dept IS NOT NULL AND char_length(v_dept) > 8000 THEN
    RAISE EXCEPTION 'Departments guide cannot exceed 8,000 characters';
  END IF;

  -- 4. Check if update or insert
  IF p_id IS NOT NULL THEN
    PERFORM 1 FROM public.campus_hubs WHERE id = p_id;
    IF FOUND THEN
      v_is_update := TRUE;
    END IF;
  END IF;

  IF v_is_update THEN
    UPDATE public.campus_hubs
    SET slug              = v_slug,
        name              = v_name,
        state             = v_state,
        summary           = v_summary,
        clearance_guide   = v_clearance,
        hostel_guide      = v_hostel,
        departments_guide = v_dept,
        last_reviewed_at  = now(),
        updated_at        = now()
    WHERE id = p_id;

    v_id := p_id;

    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    )
    VALUES (
      v_admin_id,
      'update_campus_hub',
      'campus_hubs',
      v_id::text,
      jsonb_build_object('slug', v_slug, 'name', v_name)
    );
  ELSE
    v_id := COALESCE(p_id, gen_random_uuid());

    INSERT INTO public.campus_hubs (
      id,
      slug,
      name,
      state,
      summary,
      clearance_guide,
      hostel_guide,
      departments_guide,
      status,
      last_reviewed_at,
      created_at,
      updated_at
    )
    VALUES (
      v_id,
      v_slug,
      v_name,
      v_state,
      v_summary,
      v_clearance,
      v_hostel,
      v_dept,
      'draft',
      now(),
      now(),
      now()
    );

    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    )
    VALUES (
      v_admin_id,
      'create_campus_hub',
      'campus_hubs',
      v_id::text,
      jsonb_build_object('slug', v_slug, 'name', v_name)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'slug', v_slug
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_campus_hub(uuid, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_campus_hub(uuid, text, text, text, text, text, text, text) TO authenticated;

-- ── 4. Admin RPC: Set Campus Hub Status ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_campus_hub_status(
  p_id     uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id     uuid;
  v_old_status   text;
  v_published_at timestamptz;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Validate status parameter
  IF p_status NOT IN ('draft', 'published', 'archived') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 3. Fetch current status and confirm existence
  SELECT status, published_at
    INTO v_old_status, v_published_at
  FROM public.campus_hubs
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campus hub not found: %', p_id;
  END IF;

  -- 4. Update the record
  UPDATE public.campus_hubs
  SET status           = p_status,
      published_at     = CASE
        WHEN p_status = 'published' AND v_published_at IS NULL THEN now()
        ELSE published_at
      END,
      last_reviewed_at = now(),
      updated_at       = now()
  WHERE id = p_id;

  -- 5. Record audit log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'set_campus_hub_status',
    'campus_hubs',
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

REVOKE ALL ON FUNCTION public.admin_set_campus_hub_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_campus_hub_status(uuid, text) TO authenticated;

-- ── 5. Admin RPC: Delete Campus Hub ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_campus_hub(
  p_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid;
  v_slug     text;
  v_name     text;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Verify existence before deletion
  SELECT slug, name
    INTO v_slug, v_name
  FROM public.campus_hubs
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campus hub not found: %', p_id;
  END IF;

  -- 3. Delete the hub record
  DELETE FROM public.campus_hubs
  WHERE id = p_id;

  -- 4. Record audit log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'delete_campus_hub',
    'campus_hubs',
    p_id::text,
    jsonb_build_object('slug', v_slug, 'name', v_name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_campus_hub(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_campus_hub(uuid) TO authenticated;

COMMIT;

