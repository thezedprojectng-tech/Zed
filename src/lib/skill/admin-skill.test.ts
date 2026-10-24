import { describe, it, expect } from "vitest";
import {
  trackSchema,
  lessonSchema,
  canPublishTrack,
  calculateUserEarnedPoints,
  reorderLessonList,
  mapAdminSkillError,
} from "./validation";

describe("trackSchema validation", () => {
  it("accepts a valid track input", () => {
    const valid = {
      title: "Freelancing & Getting Paid Online",
      description: "A comprehensive guide to finding clients and receiving payments safely.",
      slug: "freelancing-and-getting-paid-online",
    };
    const res = trackSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("rejects titles with fewer than 3 characters or more than 120 characters", () => {
    expect(
      trackSchema.safeParse({
        title: "AB",
        description: "Valid description",
        slug: "valid-slug",
      }).success
    ).toBe(false);

    expect(
      trackSchema.safeParse({
        title: "A".repeat(121),
        description: "Valid description",
        slug: "valid-slug",
      }).success
    ).toBe(false);
  });

  it("enforces lowercase alphanumeric slug with hyphens", () => {
    // Uppercase rejected
    expect(
      trackSchema.safeParse({
        title: "Valid Title",
        description: "Valid description",
        slug: "Invalid_Slug",
      }).success
    ).toBe(false);

    // Spaces rejected
    expect(
      trackSchema.safeParse({
        title: "Valid Title",
        description: "Valid description",
        slug: "invalid slug",
      }).success
    ).toBe(false);

    // Consecutive hyphens or leading/trailing hyphens rejected
    expect(
      trackSchema.safeParse({
        title: "Valid Title",
        description: "Valid description",
        slug: "-leading-hyphen",
      }).success
    ).toBe(false);

    // Valid slug accepted
    expect(
      trackSchema.safeParse({
        title: "Valid Title",
        description: "Valid description",
        slug: "ai-tools-for-work",
      }).success
    ).toBe(true);
  });
});

describe("lessonSchema validation", () => {
  const validLesson = {
    title: "Structuring a Modern Professional CV",
    summary: "Learn the standard single-to-two-page structure recruiters look for.",
    content_md: "### Core CV Guidelines\n\n".concat("A".repeat(80)),
    skill_points: 15,
    position: 1,
  };

  it("accepts valid lesson parameters", () => {
    expect(lessonSchema.safeParse(validLesson).success).toBe(true);
  });

  it("rejects title with fewer than 3 or more than 120 chars", () => {
    expect(lessonSchema.safeParse({ ...validLesson, title: "No" }).success).toBe(false);
    expect(
      lessonSchema.safeParse({ ...validLesson, title: "A".repeat(121) }).success
    ).toBe(false);
  });

  it("rejects summary longer than 300 characters", () => {
    expect(
      lessonSchema.safeParse({ ...validLesson, summary: "A".repeat(301) }).success
    ).toBe(false);
  });

  it("enforces content_md between 50 and 20,000 characters", () => {
    expect(
      lessonSchema.safeParse({ ...validLesson, content_md: "Too short" }).success
    ).toBe(false);

    expect(
      lessonSchema.safeParse({ ...validLesson, content_md: "A".repeat(20001) }).success
    ).toBe(false);
  });

  it("enforces skill_points integer between 0 and 100", () => {
    expect(lessonSchema.safeParse({ ...validLesson, skill_points: -5 }).success).toBe(
      false
    );
    expect(lessonSchema.safeParse({ ...validLesson, skill_points: 101 }).success).toBe(
      false
    );
    expect(lessonSchema.safeParse({ ...validLesson, skill_points: 15.5 }).success).toBe(
      false
    );
    expect(lessonSchema.safeParse({ ...validLesson, skill_points: 0 }).success).toBe(true);
    expect(lessonSchema.safeParse({ ...validLesson, skill_points: 100 }).success).toBe(
      true
    );
  });
});

describe("canPublishTrack helper", () => {
  it("blocks publishing if track has 0 lessons", () => {
    const res = canPublishTrack([]);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Cannot publish a track with no lessons");
  });

  it("blocks publishing if lesson positions have duplicates", () => {
    const res = canPublishTrack([{ position: 1 }, { position: 1 }, { position: 2 }]);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("lesson positions must be unique");
  });

  it("allows publishing if track has >= 1 lesson with unique positions", () => {
    const res = canPublishTrack([{ position: 1 }, { position: 2 }, { position: 3 }]);
    expect(res.allowed).toBe(true);
    expect(res.reason).toBeUndefined();
  });
});

describe("calculateUserEarnedPoints – points_awarded snapshot protection", () => {
  it("uses snapshotted points_awarded even if lesson skill_points changed later", () => {
    // Scenario: User completed lesson 1 when it was worth 20 pts.
    // Later, an admin edited lesson 1 to be worth 10 pts.
    // User also completed lesson 2 when it was worth 15 pts, which admin later changed to 25 pts.
    const lessons = [
      { id: "lesson-1", skill_points: 10 }, // edited by admin
      { id: "lesson-2", skill_points: 25 }, // edited by admin
    ];

    const completions = [
      { lesson_id: "lesson-1", points_awarded: 20 },
      { lesson_id: "lesson-2", points_awarded: 15 },
    ];

    const earned = calculateUserEarnedPoints(completions, lessons);
    // Must equal 20 + 15 = 35, NOT 10 + 25 = 35 (or any altered sum)
    expect(earned).toBe(35);
  });

  it("falls back to lesson.skill_points if points_awarded was null before backfill", () => {
    const lessons = [{ id: "lesson-old", skill_points: 15 }];
    const completions = [{ lesson_id: "lesson-old", points_awarded: null }];

    const earned = calculateUserEarnedPoints(completions, lessons);
    expect(earned).toBe(15);
  });
});

describe("reorderLessonList helper", () => {
  const items = [
    { id: "1", title: "A" },
    { id: "2", title: "B" },
    { id: "3", title: "C" },
  ];

  it("moves an item up correctly", () => {
    const result = reorderLessonList(items, 1, 0);
    expect(result.map((i) => i.id)).toEqual(["2", "1", "3"]);
  });

  it("moves an item down correctly", () => {
    const result = reorderLessonList(items, 0, 2);
    expect(result.map((i) => i.id)).toEqual(["2", "3", "1"]);
  });

  it("returns unchanged array if indices are out of bounds", () => {
    expect(reorderLessonList(items, -1, 1)).toEqual(items);
    expect(reorderLessonList(items, 0, 5)).toEqual(items);
  });
});

describe("mapAdminSkillError helper", () => {
  it("maps duplicate slug errors to human-readable message", () => {
    const err = "duplicate key value violates unique constraint \"skill_tracks_slug_key\"";
    expect(mapAdminSkillError(err)).toBe(
      "A track with this URL slug already exists. Please choose a different slug."
    );
  });

  it("maps duplicate position errors to human-readable message", () => {
    const err = "duplicate key value violates unique constraint \"skill_lessons_track_pos_uniq\"";
    expect(mapAdminSkillError(err)).toBe(
      "A lesson already exists at this position in this track. Please choose another position or use the reorder tool."
    );
  });

  it("preserves deletion block message for lessons with completions", () => {
    const err = "Cannot delete a lesson that users have already completed (3 completions). Please unpublish the track instead.";
    expect(mapAdminSkillError(err)).toBe(err);
  });

  it("preserves empty track publishing block message", () => {
    const err = "Cannot publish a track with no lessons. Please add at least 1 lesson first.";
    expect(mapAdminSkillError(err)).toBe(err);
  });
});