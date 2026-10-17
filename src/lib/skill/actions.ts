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
      .select("lesson_id, completed_at")
      .eq("user_id", user.id),
  ]);

  const tracks = tracksResult.data ?? [];
  const lessons = lessonsResult.data ?? [];
  const completedMap = new Map<string, string>(
    (progressResult.data ?? []).map((p) => [p.lesson_id, p.completed_at])
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
      if (completedMap.has(l.id)) {
        completedLessons += 1;
        earnedPoints += l.skill_points;
        userTotalPoints += l.skill_points;
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

export interface TrackDetailData {
  track: {
    id: string;
    slug: string;
    title: string;
    description: string;
  };
  lessons: SkillLessonItem[];
  completedCount: number;
  totalPoints: number;
  earnedPoints: number;
  isVerified: boolean;
}

/**
 * Fetch a specific track and all its lessons with completion status for the signed-in user.
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
    .select("id, slug, title, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!track) {
    return null;
  }

  // Fetch verification & lessons & user progress in parallel
  const [profileResult, lessonsResult, progressResult] = await Promise.all([
    supabase
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("skill_lessons")
      .select("id, track_id, title, summary, content_md, content_url, position, skill_points")
      .eq("track_id", track.id)
      .order("position", { ascending: true }),
    supabase
      .from("skill_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", user.id),
  ]);

  const completedMap = new Map<string, string>(
    (progressResult.data ?? []).map((p) => [p.lesson_id, p.completed_at])
  );

  let earnedPoints = 0;
  let totalPoints = 0;
  let completedCount = 0;

  const lessons: SkillLessonItem[] = (lessonsResult.data ?? []).map((l) => {
    const isCompleted = completedMap.has(l.id);
    totalPoints += l.skill_points;
    if (isCompleted) {
      earnedPoints += l.skill_points;
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
      completed_at: completedMap.get(l.id) ?? null,
    };
  });

  return {
    track,
    lessons,
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
