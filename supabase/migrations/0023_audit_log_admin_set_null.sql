-- Migration: 0023_audit_log_admin_set_null.sql
-- Description: Make admin_audit_log.admin_id nullable and set foreign key to ON DELETE SET NULL.
-- Preserves immutable administrative audit records even if an admin user is removed.

BEGIN;

-- 1. Make admin_id column nullable
ALTER TABLE public.admin_audit_log
  ALTER COLUMN admin_id DROP NOT NULL;

-- 2. Dynamically find and drop any foreign key on admin_audit_log.admin_id referencing public.users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    JOIN pg_class frel ON frel.oid = con.confrelid
    JOIN pg_namespace fnsp ON fnsp.oid = frel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'admin_audit_log'
      AND con.contype = 'f'
      AND att.attname = 'admin_id'
      AND fnsp.nspname = 'public'
      AND frel.relname = 'users'
  ) LOOP
    EXECUTE format('ALTER TABLE public.admin_audit_log DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 3. Re-add foreign key with ON DELETE SET NULL
ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_admin_id_fkey
  FOREIGN KEY (admin_id)
  REFERENCES public.users (id)
  ON DELETE SET NULL;

COMMIT;

