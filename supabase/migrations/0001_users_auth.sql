-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_users_auth.sql
-- Zed Project – Phase 1: Users table + RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users table ───────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
                    REFERENCES auth.users (id) ON DELETE CASCADE,
  phone_number    VARCHAR(15)  UNIQUE NOT NULL,
  nin_hash        VARCHAR(64)  UNIQUE,           -- salted SHA-256; never store raw NIN
  full_name       TEXT         NOT NULL,
  avatar_url      TEXT,
  level_id        INT          NOT NULL DEFAULT 1
                    CHECK (level_id BETWEEN 1 AND 5),
  is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Automatically update `updated_at` on row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row
CREATE POLICY "users: select own row"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own row
CREATE POLICY "users: update own row"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (backend) may insert during registration
CREATE POLICY "users: service role insert"
  ON public.users
  FOR INSERT
  WITH CHECK (TRUE);          -- restricted further by SUPABASE_SERVICE_ROLE_KEY usage

-- ── Auto-create user row after Supabase Auth sign-up ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, phone_number, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Zed User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
