-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_init.sql
-- Zed Project: Core Database Schema & Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Public Users / Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  phone_number    TEXT UNIQUE NOT NULL,
  nin_hash        TEXT UNIQUE,                     -- Salted SHA-256; raw NIN is never stored
  full_name       TEXT NOT NULL,
  avatar_url      TEXT,
  level_id        INT NOT NULL DEFAULT 1 CHECK (level_id BETWEEN 1 AND 5),
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by phone number
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON public.users (phone_number);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Auto-create public.users row from auth.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_full_name TEXT;
BEGIN
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone, '');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Zed Citizen');

  INSERT INTO public.users (id, phone_number, full_name)
  VALUES (NEW.id, v_phone, v_full_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. Row-Level Security for public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users: select own row" ON public.users;
CREATE POLICY "users: select own row"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users: update own row" ON public.users;
-- Regular users can only update non-sensitive profile columns (e.g., full_name, avatar_url, phone_number).
-- level_id, is_verified, and nin_hash must only be modified server-side with the service role key.
CREATE POLICY "users: update own row"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND level_id IS NOT DISTINCT FROM (SELECT u.level_id FROM public.users u WHERE u.id = auth.uid())
    AND is_verified IS NOT DISTINCT FROM (SELECT u.is_verified FROM public.users u WHERE u.id = auth.uid())
    AND nin_hash IS NOT DISTINCT FROM (SELECT u.nin_hash FROM public.users u WHERE u.id = auth.uid())
  );

-- 6. Nav Progress Table
CREATE TABLE IF NOT EXISTS public.nav_progress (
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  flow_id     TEXT NOT NULL,
  state       JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores the complete NavProgress object
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, flow_id)
);

DROP TRIGGER IF EXISTS nav_progress_updated_at ON public.nav_progress;
CREATE TRIGGER nav_progress_updated_at
  BEFORE UPDATE ON public.nav_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.nav_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nav_progress: select own" ON public.nav_progress;
CREATE POLICY "nav_progress: select own"
  ON public.nav_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nav_progress: insert own" ON public.nav_progress;
CREATE POLICY "nav_progress: insert own"
  ON public.nav_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "nav_progress: update own" ON public.nav_progress;
CREATE POLICY "nav_progress: update own"
  ON public.nav_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "nav_progress: delete own" ON public.nav_progress;
CREATE POLICY "nav_progress: delete own"
  ON public.nav_progress FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Center Reports Table
CREATE TABLE IF NOT EXISTS public.center_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  center_name   TEXT NOT NULL,
  state         TEXT NOT NULL,
  wait_minutes  INT NOT NULL CHECK (wait_minutes >= 0),
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.center_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "center_reports: public read" ON public.center_reports;
CREATE POLICY "center_reports: public read"
  ON public.center_reports FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "center_reports: authenticated insert" ON public.center_reports;
CREATE POLICY "center_reports: authenticated insert"
  ON public.center_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
