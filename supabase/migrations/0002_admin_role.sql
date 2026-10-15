-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_admin_role.sql
-- Zed Project: User Roles (Admin / User), is_admin() Function & Admin RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add role column to public.users with default 'user'
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 2. Optional role check constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- 3. Index on role for fast lookups
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);

-- 4. Security-definer function to check if the current caller is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 5. Admin select policy on public.users
DROP POLICY IF EXISTS "users: admin select all" ON public.users;
CREATE POLICY "users: admin select all"
  ON public.users
  FOR SELECT
  USING (public.is_admin());

-- 6. Admin update policy on public.users
DROP POLICY IF EXISTS "users: admin update all" ON public.users;
CREATE POLICY "users: admin update all"
  ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Admin manage policies for center_reports (defense-in-depth)
DROP POLICY IF EXISTS "center_reports: admin all" ON public.center_reports;
CREATE POLICY "center_reports: admin all"
  ON public.center_reports
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
