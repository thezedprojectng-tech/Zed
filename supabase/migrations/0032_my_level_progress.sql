-- supabase/migrations/0032_my_level_progress.sql
-- DRAFT — no SQL executed against any database.
-- 0030_admin_set_user_level.sql is PARKED and must never be run or referenced.
-- Metric queries in get_my_level_progress intentionally mirror
-- compute_user_target_level in 0031_level_requirements.sql.
-- If you update one, update the other.

BEGIN;

-- ─── get_my_level_progress ───────────────────────────────────────────────────
-- Returns the signed-in user's current level, the next level (if any),
-- whether the next level has admin-configured requirements, and per-requirement
-- progress so the UI can render real progress bars.
--
-- Returns jsonb shaped like:
--   { current_level: 1-5,
--     next_level: 2-5 | null,
--     next_open: bool,
--     requirements: [{ type, threshold, current, met }] }
--
-- Only the metrics actually needed for the next level are computed (lazy).
-- STABLE because it only reads data. SECURITY DEFINER to read level_requirements
-- without exposing direct table access to authenticated users beyond SELECT RLS.
CREATE OR REPLACE FUNCTION public.get_my_level_progress()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid            uuid;
  v_current_level  smallint;
  v_next_level     smallint;
  v_needs          text[];   -- which metric types are needed
  v_total_mined    numeric  := 0;
  v_mining_days    bigint   := 0;
  v_verified_refs  bigint   := 0;
  v_completed_crs  bigint   := 0;
  v_result_reqs    jsonb    := '[]'::jsonb;
  v_req_row        RECORD;
  v_current_val    numeric;
BEGIN
  -- Auth guard
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Read current level
  SELECT COALESCE(level_id, 1)::smallint
    INTO v_current_level
    FROM public.users
   WHERE id = v_uid;

  -- Level 5 is the top level — nothing to show
  IF v_current_level = 5 THEN
    RETURN jsonb_build_object(
      'current_level', v_current_level,
      'next_level',    NULL,
      'next_open',     false,
      'requirements',  '[]'::jsonb
    );
  END IF;

  v_next_level := v_current_level + 1;

  -- Check whether the next level has any configured requirements
  IF NOT EXISTS (
    SELECT 1 FROM public.level_requirements
     WHERE level_id = v_next_level
  ) THEN
    RETURN jsonb_build_object(
      'current_level', v_current_level,
      'next_level',    v_next_level,
      'next_open',     false,
      'requirements',  '[]'::jsonb
    );
  END IF;

  -- Collect which metric types are needed for this next level
  SELECT array_agg(DISTINCT requirement_type ORDER BY requirement_type)
    INTO v_needs
    FROM public.level_requirements
   WHERE level_id = v_next_level;

  -- Lazily compute only the needed metrics
  -- (mirrors compute_user_target_level in 0031 — keep in sync)
    IF 'total_mined' = ANY(v_needs) THEN
    SELECT COALESCE(total_mined, 0)
      INTO v_total_mined
      FROM public.token_wallets
     WHERE user_id = v_uid;
    v_total_mined := COALESCE(v_total_mined, 0);
  END IF;

  IF 'mining_days' = ANY(v_needs) THEN
    SELECT COUNT(*)
      INTO v_mining_days
      FROM public.mining_logs
     WHERE user_id = v_uid;
  END IF;

  IF 'verified_referrals' = ANY(v_needs) THEN
    SELECT COUNT(*)
      INTO v_verified_refs
      FROM public.referrals r
      JOIN public.users u ON u.id = r.referred_id
     WHERE r.referrer_id = v_uid
       AND u.is_verified = true;
  END IF;

  IF 'completed_courses' = ANY(v_needs) THEN
    -- A "completed course" = a published track with >= 1 lesson
    -- where every lesson has a skill_progress row for this user.
    SELECT COUNT(*)
      INTO v_completed_crs
      FROM public.skill_tracks st
     WHERE st.is_published = true
       AND EXISTS (
           SELECT 1 FROM public.skill_lessons sl
            WHERE sl.track_id = st.id
       )
       AND NOT EXISTS (
           SELECT 1 FROM public.skill_lessons sl2
            WHERE sl2.track_id = st.id
              AND NOT EXISTS (
                SELECT 1 FROM public.skill_progress sp
                 WHERE sp.lesson_id = sl2.id
                   AND sp.user_id = v_uid
              )
       );
  END IF;

  -- Build per-requirement result array
  FOR v_req_row IN
    SELECT requirement_type, threshold
      FROM public.level_requirements
     WHERE level_id = v_next_level
     ORDER BY requirement_type
  LOOP
    v_current_val := CASE v_req_row.requirement_type
      WHEN 'total_mined'        THEN v_total_mined
      WHEN 'mining_days'        THEN v_mining_days::numeric
      WHEN 'verified_referrals' THEN v_verified_refs::numeric
      WHEN 'completed_courses'  THEN v_completed_crs::numeric
      ELSE 0
    END;

    v_result_reqs := v_result_reqs || jsonb_build_object(
      'type',      v_req_row.requirement_type,
      'threshold', v_req_row.threshold,
      'current',   v_current_val,
      'met',       (v_current_val >= v_req_row.threshold)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'current_level', v_current_level,
    'next_level',    v_next_level,
    'next_open',     true,
    'requirements',  v_result_reqs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_level_progress() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_level_progress() TO authenticated;

COMMIT;

