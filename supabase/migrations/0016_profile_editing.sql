-- ─────────────────────────────────────────────────────────────────────────────
-- 0016_profile_editing.sql  (rev 2)
-- Zed Project: User Profile Editing (display name, username, avatar)
-- Idempotent. Run after 0015_careers_admin.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New columns on public.users ───────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username             TEXT,
  ADD COLUMN IF NOT EXISTS display_name         TEXT,
  ADD COLUMN IF NOT EXISTS avatar_path          TEXT,
  ADD COLUMN IF NOT EXISTS username_changed_at  TIMESTAMPTZ;

-- ── 2. Username uniqueness: case-insensitive unique index ─────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
  ON public.users (lower(username))
  WHERE username IS NOT NULL;

-- ── 3. Remove every direct-client write path on public.users ─────────────────
-- Drop both the original 0001 policy name and any legacy name that may exist.
-- Then revoke DML verbs from all roles — the SECURITY DEFINER RPC is the only
-- write path permitted from this migration forward.

DROP POLICY IF EXISTS "users: update own row"       ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

REVOKE UPDATE, INSERT, DELETE ON public.users FROM anon, authenticated, PUBLIC;

-- ── 4. Rate-limit table: max 5 profile saves per 24 hours ────────────────────

CREATE TABLE IF NOT EXISTS public.profile_save_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profile_save_log_user_saved_idx
  ON public.profile_save_log (user_id, saved_at DESC);

ALTER TABLE public.profile_save_log ENABLE ROW LEVEL SECURITY;

-- Deny all direct client access; only the SECURITY DEFINER RPC may write here.
DROP POLICY IF EXISTS "profile_save_log: deny all" ON public.profile_save_log;
CREATE POLICY "profile_save_log: deny all"
  ON public.profile_save_log
  FOR ALL
  USING (false);

REVOKE ALL ON public.profile_save_log FROM authenticated, anon;
-- The RPC runs as SECURITY DEFINER (owner), so it bypasses RLS & role grants.

-- ── 5. Reserved username helper ───────────────────────────────────────────────
-- Used both by is_reserved_username() and the inline substring check in the RPC.

CREATE OR REPLACE FUNCTION public.is_reserved_username(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT lower(p_username) = ANY(ARRAY[
    'admin', 'administrator', 'zed', 'zedproject', 'support', 'official',
    'moderator', 'staff', 'system', 'null', 'undefined', 'root', 'help',
    'zed_project', 'the_zed_project', 'thezedproject', 'contact', 'info',
    'security', 'abuse', 'noreply', 'no_reply'
  ]);
$$;

REVOKE ALL ON FUNCTION public.is_reserved_username(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_reserved_username(text) TO authenticated;

-- ── 6. get_my_profile() ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id                   UUID,
  full_name            TEXT,
  display_name         TEXT,
  username             TEXT,
  avatar_path          TEXT,
  is_verified          BOOLEAN,
  username_changed_at  TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT
      u.id,
      u.full_name,
      u.display_name,
      u.username,
      u.avatar_path,
      u.is_verified,
      u.username_changed_at,
      u.updated_at
    FROM public.users u
    WHERE u.id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- ── 7. update_my_profile() ────────────────────────────────────────────────────
-- Single SECURITY DEFINER entry point for all user-initiated profile changes.
--
-- Parameters:
--   p_display_name   TEXT    – 2-40 chars, no URLs, no @, no control chars
--   p_username       TEXT    – 3-20 chars ^[a-z][a-z0-9_]{2,19}$, not reserved,
--                              no banned substrings, 30-day cooldown
--   p_avatar_path    TEXT    – <uid>/<file>.<ext>, validated by regex
--   p_full_name      TEXT    – 2-100 chars, only when NOT is_verified
--   p_remove_avatar  BOOLEAN – when TRUE, sets avatar_path = NULL regardless of p_avatar_path
--
-- Protected columns: is_verified, role, level_id, nin_hash, balances, referral fields.
-- Rate limit: 5 saves per 24 hours.

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_display_name  TEXT    DEFAULT NULL,
  p_username      TEXT    DEFAULT NULL,
  p_avatar_path   TEXT    DEFAULT NULL,
  p_full_name     TEXT    DEFAULT NULL,
  p_remove_avatar BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid            UUID;
  v_profile        public.users%ROWTYPE;
  v_save_count     INT;
  v_now            TIMESTAMPTZ := NOW();
  v_update         JSONB       := '{}'::JSONB;
  -- Substrings that are banned from both username and display_name (case-insensitive).
  v_banned_subs    TEXT[]      := ARRAY[
    'admin', 'support', 'official', 'moderator', 'zedproject', 'zed_project'
  ];
  v_sub            TEXT;
BEGIN
  -- ── Auth ──────────────────────────────────────────────────────────────────
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- ── Load current profile ──────────────────────────────────────────────────
  SELECT * INTO v_profile FROM public.users WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  -- ── Rate limit: 5 saves per 24 h ──────────────────────────────────────────
  SELECT COUNT(*) INTO v_save_count
  FROM public.profile_save_log
  WHERE user_id = v_uid
    AND saved_at > v_now - INTERVAL '24 hours';

  IF v_save_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit: you can save your profile at most 5 times per 24 hours.'
      USING ERRCODE = 'P0003';
  END IF;

  -- ── display_name ──────────────────────────────────────────────────────────
  IF p_display_name IS NOT NULL THEN
    p_display_name := trim(p_display_name);
    IF length(p_display_name) < 2 OR length(p_display_name) > 40 THEN
      RAISE EXCEPTION 'Display name must be 2–40 characters.' USING ERRCODE = '22023';
    END IF;
    IF p_display_name ~* 'https?://' THEN
      RAISE EXCEPTION 'Display name may not contain URLs.' USING ERRCODE = '22023';
    END IF;
    IF p_display_name LIKE '%@%' THEN
      RAISE EXCEPTION 'Display name may not contain @.' USING ERRCODE = '22023';
    END IF;
    IF p_display_name ~ '[\x00-\x1F\x7F]' THEN
      RAISE EXCEPTION 'Display name contains invalid characters.' USING ERRCODE = '22023';
    END IF;
    -- Banned substrings
    FOREACH v_sub IN ARRAY v_banned_subs LOOP
      IF lower(p_display_name) LIKE '%' || v_sub || '%' THEN
        RAISE EXCEPTION 'Display name may not contain "%".', v_sub
          USING ERRCODE = '22023';
      END IF;
    END LOOP;
    v_update := v_update || jsonb_build_object('display_name', p_display_name);
  END IF;

  -- ── username ──────────────────────────────────────────────────────────────
  IF p_username IS NOT NULL THEN
    p_username := lower(trim(p_username));
    IF p_username !~ '^[a-z][a-z0-9_]{2,19}$' THEN
      RAISE EXCEPTION 'Username must be 3–20 characters, start with a letter, and use only a-z, 0-9, _.'
        USING ERRCODE = '22023';
    END IF;
    -- Exact reserved list
    IF public.is_reserved_username(p_username) IS TRUE THEN
      RAISE EXCEPTION 'That username is reserved.' USING ERRCODE = '22023';
    END IF;
    -- Banned substrings
    FOREACH v_sub IN ARRAY v_banned_subs LOOP
      IF p_username LIKE '%' || v_sub || '%' THEN
        RAISE EXCEPTION 'Username may not contain "%".', v_sub
          USING ERRCODE = '22023';
      END IF;
    END LOOP;
    -- Only enforce cooldown when username is actually changing
    IF v_profile.username IS DISTINCT FROM p_username THEN
      IF v_profile.username_changed_at IS NOT NULL
         AND v_profile.username_changed_at > v_now - INTERVAL '30 days' THEN
        RAISE EXCEPTION 'Username can only be changed once every 30 days. Next change available: %.',
          to_char(v_profile.username_changed_at + INTERVAL '30 days', 'YYYY-MM-DD')
          USING ERRCODE = 'P0004';
      END IF;
      v_update := v_update || jsonb_build_object(
        'username',            p_username,
        'username_changed_at', v_now
      );
    END IF;
  END IF;

  -- ── avatar_path / remove_avatar ───────────────────────────────────────────
  IF p_remove_avatar IS TRUE THEN
    -- Explicit avatar removal — set NULL regardless of p_avatar_path
    v_update := v_update || jsonb_build_object('avatar_path', NULL::text);
  ELSIF p_avatar_path IS NOT NULL THEN
    IF p_avatar_path !~ ('^' || v_uid::text || '/[A-Za-z0-9_\-\.]{1,100}\.(jpg|png|webp)$') THEN
      RAISE EXCEPTION 'Invalid avatar path — must be inside your own folder.'
        USING ERRCODE = '22023';
    END IF;
    v_update := v_update || jsonb_build_object('avatar_path', p_avatar_path);
  END IF;

  -- ── full_name (unverified users only) ─────────────────────────────────────
  IF p_full_name IS NOT NULL THEN
    IF v_profile.is_verified IS TRUE THEN
      RAISE EXCEPTION 'Your full name cannot be changed after NIN verification.'
        USING ERRCODE = '22023';
    END IF;
    p_full_name := trim(p_full_name);
    IF length(p_full_name) < 2 OR length(p_full_name) > 100 THEN
      RAISE EXCEPTION 'Full name must be 2–100 characters.' USING ERRCODE = '22023';
    END IF;
    IF p_full_name ~ '[\x00-\x1F\x7F]' THEN
      RAISE EXCEPTION 'Full name contains invalid characters.' USING ERRCODE = '22023';
    END IF;
    v_update := v_update || jsonb_build_object('full_name', p_full_name);
  END IF;

  -- ── Nothing changed ───────────────────────────────────────────────────────
  IF v_update = '{}'::JSONB THEN
    RETURN jsonb_build_object('ok', true, 'message', 'No changes to save.');
  END IF;

  -- ── Commit update (fully explicit — no dynamic SQL) ───────────────────────
  UPDATE public.users SET
    display_name        = COALESCE(v_update->>'display_name',                   display_name),
    username            = CASE WHEN v_update ? 'username'
                               THEN v_update->>'username'           ELSE username END,
    username_changed_at = CASE WHEN v_update ? 'username_changed_at'
                               THEN (v_update->>'username_changed_at')::TIMESTAMPTZ
                               ELSE username_changed_at END,
    avatar_path         = CASE WHEN v_update ? 'avatar_path'
                               THEN v_update->>'avatar_path'        -- NULL when remove_avatar
                               ELSE avatar_path END,
    full_name           = COALESCE(v_update->>'full_name',                      full_name),
    updated_at          = v_now
  WHERE id = v_uid;

  -- ── Record this save for rate-limiting ────────────────────────────────────
  INSERT INTO public.profile_save_log (user_id, saved_at) VALUES (v_uid, v_now);

  RETURN jsonb_build_object('ok', true, 'message', 'Profile updated.');

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'That username is already taken.' USING ERRCODE = '23505';
END;
$$;

-- Signature includes new p_remove_avatar parameter.
REVOKE ALL ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ── 8. avatar_can_upload() ────────────────────────────────────────────────────
-- SECURITY DEFINER helper called by the storage INSERT policy.
-- Counts existing objects in the caller's folder in the avatars bucket.
-- Returns TRUE only when the caller is authenticated AND has fewer than 5 objects.
-- IMPORTANT: The count query runs inside this function (SECURITY DEFINER), NOT
-- inside the policy itself. This avoids the infinite-recursion bug from 0014.

CREATE OR REPLACE FUNCTION public.avatar_can_upload()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_uid   UUID;
  v_count INT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND split_part(name, '/', 1) = v_uid::text;

  RETURN v_count < 5;
END;
$$;

REVOKE ALL ON FUNCTION public.avatar_can_upload() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.avatar_can_upload() TO authenticated;

-- ── 9. admin_clear_user_profile() ────────────────────────────────────────────
-- Admin-only RPC to clear selected profile fields on any user.
-- Writes an immutable entry to admin_audit_log.

CREATE OR REPLACE FUNCTION public.admin_clear_user_profile(
  p_user_id          UUID,
  p_clear_username   BOOLEAN DEFAULT false,
  p_clear_display_name BOOLEAN DEFAULT false,
  p_clear_avatar     BOOLEAN DEFAULT false,
  p_reason           TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cleared  JSONB := '[]'::JSONB;
  v_now      TIMESTAMPTZ := NOW();
BEGIN
  -- ── Admin guard ───────────────────────────────────────────────────────────
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Forbidden: admin access required.' USING ERRCODE = '42501';
  END IF;

  -- ── Validate reason ───────────────────────────────────────────────────────
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'A reason of at least 3 characters is required.' USING ERRCODE = '22023';
  END IF;

  -- ── Verify target user exists ─────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found.' USING ERRCODE = 'P0002';
  END IF;

  -- ── Apply cleared fields ──────────────────────────────────────────────────
  IF p_clear_username IS TRUE THEN
    UPDATE public.users SET username = NULL, username_changed_at = NULL, updated_at = v_now
    WHERE id = p_user_id;
    v_cleared := v_cleared || '["username"]'::JSONB;
  END IF;

  IF p_clear_display_name IS TRUE THEN
    UPDATE public.users SET display_name = NULL, updated_at = v_now
    WHERE id = p_user_id;
    v_cleared := v_cleared || '["display_name"]'::JSONB;
  END IF;

  IF p_clear_avatar IS TRUE THEN
    UPDATE public.users SET avatar_path = NULL, updated_at = v_now
    WHERE id = p_user_id;
    v_cleared := v_cleared || '["avatar_path"]'::JSONB;
  END IF;

  IF v_cleared = '[]'::JSONB THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Nothing to clear.');
  END IF;

  -- ── Write to audit log ────────────────────────────────────────────────────
  INSERT INTO public.admin_audit_log (
    admin_id, action, target_type, target_id, metadata
  ) VALUES (
    auth.uid(),
    'admin_clear_user_profile',
    'users',
    p_user_id::text,
    jsonb_build_object(
      'cleared_fields', v_cleared,
      'reason',         trim(p_reason)
    )
  );

  RETURN jsonb_build_object(
    'ok',      true,
    'cleared', v_cleared,
    'message', 'Profile fields cleared.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_clear_user_profile(UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_clear_user_profile(UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- ── 10. Private avatars storage bucket ───────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  1048576,   -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = false,
  file_size_limit    = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ── 11. Storage RLS policies for avatars bucket ───────────────────────────────
-- No policy queries storage.objects inside its own body.
-- UPDATE policy removed per review (old object is replaced via INSERT + DELETE).

DROP POLICY IF EXISTS "avatars: owner select"  ON storage.objects;
CREATE POLICY "avatars: owner select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR public.is_admin() IS TRUE
    )
  );

DROP POLICY IF EXISTS "avatars: owner insert"  ON storage.objects;
CREATE POLICY "avatars: owner insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND public.avatar_can_upload()
  );

-- UPDATE policy intentionally omitted (use DELETE + INSERT to replace avatars).

DROP POLICY IF EXISTS "avatars: owner update"  ON storage.objects;  -- drop if previously created

DROP POLICY IF EXISTS "avatars: owner delete"  ON storage.objects;
CREATE POLICY "avatars: owner delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- End of 0016_profile_editing.sql (rev 2)
-- ─────────────────────────────────────────────────────────────────────────────
