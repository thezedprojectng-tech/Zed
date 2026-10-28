BEGIN;

-- ─── 0022_campus_ambassadors.sql ──────────────────────────────────────────────
-- Campus Ambassador Program: Applications, status tracking, unique email constraint,
-- service-role inserts only, admin RPCs, and audit logging.

-- ── 1. ambassador_applications Table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ambassador_applications (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text           NOT NULL CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 80),
  email           text           NOT NULL CHECK (char_length(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$'),
  phone           text           NOT NULL CHECK (char_length(phone) >= 7 AND char_length(phone) <= 30),
  institution     text           NOT NULL CHECK (char_length(institution) >= 2 AND char_length(institution) <= 120),
  state           text           NOT NULL CHECK (char_length(state) >= 2 AND char_length(state) <= 50),
  course          text           NOT NULL CHECK (char_length(course) >= 2 AND char_length(course) <= 100),
  level           text           NOT NULL CHECK (char_length(level) >= 1 AND char_length(level) <= 50),
  social_handle   text           NULL CHECK (social_handle IS NULL OR char_length(social_handle) <= 100),
  why_ambassador  text           NOT NULL CHECK (char_length(why_ambassador) >= 30 AND char_length(why_ambassador) <= 1000),
  referral_code   text           NULL CHECK (referral_code IS NULL OR char_length(referral_code) <= 20),
  consent         boolean        NOT NULL CHECK (consent IS TRUE),
  status          text           NOT NULL DEFAULT 'new'
                                 CHECK (status IN ('new', 'reviewing', 'approved', 'rejected')),
  user_id         uuid           NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ip_hash         text           NOT NULL CHECK (char_length(ip_hash) = 64),
  reviewed_by     uuid           NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at     timestamptz    NULL,
  created_at      timestamptz    NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate applications per email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS ambassador_applications_email_lower_uidx
  ON public.ambassador_applications (lower(email));

-- Performance and query indexes
CREATE INDEX IF NOT EXISTS ambassador_applications_created_at_idx 
  ON public.ambassador_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS ambassador_applications_status_idx 
  ON public.ambassador_applications (status);

CREATE INDEX IF NOT EXISTS ambassador_applications_ip_hash_created_at_idx 
  ON public.ambassador_applications (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS ambassador_applications_user_id_idx 
  ON public.ambassador_applications (user_id);

-- ── 2. Permissions & Row Level Security ─────────────────────────────────────────

ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

-- Revoke all direct table access
REVOKE ALL ON public.ambassador_applications FROM anon, authenticated, PUBLIC;

-- Only authenticated users can SELECT, filtered strictly by admin check
GRANT SELECT ON public.ambassador_applications TO authenticated;

DROP POLICY IF EXISTS "ambassador_applications: admin select all" ON public.ambassador_applications;
CREATE POLICY "ambassador_applications: admin select all"
  ON public.ambassador_applications
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
  );

-- ── 3. Admin RPC: Set Ambassador Application Status ─────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_ambassador_status(
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
  IF p_status NOT IN ('new', 'reviewing', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 3. Fetch current status and confirm existence
  SELECT status
    INTO v_old_status
  FROM public.ambassador_applications
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ambassador application not found: %', p_id;
  END IF;

  -- 4. Update the record
  UPDATE public.ambassador_applications
  SET status = p_status,
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
    'set_ambassador_status',
    'ambassador_applications',
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

REVOKE ALL ON FUNCTION public.admin_set_ambassador_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_ambassador_status(uuid, text) TO authenticated;

-- ── 4. Admin RPC: Delete Ambassador Application ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_ambassador_application(
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
  FROM public.ambassador_applications
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ambassador application not found: %', p_id;
  END IF;

  -- 3. Delete the application record
  DELETE FROM public.ambassador_applications
  WHERE id = p_id;

  -- 4. Record entry in admin_audit_log without PII or created_at
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'delete_ambassador_application',
    'ambassador_applications',
    p_id::text,
    '{}'::jsonb
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_ambassador_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_ambassador_application(uuid) TO authenticated;

COMMIT;

