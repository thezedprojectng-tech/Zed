-- Migration: 0035_bank_verifications.sql
-- Description: Bank account verification with admin approval workflow.
-- DRAFT ONLY. No SQL executed yet.

BEGIN;

-- ── 1. Table public.bank_verifications ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bank_verifications (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid           NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  bank_code       text           NOT NULL,
  bank_name       text           NOT NULL,
  account_number  text           NOT NULL CHECK (account_number ~ '^[0-9]{10}$'),
  account_name    text           NOT NULL CHECK (char_length(trim(account_name)) >= 2 AND char_length(trim(account_name)) <= 100),
  status          text           NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason   text,
  reviewed_by     uuid           REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now()
);

-- Partial unique index: one bank account cannot verify two pending or approved users
CREATE UNIQUE INDEX IF NOT EXISTS bank_verifications_active_account_idx
  ON public.bank_verifications (bank_code, account_number)
  WHERE status IN ('pending', 'approved');

-- Fast queue sorting index (pending oldest first)
CREATE INDEX IF NOT EXISTS bank_verifications_status_created_idx
  ON public.bank_verifications (status, created_at ASC);

-- ── 2. Row Level Security – bank_verifications ───────────────────────────────

ALTER TABLE public.bank_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_verifications: select" ON public.bank_verifications;
CREATE POLICY "bank_verifications: select"
  ON public.bank_verifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- NO insert/update/delete policies granted to client roles
REVOKE ALL ON public.bank_verifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.bank_verifications TO authenticated;

-- ── 3. Reference Function: zed_bank_codes() ──────────────────────────────────
-- Major Nigerian commercial banks and licensed fintechs

CREATE OR REPLACE FUNCTION public.zed_bank_codes()
RETURNS TABLE (code text, name text)
LANGUAGE sql
IMMUTABLE
AS $$
  VALUES
    ('044', 'Access Bank'),
    ('058', 'Guaranty Trust Bank (GTBank)'),
    ('057', 'Zenith Bank'),
    ('033', 'United Bank for Africa (UBA)'),
    ('011', 'First Bank of Nigeria'),
    ('070', 'Fidelity Bank'),
    ('214', 'First City Monument Bank (FCMB)'),
    ('032', 'Union Bank of Nigeria'),
    ('232', 'Sterling Bank'),
    ('221', 'Stanbic IBTC Bank'),
    ('035', 'Wema Bank'),
    ('076', 'Polaris Bank'),
    ('082', 'Keystone Bank'),
    ('050', 'Ecobank Nigeria'),
    ('999992', 'OPay'),
    ('999991', 'PalmPay'),
    ('50211', 'Kuda Bank'),
    ('50515', 'Moniepoint MFB');
$$;

REVOKE ALL ON FUNCTION public.zed_bank_codes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zed_bank_codes() TO authenticated;

-- ── 4. RPC: submit_my_bank_verification() ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.submit_my_bank_verification(
  p_bank_code text,
  p_account_number text,
  p_account_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id           uuid;
  v_bank_code         text;
  v_bank_name         text;
  v_account_number    text;
  v_account_name      text;
  v_existing_id       uuid;
  v_existing_status   text;
  v_last4             text;
BEGIN
  -- 1. auth.uid() required
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  -- 2. Validate bank_code against fixed list in function
  v_bank_code := trim(COALESCE(p_bank_code, ''));
  SELECT name INTO v_bank_name
  FROM public.zed_bank_codes()
  WHERE code = v_bank_code;

  IF v_bank_name IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_bank_code');
  END IF;

  -- 3. Validate exactly 10 digits
  v_account_number := trim(COALESCE(p_account_number, ''));
  IF v_account_number !~ '^[0-9]{10}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_account_number');
  END IF;

  -- 4. Trim name and validate length (2..100)
  v_account_name := trim(COALESCE(p_account_name, ''));
  IF char_length(v_account_name) < 2 OR char_length(v_account_name) > 100 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_account_name');
  END IF;

  -- 5. Upsert check for caller: only allowed if no row or status = 'rejected'
  SELECT id, status INTO v_existing_id, v_existing_status
  FROM public.bank_verifications
  WHERE user_id = v_user_id;

  IF FOUND THEN
    IF v_existing_status = 'approved' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'already_approved');
    ELSIF v_existing_status = 'pending' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'already_pending');
    END IF;
  END IF;

  v_last4 := right(v_account_number, 4);

  -- 6. Upsert with unique violation handling for account_in_use
  BEGIN
    IF v_existing_id IS NOT NULL THEN
      UPDATE public.bank_verifications
      SET bank_code      = v_bank_code,
          bank_name      = v_bank_name,
          account_number = v_account_number,
          account_name   = v_account_name,
          status         = 'pending',
          reject_reason  = NULL,
          reviewed_by    = NULL,
          reviewed_at    = NULL,
          updated_at     = now()
      WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.bank_verifications (
        user_id,
        bank_code,
        bank_name,
        account_number,
        account_name,
        status,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        v_bank_code,
        v_bank_name,
        v_account_number,
        v_account_name,
        'pending',
        now(),
        now()
      );
    END IF;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'account_in_use');
  END;

  -- 7. Audit log action 'bank_verification_submitted' with metadata {bank_code, last4} only
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    v_user_id,
    'bank_verification_submitted',
    'bank_verifications',
    v_user_id::text,
    jsonb_build_object(
      'bank_code', v_bank_code,
      'last4', v_last4
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_my_bank_verification(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_my_bank_verification(text, text, text) TO authenticated;

-- ── 5. RPC: admin_review_bank_verification() ────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_review_bank_verification(
  p_verification_id uuid,
  p_approve boolean,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id  uuid;
  v_row       record;
  v_reason    text;
  v_last4     text;
BEGIN
  -- 1. Standard admin guard
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_verification_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_id');
  END IF;

  -- 2. Lock the row, only acts on status = 'pending'
  SELECT * INTO v_row
  FROM public.bank_verifications
  WHERE id = p_verification_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_row.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_pending');
  END IF;

  v_last4 := right(v_row.account_number, 4);

  -- 3. Handle decision
  IF p_approve IS TRUE THEN
    UPDATE public.bank_verifications
    SET status        = 'approved',
        reject_reason = NULL,
        reviewed_by   = v_admin_id,
        reviewed_at   = now(),
        updated_at    = now()
    WHERE id = p_verification_id;

    -- Set users.is_verified = true (fires public.trg_users_on_verification trigger)
    UPDATE public.users
    SET is_verified = true
    WHERE id = v_row.user_id;

    -- Audit log 'bank_verification_approved' with metadata {last4} only
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    ) VALUES (
      v_admin_id,
      'bank_verification_approved',
      'bank_verifications',
      p_verification_id::text,
      jsonb_build_object('last4', v_last4)
    );

    RETURN jsonb_build_object('ok', true, 'status', 'approved');
  ELSE
    -- Reject: reason required (5..200 chars)
    v_reason := trim(COALESCE(p_reason, ''));
    IF char_length(v_reason) < 5 OR char_length(v_reason) > 200 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'invalid_reject_reason');
    END IF;

    UPDATE public.bank_verifications
    SET status        = 'rejected',
        reject_reason = v_reason,
        reviewed_by   = v_admin_id,
        reviewed_at   = now(),
        updated_at    = now()
    WHERE id = p_verification_id;

    -- Audit log 'bank_verification_rejected' with metadata {last4} only
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    ) VALUES (
      v_admin_id,
      'bank_verification_rejected',
      'bank_verifications',
      p_verification_id::text,
      jsonb_build_object('last4', v_last4)
    );

    RETURN jsonb_build_object('ok', true, 'status', 'rejected');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_bank_verification(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_bank_verification(uuid, boolean, text) TO authenticated;

COMMIT;

/*
-- ── ROLLBACK SCRIPT (FOR REFERENCE ONLY) ──────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_review_bank_verification(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.submit_my_bank_verification(text, text, text);
DROP FUNCTION IF EXISTS public.zed_bank_codes();
DROP TABLE IF EXISTS public.bank_verifications CASCADE;
*/

