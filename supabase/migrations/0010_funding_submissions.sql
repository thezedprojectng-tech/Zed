-- ─── 0010_funding_submissions.sql ───────────────────────────────────────────────
-- Fund Your Idea v1: Pitch submissions, status tracking, and admin audit logging.
-- ALL statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- Do NOT run manually; apply via Supabase dashboard or CLI.

-- ── 1. funding_submissions Table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.funding_submissions (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid           REFERENCES public.users(id) ON DELETE SET NULL,
  full_name           text           NOT NULL CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 120),
  email               text           NOT NULL CHECK (char_length(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone               text           NOT NULL CHECK (char_length(phone) >= 7 AND char_length(phone) <= 30),
  project_title       text           NOT NULL CHECK (char_length(project_title) >= 3 AND char_length(project_title) <= 120),
  category            text           NOT NULL CHECK (char_length(category) >= 2 AND char_length(category) <= 60),
  stage               text           NOT NULL CHECK (stage IN ('idea', 'prototype', 'launched')),
  funding_needed_ngn  numeric(18,2)  NOT NULL CHECK (funding_needed_ngn > 0),
  summary             text           NOT NULL CHECK (char_length(summary) >= 20 AND char_length(summary) <= 1500),
  problem             text           NOT NULL CHECK (char_length(problem) >= 20 AND char_length(problem) <= 2000),
  plan                text           NOT NULL CHECK (char_length(plan) >= 20 AND char_length(plan) <= 2000),
  link                text           CHECK (link IS NULL OR (char_length(link) <= 500 AND link ~* '^https?://.+')),
  status              text           NOT NULL DEFAULT 'new'
                                     CHECK (status IN ('new', 'reviewing', 'shortlisted', 'declined')),
  ip_hash             text           NOT NULL CHECK (char_length(ip_hash) = 64),
  admin_note          text           CHECK (admin_note IS NULL OR char_length(admin_note) <= 3000),
  created_at          timestamptz    NOT NULL DEFAULT now(),
  reviewed_by         uuid           REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at         timestamptz
);

-- Indexes for performance, rate limiting, and admin queries
CREATE INDEX IF NOT EXISTS funding_submissions_created_at_idx 
  ON public.funding_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS funding_submissions_status_idx 
  ON public.funding_submissions (status);

CREATE INDEX IF NOT EXISTS funding_submissions_user_id_idx 
  ON public.funding_submissions (user_id);

CREATE INDEX IF NOT EXISTS funding_submissions_ip_hash_created_at_idx 
  ON public.funding_submissions (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS funding_submissions_email_created_at_idx 
  ON public.funding_submissions (lower(email), created_at DESC);

-- ── 2. Permissions & Row Level Security ─────────────────────────────────────────

ALTER TABLE public.funding_submissions ENABLE ROW LEVEL SECURITY;

-- Revoke all default table access from public, anon, and authenticated
REVOKE ALL ON public.funding_submissions FROM anon, authenticated, PUBLIC;

-- Only authenticated users can SELECT, filtered strictly by RLS
GRANT SELECT ON public.funding_submissions TO authenticated;

-- Direct inserts/updates are NOT granted to client roles.
-- Submissions are performed exclusively via server action using the Supabase Service Role client
-- after rate limiting, honeypot checking, and Turnstile verification.

DROP POLICY IF EXISTS "funding_submissions: admin select all" ON public.funding_submissions;
CREATE POLICY "funding_submissions: admin select all"
  ON public.funding_submissions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
  );

-- ── 3. Admin Update RPC ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_funding_submission(
  p_id         uuid,
  p_status     text,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id    uuid;
  v_old_status  text;
  v_old_note    text;
  v_title       text;
BEGIN
  -- 1. Ensure caller is an authenticated admin via is_admin()
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Validate status parameter
  IF p_status NOT IN ('new', 'reviewing', 'shortlisted', 'declined') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 3. Fetch current submission
  SELECT status, admin_note, project_title
    INTO v_old_status, v_old_note, v_title
  FROM public.funding_submissions
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funding submission not found: %', p_id;
  END IF;

  -- 4. Update the record
  UPDATE public.funding_submissions
  SET
    status      = p_status,
    admin_note  = p_admin_note,
    reviewed_by = v_admin_id,
    reviewed_at = now()
  WHERE id = p_id;

  -- 5. Record entry in admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'update_funding_submission',
    'funding_submissions',
    p_id::text,
    jsonb_build_object(
      'project_title', v_title,
      'old_status', v_old_status,
      'new_status', p_status,
      'old_note', v_old_note,
      'new_note', p_admin_note
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id,
    'status', p_status,
    'admin_note', p_admin_note
  );
END;
$$;

-- Revoke execute from PUBLIC and anon; grant only to authenticated users (is_admin checks inside)
REVOKE EXECUTE ON FUNCTION public.admin_update_funding_submission(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_funding_submission(uuid, text, text) TO authenticated;
