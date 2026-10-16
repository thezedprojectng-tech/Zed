-- ─── 0006_zed_mining.sql ────────────────────────────────────────────────────
-- Zed Mining: daily $ZED point claiming with level matrix.
-- ALL statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE /
-- DROP POLICY IF EXISTS). Do NOT run manually; apply via Supabase dashboard
-- or CLI.
--
-- $ZED is an OFF-CHAIN engagement point. No withdrawals, conversions,
-- payouts, wallets-as-money, vouchers or data bundles exist in this version.
--
-- Level matrix (mirrors src/data/levels.ts – keep in sync):
--   1 Rookie    : x1.0,  claim 100,  cap 100  (account + verified)
--   2 Explorer  : x2.0,  claim 200,  cap 200  (complete 1 Skill course OR refer 3 verified friends)
--   3 Builder   : x3.5,  claim 350,  cap 350  (complete 3 courses + post 2 active community threads)
--   4 Pro       : x5.0,  claim 500,  cap 500  (complete 1 freelance gig OR buy Zed Pass)
--   5 Zed Legend: x10.0, claim 1000, cap 1000 (top 1% monthly active user / vetted community mentor)

-- ── 1. token_wallets ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.token_wallets (
  user_id        uuid           PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance_zed    numeric(12,2)  NOT NULL DEFAULT 0 CHECK (balance_zed >= 0),
  total_mined    numeric(12,2)  NOT NULL DEFAULT 0 CHECK (total_mined >= 0),
  streak_days    int            NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_mined_at  timestamptz,
  updated_at     timestamptz    NOT NULL DEFAULT now()
);

-- ── 2. mining_logs ───────────────────────────────────────────────────────────
-- Audit log of all daily mining claims. unique(user_id, claim_date) prevents double claims.

CREATE TABLE IF NOT EXISTS public.mining_logs (
  id                  bigint         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id             uuid           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_mined        numeric(8,2)   NOT NULL CHECK (amount_mined > 0),
  multiplier_applied  numeric(3,1)   NOT NULL CHECK (multiplier_applied >= 1.0),
  claim_date          date           NOT NULL,
  mined_at            timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT mining_logs_user_claim_date_unique UNIQUE (user_id, claim_date)
);

-- ── 3. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS mining_logs_user_mined_at_idx
  ON public.mining_logs (user_id, mined_at DESC);

CREATE INDEX IF NOT EXISTS mining_logs_mined_at_idx
  ON public.mining_logs (mined_at DESC);

-- ── 4. Row-Level Security – token_wallets ────────────────────────────────────
-- Users can SELECT only their own rows; NO insert/update/delete policies for users;
-- admins may SELECT all via public.is_admin().

ALTER TABLE public.token_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "token_wallets: user select own" ON public.token_wallets;
CREATE POLICY "token_wallets: user select own"
  ON public.token_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "token_wallets: admin select all" ON public.token_wallets;
CREATE POLICY "token_wallets: admin select all"
  ON public.token_wallets FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── 5. Row-Level Security – mining_logs ──────────────────────────────────────
-- Users can SELECT only their own rows; NO insert/update/delete policies for users;
-- admins may SELECT all via public.is_admin().

ALTER TABLE public.mining_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mining_logs: user select own" ON public.mining_logs;
CREATE POLICY "mining_logs: user select own"
  ON public.mining_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mining_logs: admin select all" ON public.mining_logs;
CREATE POLICY "mining_logs: admin select all"
  ON public.mining_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── 6. DB function: claim_daily_mining() ─────────────────────────────────────
--
-- Takes NO user id parameter. Uses auth.uid() inside; raises if null.
-- SECURITY DEFINER, SET search_path = public.
-- Requires users.is_verified = true.
-- Idempotent: checks Africa/Lagos calendar date; unique (user_id, claim_date) prevents double claims.
-- Updates token_wallets and inserts audit record into mining_logs.

CREATE OR REPLACE FUNCTION public.claim_daily_mining()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid;
  v_is_verified boolean;
  v_level_id    smallint;
  v_multiplier  numeric(3,1);
  v_amount      numeric(8,2);
  v_today       date;
  v_last_date   date;
  v_wallet      record;
  v_streak      int;
  v_new_balance numeric(12,2);
BEGIN
  -- ── 1. Authenticate ────────────────────────────────────────────────────────
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── 2. Verify user ─────────────────────────────────────────────────────────
  SELECT is_verified, level_id
  INTO   v_is_verified, v_level_id
  FROM   public.users
  WHERE  id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'User is not verified. Account must be verified to claim $ZED.';
  END IF;

  -- ── 3. Multiplier & Amount (mirrors src/data/levels.ts) ───────────────────
  v_multiplier := CASE v_level_id
    WHEN 2 THEN 2.0
    WHEN 3 THEN 3.5
    WHEN 4 THEN 5.0
    WHEN 5 THEN 10.0
    ELSE        1.0   -- Rookie / default
  END;

  v_amount := ROUND(100.0 * v_multiplier, 2);

  -- ── 4. Date check (Africa/Lagos calendar date) ────────────────────────────
  v_today := (now() AT TIME ZONE 'Africa/Lagos')::date;

  IF EXISTS (
    SELECT 1 FROM public.mining_logs
    WHERE user_id = v_user_id AND claim_date = v_today
  ) THEN
    RAISE EXCEPTION 'Already claimed today';
  END IF;

  -- ── 5. Lock or create wallet & calculate streak ───────────────────────────
  SELECT * INTO v_wallet
  FROM   public.token_wallets
  WHERE  user_id = v_user_id
  FOR UPDATE;

  IF FOUND THEN
    v_last_date := (v_wallet.last_mined_at AT TIME ZONE 'Africa/Lagos')::date;
    IF v_last_date = v_today THEN
      RAISE EXCEPTION 'Already claimed today';
    END IF;

    IF v_last_date = v_today - 1 THEN
      v_streak := v_wallet.streak_days + 1;
    ELSE
      v_streak := 1;
    END IF;

    v_new_balance := v_wallet.balance_zed + v_amount;

    UPDATE public.token_wallets SET
      balance_zed   = v_new_balance,
      total_mined   = total_mined + v_amount,
      streak_days   = v_streak,
      last_mined_at = now(),
      updated_at    = now()
    WHERE user_id = v_user_id;

  ELSE
    -- First-time claim: initialize wallet row
    v_streak := 1;
    v_new_balance := v_amount;

    INSERT INTO public.token_wallets
      (user_id, balance_zed, total_mined, streak_days, last_mined_at, updated_at)
    VALUES
      (v_user_id, v_amount, v_amount, 1, now(), now());
  END IF;

  -- ── 6. Insert audit record into mining_logs ────────────────────────────────
  INSERT INTO public.mining_logs
    (user_id, amount_mined, multiplier_applied, claim_date, mined_at)
  VALUES
    (v_user_id, v_amount, v_multiplier, v_today, now());

  -- ── 7. Return success result ───────────────────────────────────────────────
  RETURN jsonb_build_object(
    'ok',          true,
    'amount',      v_amount,
    'new_balance', v_new_balance,
    'streak_days', v_streak
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Already claimed today';
END;
$$;

-- ── 7. Security: Permissions ────────────────────────────────────────────────
-- REVOKE EXECUTE from public and anon; GRANT EXECUTE only to authenticated.

REVOKE ALL ON FUNCTION public.claim_daily_mining() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.claim_daily_mining() TO authenticated;
