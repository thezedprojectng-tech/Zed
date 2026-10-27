BEGIN;

-- ─── 0018_contact_messages.sql ──────────────────────────────────────────────
-- Contact Inbox v1: Contact messages, status tracking, and admin audit logging.
-- ALL statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- NOTE: Do NOT run automatically; applied via Supabase CLI or dashboard.

-- ── 1. contact_messages Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text           NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 80),
  email       text           NOT NULL CHECK (char_length(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone       text           NULL CHECK (phone IS NULL OR char_length(phone) <= 30),
  subject     text           NOT NULL CHECK (char_length(subject) >= 3 AND char_length(subject) <= 120),
  message     text           NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 2000),
  status      text           NOT NULL DEFAULT 'new'
                             CHECK (status IN ('new', 'read', 'archived')),
  user_id     uuid           NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ip_hash     text           NOT NULL CHECK (char_length(ip_hash) = 64),
  created_at  timestamptz    NOT NULL DEFAULT now()
);

-- Indexes for performance, rate limiting, and admin queries
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx 
  ON public.contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx 
  ON public.contact_messages (status);

CREATE INDEX IF NOT EXISTS contact_messages_ip_hash_created_at_idx 
  ON public.contact_messages (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_user_id_idx 
  ON public.contact_messages (user_id);

-- ── 2. Permissions & Row Level Security ─────────────────────────────────────────

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Revoke all default table access from public, anon, and authenticated
REVOKE ALL ON public.contact_messages FROM anon, authenticated, PUBLIC;

-- Only authenticated users can SELECT, filtered strictly by RLS
GRANT SELECT ON public.contact_messages TO authenticated;

-- Direct inserts/updates are NOT granted to client roles.
-- Submissions are performed exclusively via server action using the Supabase Service Role client
-- after rate limiting, honeypot checking, and Turnstile verification.

DROP POLICY IF EXISTS "contact_messages: admin select all" ON public.contact_messages;
CREATE POLICY "contact_messages: admin select all"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
  );

-- ── 3. Admin RPC: Set Contact Status ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_contact_status(
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
  IF p_status NOT IN ('new', 'read', 'archived') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 3. Fetch current status and confirm existence
  SELECT status
    INTO v_old_status
  FROM public.contact_messages
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact message not found: %', p_id;
  END IF;

  -- 4. Update the record
  UPDATE public.contact_messages
  SET status = p_status
  WHERE id = p_id;

  -- 5. Record entry in admin_audit_log (do NOT pass created_at)
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'set_contact_status',
    'contact_messages',
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

REVOKE ALL ON FUNCTION public.admin_set_contact_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_contact_status(uuid, text) TO authenticated;

-- ── 4. Admin RPC: Delete Contact Message ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_contact_message(
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
  FROM public.contact_messages
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact message not found: %', p_id;
  END IF;

  -- 3. Delete the message record
  DELETE FROM public.contact_messages
  WHERE id = p_id;

  -- 4. Record entry in admin_audit_log (do NOT pass created_at)
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'delete_contact_message',
    'contact_messages',
    p_id::text,
    '{}'::jsonb
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_contact_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_contact_message(uuid) TO authenticated;

COMMIT;
