"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  trackSchema,
  lessonSchema,
  TrackInput,
  LessonInput,
  mapAdminSkillError,
  skillSettingsSchema,
  validateScoreBands,
  quizSchema,
  type ScoreBand,
  type SkillSettingsInput,
  type QuizInput,
} from "./validation";

export interface AdminTrackListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
  lesson_count: number;
  total_points: number;
}

export interface AdminLessonItem {
  id: string;
  track_id: string;
  title: string;
  summary: string;
  content_md: string;
  content_url: string | null;
  duration_seconds: number | null;
  min_seconds: number | null;
  position: number;
  skill_points: number;
  completion_count: number;
  created_at: string;
}

export interface AdminQuizQuestionItem {
  id: string;
  quiz_id: string;
  position: number;
  prompt: string;
  options: string[];
  correct_index: number;
  points: number;
}

export interface AdminQuizItem {
  id: string;
  track_id: string;
  lesson_id: string | null;
  title: string;
  pass_mark: number | null;
  max_attempts: number | null;
  shuffle_questions: boolean;
  weight: number;
  questions: AdminQuizQuestionItem[];
}

export interface AdminSkillSettings {
  default_pass_mark: number;
  default_max_attempts: number;
  default_min_time_pct: number;
  score_bands: ScoreBand[];
  payment_mode: "manual" | "paystack";
  manual_bank_name: string;
  manual_account_number: string;
  manual_account_name: string;
  manual_instructions: string;
}

export interface AdminTrackDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_published: boolean;
  price_ngn: number;
  pass_mark: number | null;
  max_attempts: number | null;
  min_time_pct: number | null;
  certificate_enabled: boolean;
  created_at: string;
  lessons: AdminLessonItem[];
  quizzes: AdminQuizItem[];
  settingsDefaults: {
    default_pass_mark: number;
    default_max_attempts: number;
    default_min_time_pct: number;
  };
}

export type AdminActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Fetch all tracks with lesson count and total points.
 */
export async function getAdminTracks(): Promise<AdminTrackListItem[]> {
  const supabase = await createClient();

  const [tracksRes, lessonsRes] = await Promise.all([
    supabase
      .from("skill_tracks")
      .select("id, slug, title, description, is_published, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("skill_lessons").select("track_id, skill_points"),
  ]);

  const tracks = tracksRes.data ?? [];
  const lessons = lessonsRes.data ?? [];

  return tracks.map((t) => {
    const trackLessons = lessons.filter((l) => l.track_id === t.id);
    const totalPoints = trackLessons.reduce((acc, l) => acc + (l.skill_points || 0), 0);
    return {
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      is_published: Boolean(t.is_published),
      created_at: t.created_at,
      lesson_count: trackLessons.length,
      total_points: totalPoints,
    };
  });
}

/**
 * Fetch global skill settings defaults, score bands, and payment details.
 */
export async function getAdminSkillSettings(): Promise<AdminSkillSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skill_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const raw = (data ?? {}) as Record<string, unknown>;
  const rawBands = Array.isArray(raw.score_bands) ? raw.score_bands : [];
  const parsedBands: ScoreBand[] = rawBands
    .map((b) => {
      const item = (b ?? {}) as Record<string, unknown>;
      return {
        min: Number(item.min ?? item.min_score ?? 0),
        label: String(item.label ?? ""),
      };
    })
    .filter((b) => b.label.trim().length > 0);

  return {
    default_pass_mark: Number(raw.default_pass_mark ?? 70),
    default_max_attempts: Number(raw.default_max_attempts ?? 3),
    default_min_time_pct: Number(raw.default_min_time_pct ?? 80),
    score_bands:
      parsedBands.length > 0
        ? parsedBands
        : [
            { min: 85, label: "Distinction" },
            { min: 70, label: "Merit" },
            { min: 50, label: "Pass" },
          ],
    payment_mode: raw.payment_mode === "paystack" ? "paystack" : "manual",
    manual_bank_name: String(raw.manual_bank_name ?? ""),
    manual_account_number: String(raw.manual_account_number ?? ""),
    manual_account_name: String(raw.manual_account_name ?? ""),
    manual_instructions: String(raw.manual_instructions ?? ""),
  };
}

/**
 * Fetch a track detail along with its lessons, quizzes, and user completion counts.
 */
export async function getAdminTrackDetail(
  trackId: string
): Promise<AdminTrackDetail | null> {
  const supabase = await createClient();

  const [trackRes, lessonsRes, quizzesRes, settings] = await Promise.all([
    supabase
      .from("skill_tracks")
      .select(
        "id, slug, title, description, is_published, price_ngn, pass_mark, max_attempts, min_time_pct, certificate_enabled, created_at"
      )
      .eq("id", trackId)
      .maybeSingle(),
    supabase
      .from("skill_lessons")
      .select(
        "id, track_id, title, summary, content_md, content_url, duration_seconds, min_seconds, position, skill_points, created_at"
      )
      .eq("track_id", trackId)
      .order("position", { ascending: true }),
    supabase
      .from("skill_quizzes")
      .select(
        "id, track_id, lesson_id, title, pass_mark, max_attempts, shuffle_questions, weight"
      )
      .eq("track_id", trackId),
    getAdminSkillSettings(),
  ]);

  const track = trackRes.data;
  if (!track) return null;

  const lessons = lessonsRes.data ?? [];
  const lessonIds = lessons.map((l) => l.id);
  const quizRows = quizzesRes.data ?? [];
  const quizIds = quizRows.map((q) => q.id);

  // Fetch completion counts and quiz questions in parallel
  const [progressRes, questionsRes] = await Promise.all([
    lessonIds.length > 0
      ? supabase
          .from("skill_progress")
          .select("lesson_id")
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as Array<{ lesson_id: string }> }),
    quizIds.length > 0
      ? supabase
          .from("skill_quiz_questions")
          .select("id, quiz_id, position, prompt, options, correct_index, points")
          .in("quiz_id", quizIds)
          .order("position", { ascending: true })
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            quiz_id: string;
            position: number;
            prompt: string;
            options: unknown;
            correct_index: number;
            points: number;
          }>,
        }),
  ]);

  const completionCounts: Record<string, number> = {};
  for (const row of progressRes.data ?? []) {
    completionCounts[row.lesson_id] = (completionCounts[row.lesson_id] || 0) + 1;
  }

  const questionsByQuiz: Record<string, AdminQuizQuestionItem[]> = {};
  for (const q of questionsRes.data ?? []) {
    const opts = Array.isArray(q.options) ? q.options.map(String) : [];
    const list = questionsByQuiz[q.quiz_id] ?? [];
    list.push({
      id: q.id,
      quiz_id: q.quiz_id,
      position: Number(q.position ?? list.length + 1),
      prompt: q.prompt,
      options: opts,
      correct_index: Number(q.correct_index ?? 0),
      points: Number(q.points ?? 1),
    });
    questionsByQuiz[q.quiz_id] = list;
  }

  const enrichedLessons: AdminLessonItem[] = lessons.map((l) => ({
    id: l.id,
    track_id: l.track_id,
    title: l.title,
    summary: l.summary,
    content_md: l.content_md,
    content_url: l.content_url,
    duration_seconds:
      l.duration_seconds !== null && l.duration_seconds !== undefined
        ? Number(l.duration_seconds)
        : null,
    min_seconds:
      l.min_seconds !== null && l.min_seconds !== undefined
        ? Number(l.min_seconds)
        : null,
    position: l.position,
    skill_points: l.skill_points,
    completion_count: completionCounts[l.id] || 0,
    created_at: l.created_at,
  }));

  const enrichedQuizzes: AdminQuizItem[] = quizRows.map((q) => ({
    id: q.id,
    track_id: q.track_id,
    lesson_id: q.lesson_id ?? null,
    title: q.title,
    pass_mark:
      q.pass_mark !== null && q.pass_mark !== undefined
        ? Number(q.pass_mark)
        : null,
    max_attempts:
      q.max_attempts !== null && q.max_attempts !== undefined
        ? Number(q.max_attempts)
        : null,
    shuffle_questions: Boolean(q.shuffle_questions),
    weight: Number(q.weight ?? 1),
    questions: questionsByQuiz[q.id] ?? [],
  }));

  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    description: track.description,
    is_published: Boolean(track.is_published),
    price_ngn: Number(track.price_ngn ?? 0),
    pass_mark:
      track.pass_mark !== null && track.pass_mark !== undefined
        ? Number(track.pass_mark)
        : null,
    max_attempts:
      track.max_attempts !== null && track.max_attempts !== undefined
        ? Number(track.max_attempts)
        : null,
    min_time_pct:
      track.min_time_pct !== null && track.min_time_pct !== undefined
        ? Number(track.min_time_pct)
        : null,
    certificate_enabled: Boolean(track.certificate_enabled),
    created_at: track.created_at,
    lessons: enrichedLessons,
    quizzes: enrichedQuizzes,
    settingsDefaults: {
      default_pass_mark: settings.default_pass_mark,
      default_max_attempts: settings.default_max_attempts,
      default_min_time_pct: settings.default_min_time_pct,
    },
  };
}

/**
 * Create a new track.
 */
export async function adminCreateTrackAction(
  rawInput: TrackInput
): Promise<AdminActionResult<{ track_id: string }>> {
  const parsed = trackSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_create_track", {
      p_title: parsed.data.title,
      p_description: parsed.data.description,
      p_slug: parsed.data.slug,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath("/skill");
    return { ok: true, data: data as { track_id: string } };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Update track title, description, or slug.
 */
export async function adminUpdateTrackAction(
  trackId: string,
  rawInput: TrackInput
): Promise<AdminActionResult> {
  const parsed = trackSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_update_track", {
      p_track_id: trackId,
      p_title: parsed.data.title,
      p_description: parsed.data.description,
      p_slug: parsed.data.slug,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Toggle track published state.
 */
export async function adminSetTrackPublishedAction(
  trackId: string,
  isPublished: boolean
): Promise<AdminActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_track_published", {
      p_track_id: trackId,
      p_is_published: isPublished,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Save (create or update) a lesson.
 */
export async function adminSaveLessonAction(params: {
  lessonId?: string | null;
  trackId: string;
  input: LessonInput;
}): Promise<AdminActionResult<{ lesson_id: string }>> {
  const parsed = lessonSchema.safeParse(params.input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_save_lesson", {
      p_lesson_id: params.lessonId ?? null,
      p_track_id: params.trackId,
      p_title: parsed.data.title,
      p_summary: parsed.data.summary,
      p_content_md: parsed.data.content_md,
      p_skill_points: parsed.data.skill_points,
      p_position: parsed.data.position,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath(`/admin/skill/${params.trackId}`);
    revalidatePath("/skill");
    return { ok: true, data: data as { lesson_id: string } };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Reorder lessons in a track.
 */
export async function adminReorderLessonsAction(
  trackId: string,
  lessonIds: string[]
): Promise<AdminActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_reorder_lessons", {
      p_track_id: trackId,
      p_lesson_ids: lessonIds,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Delete a lesson (strictly rejected if user completions exist).
 */
export async function adminDeleteLessonAction(
  lessonId: string,
  trackId: string
): Promise<AdminActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_delete_lesson", {
      p_lesson_id: lessonId,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Update global skill settings via admin_update_skill_settings(p_settings jsonb).
 */
export async function adminUpdateSkillSettingsAction(
  input: SkillSettingsInput & { score_bands: ScoreBand[] }
): Promise<AdminActionResult> {
  const parsed = skillSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }

  const bandCheck = validateScoreBands(input.score_bands);
  if (!bandCheck.ok) {
    return { ok: false, error: bandCheck.error };
  }

  try {
    const supabase = await createClient();
    const payload = {
      ...parsed.data,
      payment_mode: "manual",
      score_bands: input.score_bands.map((b) => ({
        min: b.min,
        label: b.label.trim(),
      })),
    };

    const { error } = await supabase.rpc("admin_update_skill_settings", {
      p_settings: payload,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath("/admin/skill/settings");
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Update per-track pricing and quiz/certificate settings.
 * Sends only changed keys; sends null to clear an override.
 */
export async function adminUpdateTrackSettingsAction(
  trackId: string,
  patch: Record<string, number | boolean | null>
): Promise<AdminActionResult> {
  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_update_skill_track_settings", {
      p_track_id: trackId,
      p_settings: patch,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath("/admin/skill");
    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Update lesson video URL (content_url) directly through RLS.
 */
export async function adminUpdateLessonContentUrlAction(
  lessonId: string,
  trackId: string,
  contentUrl: string | null
): Promise<AdminActionResult> {
  try {
    const supabase = await createClient();
    const cleaned = contentUrl && contentUrl.trim() ? contentUrl.trim() : null;
    const { error } = await supabase
      .from("skill_lessons")
      .update({ content_url: cleaned })
      .eq("id", lessonId);

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Update lesson duration_seconds and min_seconds via admin_update_lesson_timing.
 */
export async function adminUpdateLessonTimingAction(
  lessonId: string,
  trackId: string,
  durationSeconds: number | null,
  minSeconds: number | null
): Promise<AdminActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_update_lesson_timing", {
      p_lesson_id: lessonId,
      p_duration_seconds: durationSeconds,
      p_min_seconds: minSeconds,
    });

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Create or update a quiz and its questions directly through RLS.
 */
export async function adminSaveQuizAction(
  rawInput: QuizInput
): Promise<AdminActionResult<{ quiz_id: string }>> {
  const parsed = quizSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quiz" };
  }

  const data = parsed.data;

  try {
    const supabase = await createClient();
    let quizId = data.id;

    if (quizId) {
      const { error: updateErr } = await supabase
        .from("skill_quizzes")
        .update({
          title: data.title,
          pass_mark: data.pass_mark,
          max_attempts: data.max_attempts,
          shuffle_questions: data.shuffle_questions,
          weight: data.weight,
        })
        .eq("id", quizId);

      if (updateErr) {
        return { ok: false, error: mapAdminSkillError(updateErr) };
      }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("skill_quizzes")
        .insert({
          track_id: data.track_id,
          lesson_id: data.lesson_id,
          title: data.title,
          pass_mark: data.pass_mark,
          max_attempts: data.max_attempts,
          shuffle_questions: data.shuffle_questions,
          weight: data.weight,
        })
        .select("id")
        .single();

      if (insertErr || !inserted) {
        return { ok: false, error: mapAdminSkillError(insertErr) };
      }
      quizId = inserted.id;
    }

    // Sync questions: fetch existing IDs, delete removed, upsert/insert remaining
    const { data: existingRows } = await supabase
      .from("skill_quiz_questions")
      .select("id")
      .eq("quiz_id", quizId);

    const incomingIds = new Set(
      data.questions.map((q) => q.id).filter((id): id is string => Boolean(id))
    );
    const toDelete = (existingRows ?? [])
      .map((r) => r.id)
      .filter((id) => !incomingIds.has(id));

    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("skill_quiz_questions")
        .delete()
        .in("id", toDelete);
      if (delErr) {
        return { ok: false, error: mapAdminSkillError(delErr) };
      }
    }

    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      const payload = {
        quiz_id: quizId,
        position: i + 1,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        points: q.points,
      };

      if (q.id) {
        const { error: qUpdErr } = await supabase
          .from("skill_quiz_questions")
          .update(payload)
          .eq("id", q.id);
        if (qUpdErr) {
          return { ok: false, error: mapAdminSkillError(qUpdErr) };
        }
      } else {
        const { error: qInsErr } = await supabase
          .from("skill_quiz_questions")
          .insert(payload);
        if (qInsErr) {
          return { ok: false, error: mapAdminSkillError(qInsErr) };
        }
      }
    }

    revalidatePath(`/admin/skill/${data.track_id}`);
    revalidatePath("/skill");
    return { ok: true, data: { quiz_id: quizId! } };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}

/**
 * Delete a quiz and its questions (via cascade or explicit delete).
 */
export async function adminDeleteQuizAction(
  quizId: string,
  trackId: string
): Promise<AdminActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("skill_quizzes")
      .delete()
      .eq("id", quizId);

    if (error) {
      return { ok: false, error: mapAdminSkillError(error) };
    }

    revalidatePath(`/admin/skill/${trackId}`);
    revalidatePath("/skill");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminSkillError(err) };
  }
}
