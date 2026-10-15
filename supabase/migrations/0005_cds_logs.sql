-- ─── 0005_cds_logs.sql ─────────────────────────────────────────────────────────
-- CDS Logger: personal attendance tracking for NYSC corps members.
-- ALL statements are idempotent (IF NOT EXISTS / DROP … IF EXISTS).
-- Do NOT run this manually; apply via Supabase dashboard or CLI.

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cds_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date        NOT NULL,
  group_name   text        NOT NULL CHECK (char_length(group_name) BETWEEN 1 AND 100),
  activity     text        NOT NULL CHECK (char_length(activity) BETWEEN 1 AND 500),
  hours        numeric(4,1) NOT NULL CHECK (hours > 0 AND hours <= 12),
  notes        text        CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS cds_logs_user_date_idx
  ON public.cds_logs (user_id, session_date DESC);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.cds_logs ENABLE ROW LEVEL SECURITY;

-- Users: select own rows
DROP POLICY IF EXISTS "cds_logs: user select own" ON public.cds_logs;
CREATE POLICY "cds_logs: user select own"
  ON public.cds_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users: insert own rows
DROP POLICY IF EXISTS "cds_logs: user insert own" ON public.cds_logs;
CREATE POLICY "cds_logs: user insert own"
  ON public.cds_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users: update own rows
DROP POLICY IF EXISTS "cds_logs: user update own" ON public.cds_logs;
CREATE POLICY "cds_logs: user update own"
  ON public.cds_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users: delete own rows
DROP POLICY IF EXISTS "cds_logs: user delete own" ON public.cds_logs;
CREATE POLICY "cds_logs: user delete own"
  ON public.cds_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins: select all rows
DROP POLICY IF EXISTS "cds_logs: admin select all" ON public.cds_logs;
CREATE POLICY "cds_logs: admin select all"
  ON public.cds_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());
