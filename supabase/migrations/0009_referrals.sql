-- ─── 0009_referrals.sql ───────────────────────────────────────────────
-- Zed Referrals v1: Unique referral codes, manual & link capture,
-- and verification-triggered wallet rewards.
-- ALL statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- Do NOT run manually; apply via Supabase dashboard or CLI.

-- ── 1. Function to generate random, unambiguous referral codes ───────────────
-- Uses 32 characters (excluding 0, O, 1, I, L) to prevent ambiguity:
-- '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i int;
  done boolean := false;
BEGIN
  WHILE NOT done LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = result) THEN
      done := true;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- ── 2. Add referral_code to public.users ──────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code text;

-- Backfill existing users who do not have a referral code
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM public.users WHERE referral_code IS NULL LOOP
    UPDATE public.users
    SET referral_code = public.generate_referral_code()
    WHERE id = u.id;
  END LOOP;
END $$;

-- Enforce unique index and not-null constraint
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique_idx
  ON public.users (referral_code);

ALTER TABLE public.users
  ALTER COLUMN referral_code DROP DEFAULT;

ALTER TABLE public.users
  ALTER COLUMN referral_code SET NOT NULL;

-- Ensure BEFORE INSERT trigger populates referral_code if omitted by handle_new_auth_user()
CREATE OR REPLACE FUNCTION public.handle_user_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR trim(NEW.referral_code) = '' THEN
    NEW.referral_code := public.generate_referral_code();
  ELSE
    NEW.referral_code := upper(trim(NEW.referral_code));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_referral_code ON public.users;
CREATE TRIGGER trg_users_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_referral_code();

-- ── 3. referral_settings (Single-row configuration) ──────────────────────────

CREATE TABLE IF NOT EXISTS public.referral_settings (
  id                         int            PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled                    boolean        NOT NULL DEFAULT false,
  referrer_reward_zed        numeric(18,2)  NOT NULL DEFAULT 100
                                            CHECK (referrer_reward_zed >= 0 AND referrer_reward_zed <= 10000),
  referee_reward_zed         numeric(18,2)  NOT NULL DEFAULT 50
                                            CHECK (referee_reward_zed >= 0 AND referee_reward_zed <= 10000),
  max_rewarded_per_referrer  int            NOT NULL DEFAULT 50
                                            CHECK (max_rewarded_per_referrer >= 0 AND max_rewarded_per_referrer <= 1000),
  updated_at                 timestamptz    NOT NULL DEFAULT now(),
  updated_by                 uuid           REFERENCES public.users(id) ON DELETE SET NULL
);

-- Seed initial row if not present
INSERT INTO public.referral_settings (
  id,
  enabled,
  referrer_reward_zed,
  referee_reward_zed,
  max_rewarded_per_referrer
)
VALUES (1, false, 100, 50, 50)
ON CONFLICT (id) DO NOTHING;

-- ── 4. referrals table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referrals (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id          uuid           NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  referred_id          uuid           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status               text           NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'rewarded', 'capped', 'rejected')),
  referrer_reward_zed  numeric(18,2)  NOT NULL DEFAULT 0 CHECK (referrer_reward_zed >= 0),
  referee_reward_zed   numeric(18,2)  NOT NULL DEFAULT 0 CHECK (referee_reward_zed >= 0),
  created_at           timestamptz    NOT NULL DEFAULT now(),
  rewarded_at          timestamptz,
  CONSTRAINT referrals_no_self_referral CHECK (referrer_id <> referred_id),
  CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id)
);

-- ── 5. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx
  ON public.referrals (referrer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS referrals_status_idx
  ON public.referrals (status);

-- ── 6. Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- referral_settings: authenticated users can read settings
DROP POLICY IF EXISTS "referral_settings: authenticated select" ON public.referral_settings;
CREATE POLICY "referral_settings: authenticated select"
  ON public.referral_settings FOR SELECT
  TO authenticated
  USING (true);

-- referrals: user select rows where they are the referrer or referred
DROP POLICY IF EXISTS "referrals: user select related" ON public.referrals;
CREATE POLICY "referrals: user select related"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- referrals: admin select all
DROP POLICY IF EXISTS "referrals: admin select all" ON public.referrals;
CREATE POLICY "referrals: admin select all"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Revoke all table permissions from anon
REVOKE ALL ON public.referral_settings, public.referrals FROM anon;

-- Keep SELECT grants on tables for authenticated (filtered by RLS)
GRANT SELECT ON public.referral_settings, public.referrals TO authenticated;

-- Revoke direct writes for client roles (all modifications happen via RPC)
REVOKE INSERT, UPDATE, DELETE ON public.referral_settings, public.referrals FROM authenticated, PUBLIC;

-- ── 7. Function: apply_referral(p_code text) ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.apply_referral(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id       uuid;
  v_caller_created  timestamptz;
  v_is_verified     boolean;
  v_referrer_id     uuid;
  v_clean_code      text;
  v_referral_id     uuid;
BEGIN
  -- 1. Authenticate
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- 2. Clean input
  v_clean_code := upper(trim(COALESCE(p_code, '')));
  IF length(v_clean_code) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_CODE');
  END IF;

  -- 3. Verify caller status
  SELECT created_at, is_verified
  INTO   v_caller_created, v_is_verified
  FROM   public.users
  WHERE  id = v_caller_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'USER_NOT_FOUND');
  END IF;

  -- Caller must not be verified yet
  IF v_is_verified IS TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_VERIFIED');
  END IF;

  -- Caller account must be recent (created within 7 days)
  IF v_caller_created < (now() - interval '7 days') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ACCOUNT_TOO_OLD');
  END IF;

  -- Caller must not already have a referrer
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_caller_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_REFERRED');
  END IF;

  -- 4. Find referrer by code
  SELECT id
  INTO   v_referrer_id
  FROM   public.users
  WHERE  referral_code = v_clean_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CODE_NOT_FOUND');
  END IF;

  -- No self-referral
  IF v_referrer_id = v_caller_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'SELF_REFERRAL');
  END IF;

  -- 5. Insert pending referral
  BEGIN
    INSERT INTO public.referrals (
      referrer_id,
      referred_id,
      status
    )
    VALUES (
      v_referrer_id,
      v_caller_id,
      'pending'
    )
    RETURNING id INTO v_referral_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_REFERRED');
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'referral_id', v_referral_id
  );
END;
$$;

-- ── 8. Internal Function: process_referral_reward(p_referred_id uuid) ────────

CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral       record;
  v_settings       record;
  v_rewarded_count int;
  v_ref_reward     numeric(18,2);
  v_user_reward    numeric(18,2);
BEGIN
  -- 1. Lock the referral record for this referred user
  SELECT *
  INTO   v_referral
  FROM   public.referrals
  WHERE  referred_id = p_referred_id
  FOR UPDATE;

  -- Only proceed if there is a pending referral
  IF NOT FOUND OR v_referral.status <> 'pending' THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_referral.referrer_id AND is_verified IS TRUE
  ) THEN
    RETURN;
  END IF;

  -- 2. Fetch global referral settings
  SELECT *
  INTO   v_settings
  FROM   public.referral_settings
  WHERE  id = 1;

  -- If the referral feature is disabled, leave as pending until enabled
  IF NOT FOUND OR v_settings.enabled IS NOT TRUE THEN
    RETURN;
  END IF;

  -- 3. Take transaction-scoped advisory lock on referrer to serialize concurrent reward processing
  PERFORM pg_advisory_xact_lock(hashtext(v_referral.referrer_id::text));

  -- Check referrer's rewarded count against max_rewarded_per_referrer
  SELECT COUNT(*)
  INTO   v_rewarded_count
  FROM   public.referrals
  WHERE  referrer_id = v_referral.referrer_id
    AND  status = 'rewarded';

  IF v_rewarded_count >= v_settings.max_rewarded_per_referrer THEN
    -- Cap reached: mark referral capped so it does not pay further
    UPDATE public.referrals
    SET status      = 'capped',
        rewarded_at = now()
    WHERE id = v_referral.id;
    RETURN;
  END IF;

  v_ref_reward  := v_settings.referrer_reward_zed;
  v_user_reward := v_settings.referee_reward_zed;

  -- 4. Credit Referrer Wallet (create row if it does not exist, matching 0006 columns exactly)
  IF v_ref_reward > 0 THEN
    INSERT INTO public.token_wallets (
      user_id,
      balance_zed,
      total_mined,
      streak_days,
      last_mined_at,
      updated_at
    )
    VALUES (
      v_referral.referrer_id,
      v_ref_reward,
      0,
      0,
      NULL,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET balance_zed = public.token_wallets.balance_zed + v_ref_reward,
        updated_at  = now();
  END IF;

  -- 5. Credit Referred User Wallet (create row if it does not exist, matching 0006 columns exactly)
  IF v_user_reward > 0 THEN
    INSERT INTO public.token_wallets (
      user_id,
      balance_zed,
      total_mined,
      streak_days,
      last_mined_at,
      updated_at
    )
    VALUES (
      v_referral.referred_id,
      v_user_reward,
      0,
      0,
      NULL,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET balance_zed = public.token_wallets.balance_zed + v_user_reward,
        updated_at  = now();
  END IF;

  -- 6. Mark referral as rewarded
  UPDATE public.referrals
  SET status              = 'rewarded',
      referrer_reward_zed = v_ref_reward,
      referee_reward_zed  = v_user_reward,
      rewarded_at         = now()
  WHERE id = v_referral.id;
END;
$$;

-- Revoke execute from public/anon/authenticated (internal security definer only)
REVOKE ALL ON FUNCTION public.process_referral_reward(uuid) FROM PUBLIC, anon, authenticated;

-- ── 9. Trigger on public.users (After verification) ──────────────────────────

CREATE OR REPLACE FUNCTION public.trg_users_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trigger reward processing when is_verified transitions from false/null to true
  IF (OLD.is_verified IS NOT TRUE) AND (NEW.is_verified IS TRUE) THEN
    BEGIN
      PERFORM public.process_referral_reward(NEW.id);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'process_referral_reward failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_verification_referral ON public.users;
CREATE TRIGGER trg_users_verification_referral
  AFTER UPDATE OF is_verified ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_users_on_verification();

-- ── 10. Admin Function: admin_process_pending_referrals() ─────────────────────

CREATE OR REPLACE FUNCTION public.admin_process_pending_referrals()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id      uuid;
  v_settings      record;
  v_ref           record;
  v_processed     int := 0;
  v_status_after  text;
BEGIN
  -- 1. Admin authorization check
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- 2. Check if referrals are enabled
  SELECT enabled
  INTO   v_settings
  FROM   public.referral_settings
  WHERE  id = 1;

  IF NOT FOUND OR v_settings.enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'Referrals are not enabled';
  END IF;

  -- 3. Process all pending referrals where the referred user is verified
  FOR v_ref IN
    SELECT r.id, r.referred_id
    FROM   public.referrals r
    JOIN   public.users u ON u.id = r.referred_id
    WHERE  r.status = 'pending'
      AND  u.is_verified IS TRUE
  LOOP
    PERFORM public.process_referral_reward(v_ref.referred_id);

    -- Only count referrals whose status actually transitioned to rewarded or capped
    SELECT status
    INTO   v_status_after
    FROM   public.referrals
    WHERE  id = v_ref.id;

    IF v_status_after IN ('rewarded', 'capped') THEN
      v_processed := v_processed + 1;
    END IF;
  END LOOP;

  -- 4. Log to admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'admin_process_pending_referrals',
    'referrals',
    'batch',
    jsonb_build_object('processed_count', v_processed)
  );

  RETURN jsonb_build_object('ok', true, 'processed_count', v_processed);
END;
$$;

-- ── 11. Admin Function: admin_update_referral_settings() ──────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_referral_settings(
  p_enabled boolean,
  p_referrer_reward_zed numeric,
  p_referee_reward_zed numeric,
  p_max_rewarded_per_referrer int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- 1. Admin authorization check
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- 2. Validate non-negative and upper bounds
  IF p_referrer_reward_zed < 0 THEN
    RAISE EXCEPTION 'Referrer reward cannot be negative';
  END IF;

  IF p_referrer_reward_zed > 10000 THEN
    RAISE EXCEPTION 'Referrer reward cannot exceed 10000';
  END IF;

  IF p_referee_reward_zed < 0 THEN
    RAISE EXCEPTION 'Referee reward cannot be negative';
  END IF;

  IF p_referee_reward_zed > 10000 THEN
    RAISE EXCEPTION 'Referee reward cannot exceed 10000';
  END IF;

  IF p_max_rewarded_per_referrer < 0 THEN
    RAISE EXCEPTION 'Maximum rewarded referrals cannot be negative';
  END IF;

  IF p_max_rewarded_per_referrer > 1000 THEN
    RAISE EXCEPTION 'Maximum rewarded referrals cannot exceed 1000';
  END IF;

  -- 3. Update settings
  UPDATE public.referral_settings
  SET enabled                   = p_enabled,
      referrer_reward_zed       = ROUND(p_referrer_reward_zed, 2),
      referee_reward_zed        = ROUND(p_referee_reward_zed, 2),
      max_rewarded_per_referrer = p_max_rewarded_per_referrer,
      updated_at                = now(),
      updated_by                = v_admin_id
  WHERE id = 1;

  -- 4. Log to admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'referral_settings_update',
    'referral_settings',
    '1',
    jsonb_build_object(
      'enabled',                   p_enabled,
      'referrer_reward_zed',       ROUND(p_referrer_reward_zed, 2),
      'referee_reward_zed',        ROUND(p_referee_reward_zed, 2),
      'max_rewarded_per_referrer', p_max_rewarded_per_referrer
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ── 12. Helper Functions for Masked Name and User Referrals ───────────────────

CREATE OR REPLACE FUNCTION public.mask_user_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_trimmed text;
  v_parts text[];
BEGIN
  IF p_name IS NULL THEN
    RETURN 'User';
  END IF;
  v_trimmed := trim(p_name);
  IF v_trimmed = '' THEN
    RETURN 'User';
  END IF;
  v_parts := regexp_split_to_array(v_trimmed, '\s+');
  IF array_length(v_parts, 1) = 1 THEN
    RETURN v_parts[1];
  END IF;
  RETURN v_parts[1] || ' ' || upper(substr(v_parts[array_length(v_parts, 1)], 1, 1)) || '.';
END;
$$;

-- Returns the caller's referred users list securely without exposing full names/phones
CREATE OR REPLACE FUNCTION public.get_user_referrals()
RETURNS TABLE (
  id                   uuid,
  referred_id          uuid,
  masked_name          text,
  status               text,
  referrer_reward_zed  numeric(18,2),
  created_at           timestamptz,
  rewarded_at          timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.referred_id,
    public.mask_user_name(u.full_name) AS masked_name,
    r.status,
    r.referrer_reward_zed,
    r.created_at,
    r.rewarded_at
  FROM public.referrals r
  JOIN public.users u ON u.id = r.referred_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC
  LIMIT 100;
END;
$$;

-- ── 13. Permissions ──────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.mask_user_name(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.mask_user_name(text) TO authenticated;

REVOKE ALL ON FUNCTION public.apply_referral(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_referrals() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_user_referrals() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_process_pending_referrals() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_process_pending_referrals() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_referral_settings(boolean, numeric, numeric, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_update_referral_settings(boolean, numeric, numeric, int) TO authenticated;
