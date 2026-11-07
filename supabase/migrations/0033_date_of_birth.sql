-- 0033_date_of_birth.sql  (ADDITIVE: safe to run BEFORE the code deploy)
-- Adds the column, the age helpers and the one-time DOB RPC for existing users.
-- Does NOT change signup behaviour (that is 0034, run AFTER the code deploy).
-- 0030_admin_set_user_level.sql is PARKED and must never be run.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_of_birth date;

CREATE OR REPLACE FUNCTION public.zed_min_age()
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 16; $$;

REVOKE ALL ON FUNCTION public.zed_min_age() FROM PUBLIC, anon, authenticated;

-- NULL = valid, 'invalid' or 'underage' otherwise. Dates are Lagos dates.
CREATE OR REPLACE FUNCTION public.is_valid_dob(p_dob date)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today date;
BEGIN
  IF p_dob IS NULL THEN
    RETURN 'invalid';
  END IF;

  v_today := (now() AT TIME ZONE 'Africa/Lagos')::date;

  IF p_dob < DATE '1900-01-01' OR p_dob > v_today THEN
    RETURN 'invalid';
  END IF;

  IF (p_dob + (public.zed_min_age() * INTERVAL '1 year'))::date > v_today THEN
    RETURN 'underage';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.is_valid_dob(date) FROM PUBLIC, anon, authenticated;

-- One-time DOB for existing users. An 'underage' result is final for the account.
CREATE OR REPLACE FUNCTION public.set_my_date_of_birth(p_dob date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid      uuid;
  v_existing date;
  v_check    text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT date_of_birth INTO v_existing
    FROM public.users
   WHERE id = v_uid
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_set');
  END IF;

  -- An earlier 'underage' result on this account is final (no retry with another date).
  IF EXISTS (
    SELECT 1 FROM public.admin_audit_log
     WHERE action = 'dob_rejected'
       AND target_id = v_uid::text
       AND metadata->>'reason' = 'underage'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'underage');
  END IF;

  v_check := public.is_valid_dob(p_dob);
  IF v_check IS NOT NULL THEN
    IF v_check = 'underage' THEN
      INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
      VALUES (NULL, 'dob_rejected', 'user', v_uid::text, jsonb_build_object('reason', 'underage'));
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', v_check);
  END IF;

  UPDATE public.users
     SET date_of_birth = p_dob
   WHERE id = v_uid
     AND date_of_birth IS NULL;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_date_of_birth(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_date_of_birth(date) TO authenticated;

COMMIT;