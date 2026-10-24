-- ─── 0012_admin_skill_manager.sql ───────────────────────────────────────────
-- Admin Skill Content Manager:
-- 1. Snapshot safety: add points_awarded to skill_progress and backfill so point
--    edits never alter existing users'' earned points.
-- 2. Update complete_lesson() to write & calculate points_awarded.
-- 3. Security Definer RPCs for admin track & lesson management with audit logging.
-- 4. Safety checks:
--    • No deletion of lessons that users already completed (unpublish instead).
--    • Tracks can only be published if they have >= 1 lesson and unique positions.
--    • Reorder lessons validates completeness, no duplicates, exactly track lessons.
--    • SQL-level input validations on all RPCs.

-- ── 1. Snapshot safety on skill_progress ────────────────────────────────────

ALTER TABLE public.skill_progress
  ADD COLUMN IF NOT EXISTS points_awarded int;

-- Backfill existing completion records from lesson points
UPDATE public.skill_progress p
SET points_awarded = COALESCE(l.skill_points, 0)
FROM public.skill_lessons l
WHERE p.lesson_id = l.id
  AND p.points_awarded IS NULL;

-- Fallback for any orphaned progress record
UPDATE public.skill_progress
SET points_awarded = 0
WHERE points_awarded IS NULL;

-- Enforce NOT NULL and default
ALTER TABLE public.skill_progress
  ALTER COLUMN points_awarded SET NOT NULL,
  ALTER COLUMN points_awarded SET DEFAULT 0;

-- ── 2. Update complete_lesson() based directly on 0007_zed_skill.sql ────────

CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id             uuid;
  v_is_verified         boolean;
  v_lesson_points       int;
  v_already_completed   boolean;
  v_points_awarded      int := 0;
  v_total_skill_points  int := 0;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify user
  SELECT is_verified
  INTO   v_is_verified
  FROM   public.users
  WHERE  id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'User is not verified. Account must be verified to complete lessons.';
  END IF;

  -- 3. Check lesson exists and get points
  SELECT l.skill_points
  INTO   v_lesson_points
  FROM   public.skill_lessons l
  JOIN   public.skill_tracks t ON t.id = l.track_id
  WHERE  l.id = p_lesson_id
    AND  t.is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  -- 4. Check if already completed (idempotency check)
  SELECT EXISTS (
    SELECT 1 FROM public.skill_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id
  ) INTO v_already_completed;

  IF NOT v_already_completed THEN
    -- First time completion: insert progress record and award points
    INSERT INTO public.skill_progress (user_id, lesson_id, points_awarded, completed_at)
    VALUES (v_user_id, p_lesson_id, v_lesson_points, now())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    -- If successfully inserted, points awarded = lesson points
    IF FOUND THEN
      v_points_awarded := v_lesson_points;
    ELSE
      v_already_completed := true;
      v_points_awarded := 0;
    END IF;
  ELSE
    v_points_awarded := 0;
  END IF;

  -- 5. Calculate cumulative total skill points earned by user from points_awarded
  SELECT COALESCE(SUM(p.points_awarded), 0)::int
  INTO   v_total_skill_points
  FROM   public.skill_progress p
  WHERE  p.user_id = v_user_id;

  -- 6. Return response
  RETURN jsonb_build_object(
    'ok',                 true,
    'points_awarded',     v_points_awarded,
    'total_skill_points', v_total_skill_points,
    'already_completed',  v_already_completed
  );
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.complete_lesson(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_lesson(uuid) TO authenticated;

-- ── 3. Admin Track RPCs ─────────────────────────────────────────────────────

-- Create Track
CREATE OR REPLACE FUNCTION public.admin_create_track(
  p_title       text,
  p_description text,
  p_slug        text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_track_id uuid;
  v_clean_title text := trim(COALESCE(p_title, ''));
  v_clean_desc  text := trim(COALESCE(p_description, ''));
  v_clean_slug  text := trim(COALESCE(p_slug, ''));
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  -- Validations
  IF length(v_clean_title) < 3 OR length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Track title must be between 3 and 120 characters';
  END IF;

  IF length(v_clean_desc) < 3 OR length(v_clean_desc) > 500 THEN
    RAISE EXCEPTION 'Track description must be between 3 and 500 characters';
  END IF;

  IF v_clean_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Track slug must consist of lowercase alphanumeric characters and hyphens';
  END IF;

  INSERT INTO public.skill_tracks (title, description, slug, is_published)
  VALUES (v_clean_title, v_clean_desc, v_clean_slug, false)
  RETURNING id INTO v_track_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    'skill.track.create',
    'skill_track',
    v_track_id::text,
    jsonb_build_object('title', v_clean_title, 'slug', v_clean_slug)
  );

  RETURN jsonb_build_object('ok', true, 'track_id', v_track_id);
END;
$$;

-- Update Track
CREATE OR REPLACE FUNCTION public.admin_update_track(
  p_track_id    uuid,
  p_title       text,
  p_description text,
  p_slug        text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_clean_title text := trim(COALESCE(p_title, ''));
  v_clean_desc  text := trim(COALESCE(p_description, ''));
  v_clean_slug  text := trim(COALESCE(p_slug, ''));
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  IF length(v_clean_title) < 3 OR length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Track title must be between 3 and 120 characters';
  END IF;

  IF length(v_clean_desc) < 3 OR length(v_clean_desc) > 500 THEN
    RAISE EXCEPTION 'Track description must be between 3 and 500 characters';
  END IF;

  IF v_clean_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Track slug must consist of lowercase alphanumeric characters and hyphens';
  END IF;

  UPDATE public.skill_tracks
  SET title = v_clean_title,
      description = v_clean_desc,
      slug = v_clean_slug
  WHERE id = p_track_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Track not found';
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    'skill.track.update',
    'skill_track',
    p_track_id::text,
    jsonb_build_object('title', v_clean_title, 'slug', v_clean_slug)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Publish / Unpublish Track (with validation: >= 1 lesson, unique positions)
CREATE OR REPLACE FUNCTION public.admin_set_track_published(
  p_track_id     uuid,
  p_is_published boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id      uuid;
  v_lesson_count  int;
  v_distinct_pos  int;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  IF p_is_published IS TRUE THEN
    SELECT count(*), count(DISTINCT position)
    INTO   v_lesson_count, v_distinct_pos
    FROM   public.skill_lessons
    WHERE  track_id = p_track_id;

    IF v_lesson_count = 0 THEN
      RAISE EXCEPTION 'Cannot publish a track with no lessons. Please add at least 1 lesson first.';
    END IF;

    IF v_lesson_count <> v_distinct_pos THEN
      RAISE EXCEPTION 'Cannot publish track: lesson positions must be unique.';
    END IF;
  END IF;

  UPDATE public.skill_tracks
  SET is_published = p_is_published
  WHERE id = p_track_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Track not found';
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    CASE WHEN p_is_published THEN 'skill.track.publish' ELSE 'skill.track.unpublish' END,
    'skill_track',
    p_track_id::text,
    jsonb_build_object('is_published', p_is_published)
  );

  RETURN jsonb_build_object('ok', true, 'is_published', p_is_published);
END;
$$;

-- ── 4. Admin Lesson RPCs ────────────────────────────────────────────────────

-- Create or Update Lesson
CREATE OR REPLACE FUNCTION public.admin_save_lesson(
  p_lesson_id    uuid,        -- NULL for create, non-null for update
  p_track_id     uuid,
  p_title        text,
  p_summary      text,
  p_content_md   text,
  p_skill_points int,
  p_position     int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id    uuid;
  v_res_id      uuid;
  v_is_create   boolean := (p_lesson_id IS NULL);
  v_clean_title text := trim(COALESCE(p_title, ''));
  v_clean_sum   text := trim(COALESCE(p_summary, ''));
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  -- SQL validations
  IF length(v_clean_title) < 3 OR length(v_clean_title) > 120 THEN
    RAISE EXCEPTION 'Lesson title must be between 3 and 120 characters';
  END IF;

  IF length(v_clean_sum) = 0 OR length(v_clean_sum) > 300 THEN
    RAISE EXCEPTION 'Lesson summary must be at most 300 characters';
  END IF;

  IF length(COALESCE(p_content_md, '')) < 50 OR length(COALESCE(p_content_md, '')) > 20000 THEN
    RAISE EXCEPTION 'Lesson content must be between 50 and 20,000 characters';
  END IF;

  IF p_skill_points < 0 OR p_skill_points > 100 THEN
    RAISE EXCEPTION 'Skill points must be an integer between 0 and 100';
  END IF;

  IF p_position < 1 THEN
    RAISE EXCEPTION 'Lesson position must be greater than or equal to 1';
  END IF;

  IF v_is_create THEN
    INSERT INTO public.skill_lessons (
      track_id, title, summary, content_md, skill_points, position
    )
    VALUES (
      p_track_id, v_clean_title, v_clean_sum, p_content_md, p_skill_points, p_position
    )
    RETURNING id INTO v_res_id;
  ELSE
    UPDATE public.skill_lessons
    SET title        = v_clean_title,
        summary      = v_clean_sum,
        content_md   = p_content_md,
        skill_points = p_skill_points,
        position     = p_position
    WHERE id = p_lesson_id AND track_id = p_track_id
    RETURNING id INTO v_res_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lesson not found';
    END IF;
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    CASE WHEN v_is_create THEN 'skill.lesson.create' ELSE 'skill.lesson.update' END,
    'skill_lesson',
    v_res_id::text,
    jsonb_build_object('track_id', p_track_id, 'title', v_clean_title, 'points', p_skill_points, 'position', p_position)
  );

  RETURN jsonb_build_object('ok', true, 'lesson_id', v_res_id);
END;
$$;

-- Reorder Lessons
CREATE OR REPLACE FUNCTION public.admin_reorder_lessons(
  p_track_id    uuid,
  p_lesson_ids  uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id           uuid;
  v_track_lesson_count int;
  v_match_count        int;
  v_arr_length         int;
  v_distinct_count     int;
  v_idx                int;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  -- 1. Check array not null or empty
  IF p_lesson_ids IS NULL THEN
    RAISE EXCEPTION 'Lesson IDs array cannot be null';
  END IF;

  v_arr_length := array_length(p_lesson_ids, 1);
  IF v_arr_length IS NULL OR v_arr_length = 0 THEN
    RAISE EXCEPTION 'Lesson IDs array cannot be empty';
  END IF;

  -- 2. Check duplicates in array
  SELECT count(DISTINCT id) INTO v_distinct_count FROM unnest(p_lesson_ids) AS id;
  IF v_distinct_count <> v_arr_length THEN
    RAISE EXCEPTION 'Duplicate lesson IDs found in reorder array';
  END IF;

  -- 3. Check track lesson count matches
  SELECT count(*) INTO v_track_lesson_count
  FROM public.skill_lessons
  WHERE track_id = p_track_id;

  IF v_arr_length <> v_track_lesson_count THEN
    RAISE EXCEPTION 'Reorder array must contain exactly the track lessons (expected %, got %)', v_track_lesson_count, v_arr_length;
  END IF;

  -- 4. Check all IDs belong to this track
  SELECT count(*) INTO v_match_count
  FROM public.skill_lessons
  WHERE track_id = p_track_id
    AND id = ANY(p_lesson_ids);

  IF v_match_count <> v_track_lesson_count THEN
    RAISE EXCEPTION 'Reorder array contains lesson IDs that do not belong to this track';
  END IF;

  -- 5. Offset positions by 10000 to prevent unique constraint conflicts during update
  UPDATE public.skill_lessons
  SET position = position + 10000
  WHERE track_id = p_track_id;

  -- 6. Apply new positions sequentially
  FOR v_idx IN 1 .. v_arr_length LOOP
    UPDATE public.skill_lessons
    SET position = v_idx
    WHERE id = p_lesson_ids[v_idx] AND track_id = p_track_id;
  END LOOP;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    'skill.lessons.reorder',
    'skill_track',
    p_track_id::text,
    jsonb_build_object('lesson_ids', p_lesson_ids)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Delete Lesson (strictly blocked if completed by any user)
CREATE OR REPLACE FUNCTION public.admin_delete_lesson(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id        uuid;
  v_track_id        uuid;
  v_completion_cnt  int;
BEGIN
  IF public.is_admin() IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_admin_id := auth.uid();

  -- Lock the lesson row first
  SELECT track_id INTO v_track_id
  FROM public.skill_lessons
  WHERE id = p_lesson_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  -- Check if any user completed this lesson
  SELECT count(*) INTO v_completion_cnt
  FROM public.skill_progress
  WHERE lesson_id = p_lesson_id;

  IF v_completion_cnt > 0 THEN
    RAISE EXCEPTION 'Cannot delete a lesson that users have already completed (% completions). Please unpublish the track instead.', v_completion_cnt;
  END IF;

  DELETE FROM public.skill_lessons WHERE id = p_lesson_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  VALUES (
    v_admin_id,
    'skill.lesson.delete',
    'skill_lesson',
    p_lesson_id::text,
    jsonb_build_object('track_id', v_track_id)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ── 5. Permissions ──────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.admin_create_track(text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_create_track(text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_track(uuid, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_update_track(uuid, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_track_published(uuid, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_track_published(uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_save_lesson(uuid, uuid, text, text, text, int, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_save_lesson(uuid, uuid, text, text, text, int, int) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_reorder_lessons(uuid, uuid[]) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_reorder_lessons(uuid, uuid[]) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_delete_lesson(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_delete_lesson(uuid) TO authenticated;
