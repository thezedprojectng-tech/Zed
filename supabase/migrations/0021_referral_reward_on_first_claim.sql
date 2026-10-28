-- Migration: 0021_referral_reward_on_first_claim.sql
-- Description: Trigger referral reward payout on daily mining claim instead of requiring NIN verification.
-- Wraps claim_daily_mining, process_referral_reward, and admin_process_pending_referrals.

BEGIN;

-- ── 1. claim_daily_mining: trigger referral payout on successful claim ───────

CREATE OR REPLACE FUNCTION public.claim_daily_mining()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id     uuid;
  v_level_id    smallint;
  v_multiplier  numeric(3,1);
  v_amount      numeric(8,2);
  v_today       date;
  v_last_date   date;
  v_wallet      record;
  v_streak      int;
  v_new_balance numeric(12,2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT level_id INTO v_level_id
  FROM   public.users
  WHERE  id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  v_multiplier := CASE v_level_id
    WHEN 2 THEN 2.0
    WHEN 3 THEN 3.5
    WHEN 4 THEN 5.0
    WHEN 5 THEN 10.0
    ELSE        1.0
  END;

  v_amount := ROUND(100.0 * v_multiplier, 2);
  v_today  := (now() AT TIME ZONE 'Africa/Lagos')::date;

  IF EXISTS (
    SELECT 1 FROM public.mining_logs
    WHERE user_id = v_user_id AND claim_date = v_today
  ) THEN
    RAISE EXCEPTION 'Already claimed today';
  END IF;

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
    v_streak := 1;
    v_new_balance := v_amount;

    INSERT INTO public.token_wallets
      (user_id, balance_zed, total_mined, streak_days, last_mined_at, updated_at)
    VALUES
      (v_user_id, v_amount, v_amount, 1, now(), now());
  END IF;

  INSERT INTO public.mining_logs
    (user_id, amount_mined, multiplier_applied, claim_date, mined_at)
  VALUES
    (v_user_id, v_amount, v_multiplier, v_today, now());

  BEGIN
    PERFORM public.process_referral_reward(v_user_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'process_referral_reward failed for user %: % (SQLSTATE %)', v_user_id, SQLERRM, SQLSTATE;
  END;

  SELECT balance_zed INTO v_new_balance FROM public.token_wallets WHERE user_id = v_user_id;

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
$function$;

REVOKE ALL ON FUNCTION public.claim_daily_mining() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_mining() TO authenticated;

-- ── 2. process_referral_reward: remove referrer verification requirement ─────

CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- ── 3. admin_process_pending_referrals: filter by mining claim existence ──────

CREATE OR REPLACE FUNCTION public.admin_process_pending_referrals()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

  -- 3. Process all pending referrals where the referred user has completed at least one mining claim
  FOR v_ref IN
    SELECT r.id, r.referred_id
    FROM   public.referrals r
    WHERE  r.status = 'pending'
      AND  EXISTS (
        SELECT 1 FROM public.mining_logs m
        WHERE m.user_id = r.referred_id
      )
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

REVOKE ALL ON FUNCTION public.admin_process_pending_referrals() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_process_pending_referrals() TO authenticated;

COMMIT;

