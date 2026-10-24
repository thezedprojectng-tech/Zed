import { z } from "zod";

export const trackSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must not exceed 120 characters"),
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(500, "Description must not exceed 500 characters"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(120, "Slug must not exceed 120 characters")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug must consist of lowercase letters, numbers, and single hyphens (e.g. 'freelancing-basics')"
    ),
});

export type TrackInput = z.infer<typeof trackSchema>;

export const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must not exceed 120 characters"),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(300, "Summary must not exceed 300 characters"),
  content_md: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(20000, "Content must not exceed 20,000 characters"),
  skill_points: z
    .number()
    .int("Skill points must be an integer")
    .min(0, "Skill points cannot be negative")
    .max(100, "Skill points must not exceed 100"),
  position: z
    .number()
    .int("Position must be an integer")
    .min(1, "Position must be at least 1"),
});

export type LessonInput = z.infer<typeof lessonSchema>;

/**
 * Checks whether a track meets the criteria to be published:
 * - Must have at least 1 lesson
 * - All lesson positions must be unique positive integers
 */
export function canPublishTrack(
  lessons: Array<{ position: number }>
): { allowed: boolean; reason?: string } {
  if (lessons.length === 0) {
    return {
      allowed: false,
      reason: "Cannot publish a track with no lessons. Please add at least 1 lesson first.",
    };
  }

  const positions = lessons.map((l) => l.position);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    return {
      allowed: false,
      reason: "Cannot publish track: lesson positions must be unique.",
    };
  }

  return { allowed: true };
}

/**
 * Pure helper for calculating total points awarded to a user, ensuring that
 * points_awarded at time of completion is used rather than the lesson''s current skill_points.
 */
export function calculateUserEarnedPoints(
  completions: Array<{ lesson_id: string; points_awarded?: number | null }>,
  lessons: Array<{ id: string; skill_points: number }>
): number {
  const lessonMap = new Map(lessons.map((l) => [l.id, l.skill_points]));
  let total = 0;

  for (const c of completions) {
    if (typeof c.points_awarded === "number") {
      total += c.points_awarded;
    } else {
      // Fallback to current lesson points if points_awarded was null before backfill
      const currentPts = lessonMap.get(c.lesson_id) ?? 0;
      total += currentPts;
    }
  }

  return total;
}

/**
 * Pure reordering helper that shifts an item from one index to another
 * and outputs updated sequential positions starting at 1.
 */
export function reorderLessonList<T extends { id: string }>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length
  ) {
    return items;
  }
  const result = Array.from(items);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Maps database and RPC error messages to user-friendly messages for the Admin UI.
 */
export function mapAdminSkillError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const msg =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : String(error);

  // Unique constraint on slug
  if (
    msg.includes("skill_tracks_slug_key") ||
    (msg.includes("slug") && msg.toLowerCase().includes("unique"))
  ) {
    return "A track with this URL slug already exists. Please choose a different slug.";
  }

  // Unique constraint on position
  if (
    msg.includes("skill_lessons_track_pos_uniq") ||
    (msg.includes("position") && msg.toLowerCase().includes("unique"))
  ) {
    return "A lesson already exists at this position in this track. Please choose another position or use the reorder tool.";
  }

  // Deletion blocked by existing completions
  if (msg.includes("Cannot delete a lesson that users have already completed")) {
    return msg;
  }

  // Cannot publish empty track
  if (msg.includes("Cannot publish a track with no lessons")) {
    return msg;
  }

  // Unauthorized
  if (msg.includes("Unauthorized") || msg.toLowerCase().includes("not admin")) {
    return "You do not have permission to perform this action.";
  }

  return msg;
}
