"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  trackSchema,
  lessonSchema,
  TrackInput,
  LessonInput,
  mapAdminSkillError,
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
  position: number;
  skill_points: number;
  completion_count: number;
  created_at: string;
}

export interface AdminTrackDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
  lessons: AdminLessonItem[];
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
 * Fetch a track detail along with its lessons and user completion counts.
 */
export async function getAdminTrackDetail(
  trackId: string
): Promise<AdminTrackDetail | null> {
  const supabase = await createClient();

  const [trackRes, lessonsRes] = await Promise.all([
    supabase
      .from("skill_tracks")
      .select("id, slug, title, description, is_published, created_at")
      .eq("id", trackId)
      .maybeSingle(),
    supabase
      .from("skill_lessons")
      .select("id, track_id, title, summary, content_md, content_url, position, skill_points, created_at")
      .eq("track_id", trackId)
      .order("position", { ascending: true }),
  ]);

  const track = trackRes.data;
  if (!track) return null;

  const lessons = lessonsRes.data ?? [];
  const lessonIds = lessons.map((l) => l.id);

  // Fetch completion counts for lessons in this track
  const completionCounts: Record<string, number> = {};
  if (lessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("skill_progress")
      .select("lesson_id")
      .in("lesson_id", lessonIds);

    if (progressRows) {
      for (const row of progressRows) {
        completionCounts[row.lesson_id] = (completionCounts[row.lesson_id] || 0) + 1;
      }
    }
  }

  const enrichedLessons: AdminLessonItem[] = lessons.map((l) => ({
    id: l.id,
    track_id: l.track_id,
    title: l.title,
    summary: l.summary,
    content_md: l.content_md,
    content_url: l.content_url,
    position: l.position,
    skill_points: l.skill_points,
    completion_count: completionCounts[l.id] || 0,
    created_at: l.created_at,
  }));

  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    description: track.description,
    is_published: Boolean(track.is_published),
    created_at: track.created_at,
    lessons: enrichedLessons,
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
