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

// ── Paid, Timed, Quizzed Courses Helpers & Schemas ──────────────────────────

export interface ScoreBand {
  min: number;
  label: string;
}

/**
 * Validates score bands:
 * - At least 1 band
 * - Each min is an integer 0..100, label is non-empty (max 60 chars)
 * - Strictly descending order of min (e.g. 90, 75, 50)
 */
export function validateScoreBands(
  bands: ScoreBand[]
): { ok: true } | { ok: false; error: string } {
  if (!Array.isArray(bands) || bands.length === 0) {
    return { ok: false, error: "Add at least one score band." };
  }

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (!Number.isInteger(band.min) || band.min < 0 || band.min > 100) {
      return {
        ok: false,
        error: `Band ${i + 1}: minimum score must be a whole number between 0 and 100.`,
      };
    }
    if (!band.label || !band.label.trim()) {
      return { ok: false, error: `Band ${i + 1}: label is required.` };
    }
    if (band.label.trim().length > 60) {
      return {
        ok: false,
        error: `Band ${i + 1}: label must not exceed 60 characters.`,
      };
    }
    if (i > 0 && band.min >= bands[i - 1].min) {
      return {
        ok: false,
        error: "Score bands must be in strictly descending order (e.g. 90, 75, 50).",
      };
    }
  }

  return { ok: true };
}

/**
 * Converts a minute input (number or numeric string) into whole seconds.
 * Returns null for empty, null, undefined, or invalid values.
 */
export function minutesToSeconds(
  minutes: number | string | null | undefined
): number | null {
  if (minutes === null || minutes === undefined) return null;
  if (typeof minutes === "string" && minutes.trim() === "") return null;
  const num = Number(minutes);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 60);
}

/**
 * Converts seconds into a clean minutes string for form inputs.
 * Returns "" when seconds is null or undefined.
 */
export function secondsToMinutes(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return "";
  }
  return Number((seconds / 60).toFixed(2)).toString();
}

/**
 * Computes automatic minimum seconds from lesson duration and percentage.
 */
export function computeAutoMinSeconds(
  durationSeconds: number | null | undefined,
  minTimePct: number
): number | null {
  if (
    durationSeconds === null ||
    durationSeconds === undefined ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return null;
  }
  const pct = Math.max(0, Math.min(100, minTimePct));
  return Math.round((durationSeconds * pct) / 100);
}

/**
 * Formats seconds as a compact minute label (e.g. "9.6 min" or "10 min").
 */
export function formatSecondsAsMinutesLabel(
  seconds: number | null | undefined
): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return "0 min";
  }
  const mins = Number((seconds / 60).toFixed(1));
  return `${mins} min`;
}

export const skillSettingsSchema = z.object({
  default_pass_mark: z
    .number()
    .int("Pass mark must be a whole number")
    .min(1, "Pass mark must be at least 1%")
    .max(100, "Pass mark cannot exceed 100%"),
  default_max_attempts: z
    .number()
    .int("Attempts must be a whole number")
    .min(1, "Allow at least 1 attempt")
    .max(20, "Attempts cannot exceed 20"),
  default_min_time_pct: z
    .number()
    .int("Minimum time percentage must be a whole number")
    .min(0, "Minimum time cannot be negative")
    .max(100, "Minimum time cannot exceed 100%"),
  payment_mode: z.enum(["manual", "paystack"]),
  manual_bank_name: z.string().trim().max(120, "Bank name is too long"),
  manual_account_number: z
    .string()
    .trim()
    .max(20, "Account number is too long"),
  manual_account_name: z.string().trim().max(120, "Account name is too long"),
  manual_instructions: z
    .string()
    .trim()
    .max(1000, "Instructions must not exceed 1,000 characters"),
});

export type SkillSettingsInput = z.infer<typeof skillSettingsSchema>;

export const trackSettingsSchema = z.object({
  price_ngn: z
    .number()
    .int("Price must be a whole naira amount")
    .min(0, "Price cannot be negative")
    .max(10_000_000, "Price is too high"),
  pass_mark: z
    .number()
    .int("Pass mark must be a whole number")
    .min(1, "Pass mark must be between 1 and 100")
    .max(100, "Pass mark must be between 1 and 100")
    .nullable(),
  max_attempts: z
    .number()
    .int("Max attempts must be a whole number")
    .min(1, "Max attempts must be between 1 and 20")
    .max(20, "Max attempts must be between 1 and 20")
    .nullable(),
  min_time_pct: z
    .number()
    .int("Minimum time % must be a whole number")
    .min(0, "Minimum time % must be between 0 and 100")
    .max(100, "Minimum time % must be between 0 and 100")
    .nullable(),
  certificate_enabled: z.boolean(),
});

export type TrackSettingsInput = z.infer<typeof trackSettingsSchema>;

export const quizQuestionSchema = z
  .object({
    id: z.string().optional(),
    prompt: z
      .string()
      .trim()
      .min(3, "Question prompt must be at least 3 characters")
      .max(1000, "Question prompt must not exceed 1,000 characters"),
    options: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Option text cannot be empty")
          .max(300, "Option text must not exceed 300 characters")
      )
      .min(2, "Each question must have at least 2 options")
      .max(6, "Each question can have at most 6 options"),
    correct_index: z.number().int("Select a valid correct option"),
    points: z
      .number()
      .int("Points must be a whole number")
      .min(1, "Points must be at least 1")
      .max(100, "Points cannot exceed 100"),
  })
  .refine((q) => q.correct_index >= 0 && q.correct_index < q.options.length, {
    message: "Correct option must match one of the provided options",
    path: ["correct_index"],
  });

export const quizSchema = z.object({
  id: z.string().optional(),
  track_id: z.string().uuid("Invalid track"),
  lesson_id: z.string().uuid("Invalid lesson").nullable(),
  title: z
    .string()
    .trim()
    .min(2, "Quiz title must be at least 2 characters")
    .max(120, "Quiz title must not exceed 120 characters"),
  pass_mark: z
    .number()
    .int("Pass mark must be a whole number")
    .min(1, "Pass mark must be between 1 and 100")
    .max(100, "Pass mark must be between 1 and 100")
    .nullable(),
  max_attempts: z
    .number()
    .int("Max attempts must be a whole number")
    .min(1, "Max attempts must be between 1 and 20")
    .max(20, "Max attempts must be between 1 and 20")
    .nullable(),
  shuffle: z.boolean(),
  weight: z
    .number()
    .positive("Weight must be greater than 0")
    .max(100, "Weight cannot exceed 100"),
  questions: z
    .array(quizQuestionSchema)
    .min(1, "Add at least one question before saving"),
});

export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
