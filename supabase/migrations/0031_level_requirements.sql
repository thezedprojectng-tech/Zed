-- Migration: 0031_level_requirements.sql
-- Description: Admin-configurable level rules with automatic promotion.
-- DRAFT ONLY. No SQL executed yet. 0030_admin_set_user_level is parked and not to be run.

BEGIN;

-- ── 1. Table public.level_requirements ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.level_requirements (
  id                bigint         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  level_id          smallint       NOT NULL CHECK (level_id BETWEEN 2 AND 5),
  requirement_type  text           NOT NULL CHECK (requirement_type IN (
                                     'total_mined',
                                     'mining_days',
                                     'verified_referrals',
                                     'completed_courses'
                                   )),
  threshold         numeric(12,2)  NOT NULL DEFAULT 0 CHECK (threshold >= 0 AND threshold <= 1000000000),
  created_at        timestamptz    NOT NULL DEFAULT now(),
  updated_at        timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT level_requirements_level_type_unique UNIQUE (level_id, requirement_type)
);

CREATE INDEX IF NOT EXISTS level_requirements_level_idx
  ON public.level_requirements (level_id);

-- Automatic updated_at trigger using existing handle_updated_at() from 0001_init.sql
DROP TRIGGER IF EXISTS level_requirements_updated_at ON public.level_requirements;
CREATE TRIGGER level_requirements_updated_at
  BEFORE UPDATE ON public.level_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ── 2. Row Level Security – level_requirements ───────────────────────────────

ALTER TABLE public.level_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "level_requirements: authenticated select" ON public.level_requirements;
CREATE POLICY "level_requirements: authenticated select"
  ON public.level_requirements FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON public.level_requirements FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.level_requirements TO authenticated;

-- ── 3. Internal: compute_user_target_level(p_user_id uuid) ───────────────────
-- Pure evaluation function that calculates what level a user qualifies for.
-- Does NOT update public.users. Reusable by dry-run previews and recalculate_user_level.

CREATE OR REPLACE FUNCTION public.compute_user_target_level(p_user_id uuid)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_level       smallint;
  v_candidate_level     smallint;
  v_target_level        smallint;
  v_rule_count          int;
  v_all_met             boolean;
  r                     record;
  v_total_mined         numeric(12,2);
  v_mining_days         bigint;
  v_verified_referrals  bigint;
  v_completed_courses   bigint;
BEGIN
  SELECT level_id INTO v_current_level
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND OR v_current_level IS NULL THEN
    RETURN 1;
  END IF;

  v_candidate_level := v_current_level;

  -- Evaluate subsequent levels in strict ascending order up to 5
  FOR v_target_level IN (v_current_level + 1)..5 LOOP
    -- Count rules configured for this target level
    SELECT COUNT(*) INTO v_rule_count
    FROM public.level_requirements
    WHERE level_id = v_target_level;

    -- A level with ZERO rules is LOCKED: nobody can auto-reach it.
    IF v_rule_count = 0 THEN
      EXIT;
    END IF;

    v_all_met := true;

    FOR r IN
      SELECT requirement_type, threshold
      FROM public.level_requirements
      WHERE level_id = v_target_level
    LOOP
      IF r.requirement_type = 'total_mined' THEN
        IF v_total_mined IS NULL THEN
          SELECT COALESCE(total_mined, 0) INTO v_total_mined
          FROM public.token_wallets
          WHERE user_id = p_user_id;
          v_total_mined := COALESCE(v_total_mined, 0);
        END IF;
        IF v_total_mined < r.threshold THEN
          v_all_met := false;
          EXIT;
        END IF;

      ELSIF r.requirement_type = 'mining_days' THEN
        IF v_mining_days IS NULL THEN
          SELECT COUNT(*) INTO v_mining_days
          FROM public.mining_logs
          WHERE user_id = p_user_id;
        END IF;
        IF v_mining_days < r.threshold THEN
          v_all_met := false;
          EXIT;
        END IF;

      ELSIF r.requirement_type = 'verified_referrals' THEN
        -- Lazy evaluation: only runs if a verified_referrals rule is active
        IF v_verified_referrals IS NULL THEN
          SELECT COUNT(*) INTO v_verified_referrals
          FROM public.referrals ref
          JOIN public.users u ON u.id = ref.referred_id
          WHERE ref.referrer_id = p_user_id
            AND u.is_verified = true;
        END IF;
        IF v_verified_referrals < r.threshold THEN
          v_all_met := false;
          EXIT;
        END IF;

      ELSIF r.requirement_type = 'completed_courses' THEN
        -- Lazy evaluation: only runs if a completed_courses rule is active
        IF v_completed_courses IS NULL THEN
          SELECT COUNT(*)::bigint INTO v_completed_courses
          FROM public.skill_tracks t
          WHERE t.is_published = true
            AND EXISTS (
              SELECT 1 FROM public.skill_lessons l WHERE l.track_id = t.id
            )
            AND NOT EXISTS (
              SELECT 1
              FROM public.skill_lessons l
              WHERE l.track_id = t.id
                AND NOT EXISTS (
                  SELECT 1
                  FROM public.skill_progress p
                  WHERE p.lesson_id = l.id
                    AND p.user_id = p_user_id
                )
            );
        END IF;
        IF v_completed_courses < r.threshold THEN
          v_all_met := false;
          EXIT;
        END IF;
      END IF;
    END LOOP;

    IF v_all_met THEN
      v_candidate_level := v_target_level;
    ELSE
      -- Stop at first unmet level; cannot skip past a locked or unmet level
      EXIT;
    END IF;
  END LOOP;

  RETURN v_candidate_level;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_user_target_level(uuid) FROM PUBLIC, anon, authenticated;

-- ── 4. Internal: recalculate_user_level(p_user_id uuid) ──────────────────────
-- Evaluates target level and applies promotion if target > current.
-- Users are NEVER demoted (WHERE level_id < candidate).

CREATE OR REPLACE FUNCTION public.recalculate_user_level(p_user_id uuid)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_level  smallint;
  v_target_level   smallint;
BEGIN
  SELECT level_id INTO v_current_level
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_current_level IS NULL THEN
    RETURN 1;
  END IF;

  v_target_level := public.compute_user_target_level(p_user_id);

  IF v_target_level > v_current_level THEN
    UPDATE public.users
    SET level_id = v_target_level
    WHERE id = p_user_id
      AND level_id < v_target_level;

    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    )
    VALUES (
      NULL,
      'user.auto_level_up',
      'user',
      p_user_id::text,
      jsonb_build_object(
        'from_level', v_current_level,
        'to_level', v_target_level
      )
    );

    RETURN v_target_level;
  END IF;

  RETURN v_current_level;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_user_level(uuid) FROM PUBLIC, anon, authenticated;

-- ── 5. Admin RPC: admin_save_level_requirements(p_rules jsonb) ───────────────

CREATE OR REPLACE FUNCTION public.admin_save_level_requirements(p_rules jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id  uuid;
  v_rule      jsonb;
  v_level_id  int;
  v_type      text;
  v_thresh    numeric;
  v_seen      text[];
  v_key       text;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_rules IS NULL OR jsonb_typeof(p_rules) <> 'array' THEN
    RAISE EXCEPTION 'Rules must be a JSON array';
  END IF;

  IF jsonb_array_length(p_rules) > 20 THEN
    RAISE EXCEPTION 'Too many rules (maximum 20)';
  END IF;

  v_seen := ARRAY[]::text[];

  FOR v_rule IN SELECT * FROM jsonb_array_elements(p_rules)
  LOOP
    IF jsonb_typeof(v_rule) <> 'object' THEN
      RAISE EXCEPTION 'Each rule must be a JSON object';
    END IF;

    v_level_id := (v_rule->>'level_id')::int;
    v_type     := v_rule->>'requirement_type';
    v_thresh   := (v_rule->>'threshold')::numeric;

    IF v_level_id IS NULL OR v_level_id < 2 OR v_level_id > 5 THEN
      RAISE EXCEPTION 'Invalid level_id (must be between 2 and 5)';
    END IF;

    IF v_type IS NULL OR v_type NOT IN ('total_mined', 'mining_days', 'verified_referrals', 'completed_courses') THEN
      RAISE EXCEPTION 'Invalid requirement_type: %', v_type;
    END IF;

    IF v_thresh IS NULL OR v_thresh < 0 OR v_thresh > 1000000000 THEN
      RAISE EXCEPTION 'Invalid threshold for % (must be between 0 and 1,000,000,000)', v_type;
    END IF;

    IF v_type IN ('mining_days', 'verified_referrals', 'completed_courses') AND v_thresh <> trunc(v_thresh) THEN
      RAISE EXCEPTION 'Threshold for % must be an integer', v_type;
    END IF;

    v_key := v_level_id::text || ':' || v_type;
    IF v_key = ANY(v_seen) THEN
      RAISE EXCEPTION 'Duplicate rule for level % and requirement %', v_level_id, v_type;
    END IF;
    v_seen := array_append(v_seen, v_key);
  END LOOP;

  -- Single atomic replacement transaction
  DELETE FROM public.level_requirements WHERE true;

  IF jsonb_array_length(p_rules) > 0 THEN
    INSERT INTO public.level_requirements (level_id, requirement_type, threshold)
    SELECT
      (elem->>'level_id')::smallint,
      elem->>'requirement_type',
      ROUND((elem->>'threshold')::numeric, 2)
    FROM jsonb_array_elements(p_rules) AS elem;
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    v_admin_id,
    'level_requirements_update',
    'level_requirements',
    'all',
    jsonb_build_object('rules', p_rules)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_level_requirements(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_level_requirements(jsonb) TO authenticated;

-- ── 6. Admin RPC: admin_recalculate_user_levels(p_dry_run boolean) ───────────

CREATE OR REPLACE FUNCTION public.admin_recalculate_user_levels(p_dry_run boolean DEFAULT true)
RETURNS TABLE (to_level smallint, user_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id        uuid;
  r                 record;
  v_target_level    smallint;
  v_promoted_total  int := 0;
  v_counts          jsonb := '{}'::jsonb;
  v_lvl_key         text;
  v_prev_cnt        int;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  CREATE TEMPORARY TABLE temp_promotion_results (
    user_id uuid,
    from_level smallint,
    target_level smallint
  ) ON COMMIT DROP;

  FOR r IN SELECT id, level_id FROM public.users
  LOOP
    v_target_level := public.compute_user_target_level(r.id);
    IF v_target_level > r.level_id THEN
      INSERT INTO temp_promotion_results (user_id, from_level, target_level)
      VALUES (r.id, r.level_id, v_target_level);

      v_lvl_key := v_target_level::text;
      v_prev_cnt := COALESCE((v_counts->>v_lvl_key)::int, 0);
      v_counts := jsonb_set(v_counts, ARRAY[v_lvl_key], to_jsonb(v_prev_cnt + 1));
      v_promoted_total := v_promoted_total + 1;
    END IF;
  END LOOP;

  IF NOT p_dry_run THEN
    FOR r IN SELECT user_id FROM temp_promotion_results
    LOOP
      PERFORM public.recalculate_user_level(r.user_id);
    END LOOP;

    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      metadata
    )
    VALUES (
      v_admin_id,
      'level_recalculate_all',
      'level_requirements',
      'all',
      jsonb_build_object(
        'promoted_total', v_promoted_total,
        'by_level', v_counts
      )
    );
  END IF;

  RETURN QUERY
  SELECT target_level AS to_level, COUNT(*)::integer AS user_count
  FROM temp_promotion_results
  GROUP BY target_level
  ORDER BY target_level;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_recalculate_user_levels(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recalculate_user_levels(boolean) TO authenticated;

-- ── 7. Hook: claim_daily_mining() ───────────────────────────────────────────
-- Latest definition: supabase/migrations/0021_referral_reward_on_first_claim.sql:9-117
-- Hook added: recalculate_user_level(v_user_id) at very end after process_referral_reward

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

  BEGIN
    PERFORM public.recalculate_user_level(v_user_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'level recalc failed: %', SQLERRM;
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

-- ── 8. Hook: complete_lesson() ──────────────────────────────────────────────
-- Latest definition: supabase/migrations/0017_optional_verification.sql:651-710
-- Hook added: recalculate_user_level(v_user_id) after successful skill_progress insert

CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id             uuid;
  v_lesson_points       int;
  v_already_completed   boolean;
  v_points_awarded      int := 0;
  v_total_skill_points  int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT l.skill_points
  INTO   v_lesson_points
  FROM   public.skill_lessons l
  JOIN   public.skill_tracks t ON t.id = l.track_id
  WHERE  l.id = p_lesson_id
    AND  t.is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.skill_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id
  ) INTO v_already_completed;

  IF NOT v_already_completed THEN
    INSERT INTO public.skill_progress (user_id, lesson_id, points_awarded, completed_at)
    VALUES (v_user_id, p_lesson_id, v_lesson_points, now())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    IF FOUND THEN
      v_points_awarded := v_lesson_points;
      BEGIN
        PERFORM public.recalculate_user_level(v_user_id);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'level recalc failed: %', SQLERRM;
      END;
    ELSE
      v_already_completed := true;
      v_points_awarded := 0;
    END IF;
  END IF;

  SELECT COALESCE(SUM(p.points_awarded), 0)::int
  INTO   v_total_skill_points
  FROM   public.skill_progress p
  WHERE  p.user_id = v_user_id;

  RETURN jsonb_build_object(
    'ok',                 true,
    'points_awarded',     v_points_awarded,
    'total_skill_points', v_total_skill_points,
    'already_completed',  v_already_completed
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_lesson(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_lesson(uuid) TO authenticated;

-- ── 9. Hook: trg_users_on_verification() ────────────────────────────────────
-- Latest definition: supabase/migrations/0009_referrals.sql:392-410
-- Hook added: recalculate referrers of NEW.id when is_verified turns true

CREATE OR REPLACE FUNCTION public.trg_users_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Trigger reward processing when is_verified transitions from false/null to true
  IF (OLD.is_verified IS NOT TRUE) AND (NEW.is_verified IS TRUE) THEN
    BEGIN
      PERFORM public.process_referral_reward(NEW.id);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'process_referral_reward failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    END;

    FOR v_referrer_id IN
      SELECT referrer_id FROM public.referrals WHERE referred_id = NEW.id
    LOOP
      BEGIN
        PERFORM public.recalculate_user_level(v_referrer_id);
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'recalculate_user_level failed for referrer %: % (SQLSTATE: %)', v_referrer_id, SQLERRM, SQLSTATE;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;

