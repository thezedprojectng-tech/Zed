-- 0036_reset_verification.sql
-- DRAFT ONLY. Resets legacy (demo-mode NIN) verification. One-time; guarded against re-runs.

BEGIN;

CREATE TABLE IF NOT EXISTS public.verification_reset_log (
  user_id   UUID PRIMARY KEY,
  reset_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.verification_reset_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.verification_reset_log FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.verification_reset_log) THEN
    RAISE EXCEPTION '0036 already applied: verification_reset_log is not empty';
  END IF;
END $$;

-- Snapshot verified users, except anyone already approved through bank verification
INSERT INTO public.verification_reset_log (user_id)
SELECT u.id
FROM public.users u
WHERE u.is_verified IS TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.bank_verifications b
    WHERE b.user_id = u.id AND b.status = 'approved'
  );

-- Reset only the snapshot
UPDATE public.users
SET is_verified = false
WHERE id IN (SELECT user_id FROM public.verification_reset_log);

-- Clear legacy NIN hashes (column is dropped in a later migration)
UPDATE public.users
SET nin_hash = NULL
WHERE nin_hash IS NOT NULL;

INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
VALUES (
  NULL,
  'verification_reset',
  'users',
  'all',
  jsonb_build_object('count', (SELECT count(*) FROM public.verification_reset_log))
);

COMMIT;

-- ROLLBACK (reference only; nin_hash values are not restorable, intentionally):
-- UPDATE public.users SET is_verified = true
-- WHERE id IN (SELECT user_id FROM public.verification_reset_log);
