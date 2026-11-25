"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSkillLevelProgress, SkillProgressSummary } from "@/data/skill-levels";
import { mapSkillRpcError } from "@/lib/skill/errors";

export interface SkillTrackSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  totalPoints: number;
  earnedPoints: number;
  progressPercent: number;
}

export interface SkillLessonItem {
  id: string;
  track_id: string;
  title: string;
  summary: string;
  content_md: string;
  content_url: string | null;
  position: number;
  skill_points: number;
  completed: boolean;
  completed_at: string | null;
}

export interface SkillOverviewData {
  user: {
    id: string;
    is_verified: boolean;
  };
  tracks: SkillTrackSummary[];
  totalSkillPoints: number;
  progressSummary: SkillProgressSummary;
}

/**
 * Fetch all published tracks and the signed-in user's progress.
 * Strict user-scoped reads using the session client with explicit .eq("user_id", user.id).
 */
export async function getSkillOverview(): Promise<SkillOverviewData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 1. Fetch user profile verification status
  const { data: profile } = await supabase
    .from("users")
    .select("is_verified")
    .eq("id", user.id)
    .maybeSingle();

  // 2. Parallel fetch of published tracks, all lessons, and user's progress
  const [tracksResult, lessonsResult, progressResult] = await Promise.all([
    supabase
      .from("skill_tracks")
      .select("id, slug, title, description, is_published, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("skill_lessons")
      .select("id, track_id, skill_points, position")
      .order("position", { ascending: true }),
    supabase
      .from("skill_progress")
      .select("lesson_id, points_awarded, completed_at")
      .eq("user_id", user.id),
  ]);

  const tracks = tracksResult.data ?? [];
  const lessons = lessonsResult.data ?? [];
  const completedMap = new Map<string, { completed_at: string; points_awarded: number | null }>(
    (progressResult.data ?? []).map((p) => [
      p.lesson_id,
      {
        completed_at: p.completed_at,
        points_awarded: typeof p.points_awarded === "number" ? p.points_awarded : null,
      },
    ])
  );

  // 3. Compute points and lesson counts per track
  let userTotalPoints = 0;

  const trackSummaries: SkillTrackSummary[] = tracks.map((track) => {
    const trackLessons = lessons.filter((l) => l.track_id === track.id);
    const totalLessons = trackLessons.length;
    let completedLessons = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const l of trackLessons) {
      totalPoints += l.skill_points;
      const progress = completedMap.get(l.id);
      if (progress) {
        completedLessons += 1;
        const pts = progress.points_awarded ?? l.skill_points;
        earnedPoints += pts;
        userTotalPoints += pts;
      }
    }

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      totalLessons,
      completedLessons,
      totalPoints,
      earnedPoints,
      progressPercent,
    };
  });

  const progressSummary = getSkillLevelProgress(userTotalPoints);

  return {
    user: {
      id: user.id,
      is_verified: Boolean(profile?.is_verified),
    },
    tracks: trackSummaries,
    totalSkillPoints: userTotalPoints,
    progressSummary,
  };
}

export interface SkillQuizSummary {
  id: string;
  track_id: string;
  lesson_id: string | null;
  title: string;
  pass_mark: number;
  max_attempts: number;
  question_count: number;
  attempts_used: number;
  attempts_left: number;
  best_score_pct: number | null;
  passed: boolean;
}

export interface SkillCourseStatus {
  lessons_done: number;
  lessons_total: number;
  quizzes_passed: number;
  quizzes_total: number;
  score_pct: number | null;
  remark: string | null;
  price_ngn: number;
  certificate_enabled: boolean;
}

export interface TrackDetailData {
  track: {
    id: string;
    slug: string;
    title: string;
    description: string;
    price_ngn: number;
    certificate_enabled: boolean;
  };
  lessons: SkillLessonItem[];
  quizzes: SkillQuizSummary[];
  courseStatus: SkillCourseStatus | null;
  completedCount: number;
  totalPoints: number;
  earnedPoints: number;
  isVerified: boolean;
}

function normalizeQuizSummary(raw: Record<string, unknown>, trackId: string): SkillQuizSummary {
  const maxAttempts = Number(raw.max_attempts ?? 3);
  const attemptsUsed = Number(raw.attempts_used ?? 0);
  const attemptsLeft =
    raw.attempts_left !== undefined && raw.attempts_left !== null
      ? Number(raw.attempts_left)
      : Math.max(0, maxAttempts - attemptsUsed);

  return {
    id: String(raw.id ?? raw.quiz_id ?? ""),
    track_id: String(raw.track_id ?? trackId),
    lesson_id: raw.lesson_id ? String(raw.lesson_id) : null,
    title: String(raw.title ?? "Quiz"),
    pass_mark: Number(raw.pass_mark ?? 70),
    max_attempts: maxAttempts,
    question_count: Number(raw.question_count ?? 0),
    attempts_used: attemptsUsed,
    attempts_left: attemptsLeft,
    best_score_pct:
      raw.best_score_pct !== null && raw.best_score_pct !== undefined
        ? Number(raw.best_score_pct)
        : raw.best_score !== null && raw.best_score !== undefined
        ? Number(raw.best_score)
        : null,
    passed: Boolean(raw.passed),
  };
}

function normalizeCourseStatus(
  raw: Record<string, unknown> | null,
  fallbackPriceNgn: number,
  fallbackCertEnabled: boolean
): SkillCourseStatus | null {
  if (!raw) return null;
  return {
    lessons_done: Number(raw.lessons_done ?? raw.completed_lessons ?? 0),
    lessons_total: Number(raw.lessons_total ?? raw.total_lessons ?? 0),
    quizzes_passed: Number(raw.quizzes_passed ?? 0),
    quizzes_total: Number(raw.quizzes_total ?? 0),
    score_pct:
      raw.score_pct !== null && raw.score_pct !== undefined
        ? Number(raw.score_pct)
        : raw.overall_score !== null && raw.overall_score !== undefined
        ? Number(raw.overall_score)
        : null,
    remark: raw.remark ? String(raw.remark) : null,
    price_ngn: Number(raw.price_ngn ?? fallbackPriceNgn ?? 0),
    certificate_enabled: Boolean(
      raw.certificate_enabled ?? fallbackCertEnabled
    ),
  };
}

/**
 * Fetch a specific track and all its lessons with completion status, quizzes, and course status.
 */
export async function getTrackDetail(
  slug: string
): Promise<TrackDetailData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch track
  const { data: track } = await supabase
    .from("skill_tracks")
    .select("id, slug, title, description, price_ngn, certificate_enabled")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!track) {
    return null;
  }

  // Fetch verification, lessons, progress, quizzes, and course status in parallel
  const [
    profileResult,
    lessonsResult,
    progressResult,
    quizzesResult,
    statusResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("skill_lessons")
      .select(
        "id, track_id, title, summary, content_md, content_url, position, skill_points"
      )
      .eq("track_id", track.id)
      .order("position", { ascending: true }),
    supabase
      .from("skill_progress")
      .select("lesson_id, points_awarded, completed_at")
      .eq("user_id", user.id),
    supabase.rpc("skill_list_quizzes", { p_track_id: track.id }),
    supabase.rpc("skill_course_status", { p_track_id: track.id }),
  ]);

  const completedMap = new Map<
    string,
    { completed_at: string; points_awarded: number | null }
  >(
    (progressResult.data ?? []).map((p) => [
      p.lesson_id,
      {
        completed_at: p.completed_at,
        points_awarded:
          typeof p.points_awarded === "number" ? p.points_awarded : null,
      },
    ])
  );

  let earnedPoints = 0;
  let totalPoints = 0;
  let completedCount = 0;

  const lessons: SkillLessonItem[] = (lessonsResult.data ?? []).map((l) => {
    const progress = completedMap.get(l.id);
    const isCompleted = Boolean(progress);
    totalPoints += l.skill_points;
    if (isCompleted && progress) {
      earnedPoints += progress.points_awarded ?? l.skill_points;
      completedCount += 1;
    }
    return {
      id: l.id,
      track_id: l.track_id,
      title: l.title,
      summary: l.summary,
      content_md: l.content_md,
      content_url: l.content_url,
      position: l.position,
      skill_points: l.skill_points,
      completed: isCompleted,
      completed_at: progress?.completed_at ?? null,
    };
  });

  const rawQuizzes = Array.isArray(quizzesResult.data)
    ? (quizzesResult.data as Array<Record<string, unknown>>)
    : [];
  const quizzes = rawQuizzes.map((q) => normalizeQuizSummary(q, track.id));

  const courseStatus = normalizeCourseStatus(
    (statusResult.data as Record<string, unknown> | null) ?? null,
    Number(track.price_ngn ?? 0),
    Boolean(track.certificate_enabled)
  );

  return {
    track: {
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      price_ngn: Number(track.price_ngn ?? 0),
      certificate_enabled: Boolean(track.certificate_enabled),
    },
    lessons,
    quizzes,
    courseStatus,
    completedCount,
    totalPoints,
    earnedPoints,
    isVerified: Boolean(profileResult.data?.is_verified),
  };
}

export type CompleteLessonResult =
  | {
      ok: true;
      points_awarded: number;
      total_skill_points: number;
      already_completed: boolean;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Server action: marks a lesson complete using the atomic database RPC.
 */
export async function completeLessonAction(
  lessonId: string,
  trackSlug?: string
): Promise<CompleteLessonResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("complete_lesson", {
      p_lesson_id: lessonId,
    });

    if (error) {
      console.error("[Skill complete_lesson RPC error]:", error);
      return { ok: false, error: mapSkillRpcError(error.message) };
    }

    const result = data as {
      ok?: boolean;
      points_awarded?: number;
      total_skill_points?: number;
      already_completed?: boolean;
    };

    revalidatePath("/skill");
    revalidatePath("/skill/[slug]", "page");
    if (trackSlug) {
      revalidatePath(`/skill/${trackSlug}`);
    }

    return {
      ok: true,
      points_awarded: Number(result?.points_awarded ?? 0),
      total_skill_points: Number(result?.total_skill_points ?? 0),
      already_completed: Boolean(result?.already_completed),
    };
  } catch (err) {
    console.error("[Skill completeLessonAction uncaught error]:", err);
    return {
      ok: false,
      error: mapSkillRpcError(err instanceof Error ? err.message : String(err)),
    };
  }
}

export interface LessonHeartbeatResult {
  seconds_spent: number;
  required_seconds: number;
  remaining_seconds: number;
}

export async function lessonHeartbeatAction(
  lessonId: string,
  reset = false
): Promise<
  | { ok: true; data: LessonHeartbeatResult }
  | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("skill_lesson_heartbeat", {
      p_lesson_id: lessonId,
      p_reset: reset,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const row = (data ?? {}) as Record<string, unknown>;
    return {
      ok: true,
      data: {
        seconds_spent: Number(row.seconds_spent ?? 0),
        required_seconds: Number(row.required_seconds ?? 0),
        remaining_seconds: Number(row.remaining_seconds ?? 0),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Heartbeat failed",
    };
  }
}

export interface LearnerQuizQuestion {
  id: string;
  position: number;
  prompt: string;
  options: string[];
  points: number;
}

export interface LearnerQuizData {
  id: string;
  track_id: string;
  lesson_id: string | null;
  title: string;
  pass_mark: number;
  max_attempts: number;
  attempts_used: number;
  attempts_left: number;
  passed: boolean;
  best_score_pct: number | null;
  questions: LearnerQuizQuestion[];
}

export async function getLearnerQuiz(
  quizId: string
): Promise<LearnerQuizData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase.rpc("skill_get_quiz", {
    p_quiz_id: quizId,
  });

  if (error || !data) {
    return null;
  }

  const raw = data as Record<string, unknown>;
  const quizObj = (raw.quiz ?? raw) as Record<string, unknown>;
  const rawQuestions = Array.isArray(raw.questions)
    ? (raw.questions as Array<Record<string, unknown>>)
    : Array.isArray(quizObj.questions)
    ? (quizObj.questions as Array<Record<string, unknown>>)
    : [];

  const maxAttempts = Number(quizObj.max_attempts ?? 3);
  const attemptsUsed = Number(quizObj.attempts_used ?? 0);
  const attemptsLeft =
    quizObj.attempts_left !== undefined && quizObj.attempts_left !== null
      ? Number(quizObj.attempts_left)
      : Math.max(0, maxAttempts - attemptsUsed);

  return {
    id: String(quizObj.id ?? quizId),
    track_id: String(quizObj.track_id ?? ""),
    lesson_id: quizObj.lesson_id ? String(quizObj.lesson_id) : null,
    title: String(quizObj.title ?? "Quiz"),
    pass_mark: Number(quizObj.pass_mark ?? 70),
    max_attempts: maxAttempts,
    attempts_used: attemptsUsed,
    attempts_left: attemptsLeft,
    passed: Boolean(quizObj.passed),
    best_score_pct:
      quizObj.best_score_pct !== null && quizObj.best_score_pct !== undefined
        ? Number(quizObj.best_score_pct)
        : null,
    questions: rawQuestions.map((q, idx) => ({
      id: String(q.id ?? ""),
      position: Number(q.position ?? idx + 1),
      prompt: String(q.prompt ?? ""),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      points: Number(q.points ?? 1),
    })),
  };
}

export interface QuizSubmitResult {
  score_pct: number;
  passed: boolean;
  pass_mark: number;
  attempts_used: number;
  attempts_left: number;
  results: Array<{ question_id: string; correct: boolean }>;
}

export async function submitQuizAction(
  quizId: string,
  answers: Record<string, number>,
  trackSlug?: string
): Promise<
  | { ok: true; data: QuizSubmitResult }
  | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("skill_submit_quiz", {
      p_quiz_id: quizId,
      p_answers: answers,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const row = (data ?? {}) as Record<string, unknown>;
    const rawResults = Array.isArray(row.results)
      ? (row.results as Array<Record<string, unknown>>)
      : [];

    revalidatePath("/skill");
    if (trackSlug) {
      revalidatePath(`/skill/${trackSlug}`);
    }

    return {
      ok: true,
      data: {
        score_pct: Number(row.score_pct ?? 0),
        passed: Boolean(row.passed),
        pass_mark: Number(row.pass_mark ?? 70),
        attempts_used: Number(row.attempts_used ?? 0),
        attempts_left: Number(row.attempts_left ?? 0),
        results: rawResults.map((r) => ({
          question_id: String(r.question_id ?? ""),
          correct: Boolean(r.correct),
        })),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to submit quiz",
    };
  }
}
