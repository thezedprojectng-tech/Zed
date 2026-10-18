-- ─── 0008_zed_withdrawals.sql ───────────────────────────────────────────────
-- Zed Withdrawals v1: Manual bank withdrawals & admin-set token price.
-- ALL statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- Do NOT run manually; apply via Supabase dashboard or CLI.

-- ── 1. zed_settings (Single-row configuration) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.zed_settings (
  id                   int            PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token_price_ngn      numeric(18,4)  NOT NULL DEFAULT 0 CHECK (token_price_ngn >= 0),
  withdrawals_enabled  boolean        NOT NULL DEFAULT false,
  min_withdraw_zed     numeric(18,2)  NOT NULL DEFAULT 1000 CHECK (min_withdraw_zed >= 0),
  max_withdraw_zed     numeric(18,2)  NOT NULL DEFAULT 100000 CHECK (max_withdraw_zed >= min_withdraw_zed),
  min_level            int            NOT NULL DEFAULT 1 CHECK (min_level >= 1),
  updated_at           timestamptz    NOT NULL DEFAULT now(),
  updated_by           uuid           REFERENCES public.users(id) ON DELETE SET NULL
);

-- Seed initial row if not present
INSERT INTO public.zed_settings (id, token_price_ngn, withdrawals_enabled, min_withdraw_zed, max_withdraw_zed, min_level)
VALUES (1, 0, false, 1000, 100000, 1)
ON CONFLICT (id) DO NOTHING;

-- ── 2. zed_price_history (Append-only price audit log) ───────────────────────

CREATE TABLE IF NOT EXISTS public.zed_price_history (
  id           bigint         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  price_ngn    numeric(18,4)  NOT NULL CHECK (price_ngn >= 0),
  set_by       uuid           REFERENCES public.users(id) ON DELETE SET NULL,
  set_at       timestamptz    NOT NULL DEFAULT now()
);

-- ── 3. withdrawal_requests ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid           NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  amount_zed           numeric(18,2)  NOT NULL CHECK (amount_zed > 0),
  price_ngn_snapshot   numeric(18,4)  NOT NULL CHECK (price_ngn_snapshot > 0),
  amount_ngn           numeric(18,2)  NOT NULL CHECK (amount_ngn >= 0),
  bank_name            text           NOT NULL,
  account_number       text           NOT NULL CHECK (account_number ~ '^[0-9]{10}$'),
  account_name         text           NOT NULL,
  status               text           NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  reject_reason        text,
  admin_note           text,
  created_at           timestamptz    NOT NULL DEFAULT now(),
  reviewed_at          timestamptz,
  reviewed_by          uuid           REFERENCES public.users(id) ON DELETE SET NULL
);

-- Ensure foreign key constraints for audit safety if tables already existed
DO $$
BEGIN
  -- withdrawal_requests.user_id: ON DELETE RESTRICT
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'withdrawal_requests_user_id_fkey'
      AND table_name = 'withdrawal_requests'
  ) THEN
    ALTER TABLE public.withdrawal_requests
      DROP CONSTRAINT withdrawal_requests_user_id_fkey,
      ADD CONSTRAINT withdrawal_requests_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
  END IF;

  -- zed_price_history.set_by: nullable with ON DELETE SET NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'zed_price_history_set_by_fkey'
      AND table_name = 'zed_price_history'
  ) THEN
    ALTER TABLE public.zed_price_history
      ALTER COLUMN set_by DROP NOT NULL;
    ALTER TABLE public.zed_price_history
      DROP CONSTRAINT zed_price_history_set_by_fkey,
      ADD CONSTRAINT zed_price_history_set_by_fkey
        FOREIGN KEY (set_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS zed_price_history_set_at_idx
  ON public.zed_price_history (set_at DESC);

CREATE INDEX IF NOT EXISTS withdrawal_requests_user_created_idx
  ON public.withdrawal_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS withdrawal_requests_status_created_idx
  ON public.withdrawal_requests (status, created_at DESC);

-- Unique index to strictly enforce only ONE pending request per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS withdrawal_requests_user_pending_unique
  ON public.withdrawal_requests (user_id)
  WHERE status = 'pending';

-- ── 5. Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE public.zed_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zed_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- zed_settings: authenticated users can read settings
DROP POLICY IF EXISTS "zed_settings: authenticated select" ON public.zed_settings;
CREATE POLICY "zed_settings: authenticated select"
  ON public.zed_settings FOR SELECT
  TO authenticated
  USING (true);

-- zed_price_history: admins can select all price history
DROP POLICY IF EXISTS "zed_price_history: admin select all" ON public.zed_price_history;
CREATE POLICY "zed_price_history: admin select all"
  ON public.zed_price_history FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- withdrawal_requests: user select own
DROP POLICY IF EXISTS "withdrawal_requests: user select own" ON public.withdrawal_requests;
CREATE POLICY "withdrawal_requests: user select own"
  ON public.withdrawal_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- withdrawal_requests: admin select all
DROP POLICY IF EXISTS "withdrawal_requests: admin select all" ON public.withdrawal_requests;
CREATE POLICY "withdrawal_requests: admin select all"
  ON public.withdrawal_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Revoke ALL table permissions from anon
REVOKE ALL ON public.zed_settings, public.zed_price_history, public.withdrawal_requests FROM anon;

-- Keep SELECT grants on tables for authenticated (filtered by RLS)
GRANT SELECT ON public.zed_settings, public.zed_price_history, public.withdrawal_requests TO authenticated;

-- Revoke direct writes for client roles (all modifications happen via RPC)
REVOKE INSERT, UPDATE, DELETE ON public.zed_settings, public.zed_price_history, public.withdrawal_requests FROM authenticated, PUBLIC;

-- ── 6. Function: request_withdrawal() ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_bank_name text,
  p_account_number text,
  p_account_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id            uuid;
  v_is_verified        boolean;
  v_user_level         smallint;
  v_settings           record;
  v_wallet             record;
  v_amount_zed         numeric(18,2);
  v_amount_ngn         numeric(18,2);
  v_new_balance        numeric(12,2);
  v_request_id         uuid;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify user profile and verification status
  SELECT is_verified, level_id
  INTO   v_is_verified, v_user_level
  FROM   public.users
  WHERE  id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'User is not verified. Account must be verified to withdraw $ZED.';
  END IF;

  -- 3. Validate inputs
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal amount';
  END IF;

  v_amount_zed := ROUND(p_amount, 2);

  IF p_bank_name IS NULL OR length(trim(p_bank_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid bank name';
  END IF;

  IF p_account_number IS NULL OR NOT (p_account_number ~ '^[0-9]{10}$') THEN
    RAISE EXCEPTION 'Account number must be exactly 10 digits';
  END IF;

  IF p_account_name IS NULL OR length(trim(p_account_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid account name';
  END IF;

  -- 4. Check global withdrawal settings
  SELECT *
  INTO   v_settings
  FROM   public.zed_settings
  WHERE  id = 1;

  IF NOT FOUND OR v_settings.withdrawals_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'Withdrawals are currently disabled';
  END IF;

  IF v_settings.token_price_ngn <= 0 THEN
    RAISE EXCEPTION 'Token price is not set';
  END IF;

  IF COALESCE(v_user_level, 1) < v_settings.min_level THEN
    RAISE EXCEPTION 'Minimum level % required to withdraw', v_settings.min_level;
  END IF;

  IF v_amount_zed < v_settings.min_withdraw_zed THEN
    RAISE EXCEPTION 'Minimum withdrawal is % ZED', v_settings.min_withdraw_zed;
  END IF;

  IF v_amount_zed > v_settings.max_withdraw_zed THEN
    RAISE EXCEPTION 'Maximum withdrawal is % ZED', v_settings.max_withdraw_zed;
  END IF;

  -- 5. Lock wallet and verify balance (serialises concurrent calls for this user)
  SELECT *
  INTO   v_wallet
  FROM   public.token_wallets
  WHERE  user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet.balance_zed < v_amount_zed THEN
    RAISE EXCEPTION 'Insufficient ZED balance';
  END IF;

  -- 6. Only one pending request per user (checked after acquiring wallet lock)
  IF EXISTS (
    SELECT 1 FROM public.withdrawal_requests
    WHERE user_id = v_user_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending withdrawal request';
  END IF;

  -- 7. Deduct balance (hold funds)
  v_new_balance := v_wallet.balance_zed - v_amount_zed;

  UPDATE public.token_wallets
  SET balance_zed = v_new_balance,
      updated_at  = now()
  WHERE user_id = v_user_id;

  -- 8. Calculate naira snapshot amount
  v_amount_ngn := ROUND(v_amount_zed * v_settings.token_price_ngn, 2);

  -- 9. Insert withdrawal request (wrapped to catch unique_violation from partial unique index)
  BEGIN
    INSERT INTO public.withdrawal_requests (
      user_id,
      amount_zed,
      price_ngn_snapshot,
      amount_ngn,
      bank_name,
      account_number,
      account_name,
      status
    )
    VALUES (
      v_user_id,
      v_amount_zed,
      v_settings.token_price_ngn,
      v_amount_ngn,
      trim(p_bank_name),
      p_account_number,
      trim(p_account_name),
      'pending'
    )
    RETURNING id INTO v_request_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'You already have a pending withdrawal request';
  END;

  -- 10. Return result
  RETURN jsonb_build_object(
    'ok',                  true,
    'request_id',          v_request_id,
    'new_balance',         v_new_balance,
    'amount_zed',          v_amount_zed,
    'amount_ngn',          v_amount_ngn,
    'price_ngn_snapshot',  v_settings.token_price_ngn
  );
END;
$$;

-- ── 7. Function: cancel_withdrawal() ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_withdrawal(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid;
  v_req         record;
  v_new_balance numeric(12,2);
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Lock request and verify ownership
  SELECT *
  INTO   v_req
  FROM   public.withdrawal_requests
  WHERE  id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_req.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending withdrawal requests can be cancelled';
  END IF;

  -- 3. Lock wallet and refund ZED balance
  UPDATE public.token_wallets
  SET balance_zed = balance_zed + v_req.amount_zed,
      updated_at  = now()
  WHERE user_id = v_user_id
  RETURNING balance_zed INTO v_new_balance;

  -- 4. Mark request cancelled
  UPDATE public.withdrawal_requests
  SET status      = 'cancelled',
      reviewed_at = now()
  WHERE id = p_id;

  RETURN jsonb_build_object(
    'ok',          true,
    'request_id',  p_id,
    'new_balance', v_new_balance,
    'status',      'cancelled'
  );
END;
$$;

-- ── 8. Function: admin_review_withdrawal() ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_review_withdrawal(
  p_id uuid,
  p_decision text,
  p_note text DEFAULT NULL,
  p_reject_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id     uuid;
  v_req          record;
  v_new_balance  numeric(12,2) := NULL;
BEGIN
  -- 1. Admin check
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- 2. Validate decision
  IF p_decision IS NULL OR p_decision NOT IN ('approved', 'rejected', 'paid') THEN
    RAISE EXCEPTION 'Invalid decision. Must be approved, rejected, or paid.';
  END IF;

  -- If rejected, require a non-empty reject reason (min 3 chars)
  IF p_decision = 'rejected' AND (p_reject_reason IS NULL OR length(trim(p_reject_reason)) < 3) THEN
    RAISE EXCEPTION 'A rejection reason of at least 3 characters is required';
  END IF;

  -- 3. Lock request
  SELECT *
  INTO   v_req
  FROM   public.withdrawal_requests
  WHERE  id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  -- Self-approval guard: admins cannot review their own requests
  IF v_req.user_id = v_admin_id THEN
    RAISE EXCEPTION 'Admins cannot review their own withdrawal request';
  END IF;

  -- 4. Validate transition
  -- Allowed:
  --   pending  -> approved | rejected
  --   approved -> paid | rejected
  IF v_req.status = 'pending' AND p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Pending requests can only be approved or rejected';
  END IF;

  IF v_req.status = 'approved' AND p_decision NOT IN ('paid', 'rejected') THEN
    RAISE EXCEPTION 'Approved requests can only be marked paid or rejected';
  END IF;

  IF v_req.status IN ('rejected', 'paid', 'cancelled') THEN
    RAISE EXCEPTION 'Request is already in terminal state %', v_req.status;
  END IF;

  -- 5. If rejected, refund held ZED back to user's wallet
  IF p_decision = 'rejected' THEN
    UPDATE public.token_wallets
    SET balance_zed = balance_zed + v_req.amount_zed,
        updated_at  = now()
    WHERE user_id = v_req.user_id
    RETURNING balance_zed INTO v_new_balance;
  END IF;

  -- 6. Update request status
  UPDATE public.withdrawal_requests
  SET status        = p_decision,
      admin_note    = COALESCE(p_note, admin_note),
      reject_reason = CASE WHEN p_decision = 'rejected' THEN trim(p_reject_reason) ELSE reject_reason END,
      reviewed_at   = now(),
      reviewed_by   = v_admin_id
  WHERE id = p_id;

  -- 7. Write to admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'withdrawal_review',
    'withdrawal_request',
    p_id::text,
    jsonb_build_object(
      'previous_status', v_req.status,
      'new_status',      p_decision,
      'amount_zed',      v_req.amount_zed,
      'amount_ngn',      v_req.amount_ngn,
      'user_id',         v_req.user_id,
      'admin_note',      p_note,
      'reject_reason',   p_reject_reason
    )
  );

  RETURN jsonb_build_object(
    'ok',          true,
    'request_id',  p_id,
    'status',      p_decision,
    'new_balance', v_new_balance
  );
END;
$$;

-- ── 9. Function: admin_update_zed_settings() ────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_zed_settings(
  p_token_price_ngn numeric,
  p_withdrawals_enabled boolean,
  p_min_withdraw_zed numeric,
  p_max_withdraw_zed numeric,
  p_min_level int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id    uuid;
  v_prev_price  numeric(18,4);
BEGIN
  -- 1. Admin check
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- 2. Validate bounds
  IF p_token_price_ngn < 0 THEN
    RAISE EXCEPTION 'Token price cannot be negative';
  END IF;

  IF p_min_withdraw_zed < 0 THEN
    RAISE EXCEPTION 'Minimum withdrawal cannot be negative';
  END IF;

  IF p_max_withdraw_zed < p_min_withdraw_zed THEN
    RAISE EXCEPTION 'Maximum withdrawal must be greater than or equal to minimum withdrawal';
  END IF;

  IF p_min_level < 1 THEN
    RAISE EXCEPTION 'Minimum level must be at least 1';
  END IF;

  -- 3. Get previous price
  SELECT token_price_ngn
  INTO   v_prev_price
  FROM   public.zed_settings
  WHERE  id = 1;

  -- 4. Update settings
  UPDATE public.zed_settings
  SET token_price_ngn     = ROUND(p_token_price_ngn, 4),
      withdrawals_enabled = p_withdrawals_enabled,
      min_withdraw_zed    = ROUND(p_min_withdraw_zed, 2),
      max_withdraw_zed    = ROUND(p_max_withdraw_zed, 2),
      min_level           = p_min_level,
      updated_at          = now(),
      updated_by          = v_admin_id
  WHERE id = 1;

  -- 5. Append to price history if price changed
  IF v_prev_price IS DISTINCT FROM ROUND(p_token_price_ngn, 4) THEN
    INSERT INTO public.zed_price_history (price_ngn, set_by, set_at)
    VALUES (ROUND(p_token_price_ngn, 4), v_admin_id, now());
  END IF;

  -- 6. Log to admin_audit_log
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'zed_settings_update',
    'zed_settings',
    '1',
    jsonb_build_object(
      'token_price_ngn',     ROUND(p_token_price_ngn, 4),
      'withdrawals_enabled', p_withdrawals_enabled,
      'min_withdraw_zed',    ROUND(p_min_withdraw_zed, 2),
      'max_withdraw_zed',    ROUND(p_max_withdraw_zed, 2),
      'min_level',           p_min_level
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ── 10. Permissions ─────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_withdrawal(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancel_withdrawal(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_review_withdrawal(uuid, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_review_withdrawal(uuid, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_zed_settings(numeric, boolean, numeric, numeric, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_update_zed_settings(numeric, boolean, numeric, numeric, int) TO authenticated;
