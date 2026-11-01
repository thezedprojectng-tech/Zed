BEGIN;

-- ─── 0026_mentorship_applications.sql ──────────────────────────────────────────
-- Mentorship Application Program: Applications, status tracking, unique email
-- constraint, service-role inserts only, admin RPCs, and audit logging.

-- ── 1. mentorship_applications Table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentorship_applications (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        text          NOT NULL CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 80),
  email            text          NOT NULL CHECK (char_length(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$'),
  phone            text          NOT NULL CHECK (char_length(phone) >= 7 AND char_length(phone) <= 30),
  location         text          NOT NULL CHECK (char_length(location) >= 2 AND char_length(location) <= 120),
  current_status   text          NOT NULL CHECK (current_status IN ('student', 'graduate', 'employed', 'job_seeker', 'other')),
  institution      text          NULL     CHECK (institution IS NULL OR (char_length(institution) >= 2 AND char_length(institution) <= 120)),
  interest_area    text          NOT NULL CHECK (interest_area IN ('frontend', 'backend', 'mobile', 'ui_ux', 'data', 'cybersecurity', 'product', 'other')),
  experience_level text          NOT NULL CHECK (experience_level IN ('beginner', 'some', 'intermediate')),
  goals            text          NOT NULL CHECK (char_length(goals) >= 20 AND char_length(goals) <= 1000),
  availability     text          NOT NULL CHECK (char_length(availability) >= 2 AND char_length(availability) <= 200),
  preferred_format text          NOT NULL CHECK (preferred_format IN ('online_chat', 'video_call', 'in_person', 'any')),
  consent          boolean       NOT NULL CHECK (consent = true),
  ip_hash          text          NOT NULL CHECK (char_length(ip_hash) = 64),
  status           text          NOT NULL DEFAULT 'new'
                                 CHECK (status IN ('new', 'reviewing', 'accepted', 'waitlisted', 'declined')),
  admin_notes      text          NULL     CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 2000),
  reviewed_by      uuid          NULL     REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at      timestamptz   NULL,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate applications per email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS mentorship_applications_email_lower_uidx
  ON public.mentorship_applications (lower(email));

-- Performance and query indexes
CREATE INDEX IF NOT EXISTS mentorship_applications_created_at_idx 
  ON public.mentorship_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS mentorship_applications_status_idx 
  ON public.mentorship_applications (status);

CREATE INDEX IF NOT EXISTS mentorship_applications_ip_hash_created_at_idx 
  ON public.mentorship_applications (ip_hash, created_at DESC);

-- ── 2. Permissions & Row Level Security ─────────────────────────────────────────

ALTER TABLE public.mentorship_applications ENABLE ROW LEVEL SECURITY;

-- Revoke all direct table access
REVOKE ALL ON public.mentorship_applications FROM anon, authenticated, PUBLIC;

-- Only authenticated users can SELECT, filtered strictly by admin check
GRANT SELECT ON public.mentorship_applications TO authenticated;

DROP POLICY IF EXISTS "mentorship_applications: admin select all" ON public.mentorship_applications;
CREATE POLICY "mentorship_applications: admin select all"
  ON public.mentorship_applications
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
  );

-- ── 3. Admin RPC: Set Mentorship Application Status ──────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_mentorship_status(
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
  IF p_status NOT IN ('new', 'reviewing', 'accepted', 'waitlisted', 'declined') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 3. Fetch current status and confirm existence
  SELECT status
    INTO v_old_status
  FROM public.mentorship_applications
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship application not found: %', p_id;
  END IF;

  -- 4. Update the record
  UPDATE public.mentorship_applications
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
    'set_mentorship_status',
    'mentorship_applications',
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

REVOKE ALL ON FUNCTION public.admin_set_mentorship_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_mentorship_status(uuid, text, text) TO authenticated;

-- ── 4. Admin RPC: Delete Mentorship Application ──────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_mentorship_application(
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
  FROM public.mentorship_applications
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship application not found: %', p_id;
  END IF;

  -- 3. Delete the application record
  DELETE FROM public.mentorship_applications
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
    'delete_mentorship_application',
    'mentorship_applications',
    p_id::text,
    '{}'::jsonb
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_mentorship_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_mentorship_application(uuid) TO authenticated;

COMMIT;

