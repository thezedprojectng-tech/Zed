-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_admin_audit_log.sql
-- Zed Project: Admin Audit Logging Schema & Strict RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx ON public.admin_audit_log (admin_id);

-- 3. Enable Row-Level Security
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Only authenticated users with role = 'admin' can read audit logs
DROP POLICY IF EXISTS "admin_audit_log: admin select" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log: admin select"
  ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
    )
  );

-- 5. Insert policy for authenticated admins and service role
DROP POLICY IF EXISTS "admin_audit_log: insert" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log: insert"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id
    OR auth.role() = 'service_role'
  );

-- 6. Immutability guarantee: NO UPDATE or DELETE policies are granted.
--    This ensures the audit log operates as an append-only ledger.
