-- ─── 0014_market_storage_policy_fix.sql ─────────────────────────────────────
-- Fix for market-images storage insert policy infinite recursion.
-- Replaces inline storage.objects query with a SECURITY DEFINER helper function.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Helper Function: market_can_upload_image ──────────────────────────────
-- Evaluates whether the authenticated caller is verified and has fewer than
-- 40 stored objects in their market-images folder. Running as SECURITY DEFINER
-- avoids infinite RLS recursion when checking storage.objects during INSERT.

CREATE OR REPLACE FUNCTION public.market_can_upload_image()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
DECLARE
  v_caller_id   uuid;
  v_is_verified boolean;
  v_count       integer;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN false;
  END IF;

  -- Caller must be verified
  SELECT is_verified INTO v_is_verified
  FROM public.users
  WHERE id = v_caller_id;

  IF v_is_verified IS NOT TRUE THEN
    RETURN false;
  END IF;

  -- Caller must have fewer than 40 objects in their market-images folder
  SELECT count(*) INTO v_count
  FROM storage.objects
  WHERE bucket_id = 'market-images'
    AND split_part(name, '/', 1) = v_caller_id::text;

  RETURN v_count < 40;
END;
$$;

-- ── 2. Function Grants ───────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.market_can_upload_image() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.market_can_upload_image() TO authenticated;

-- ── 3. Replace Storage INSERT Policy ─────────────────────────────────────────

DROP POLICY IF EXISTS "market-images: authenticated user insert" ON storage.objects;
CREATE POLICY "market-images: authenticated user insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'market-images'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND public.market_can_upload_image() IS TRUE
  );
