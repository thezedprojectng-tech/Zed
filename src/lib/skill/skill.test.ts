import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import {
  SKILL_LEVEL_THRESHOLDS,
  computeEligibleLevel,
  getSkillLevelProgress,
  getSkillLevelName,
  formatEligibleLevelLabel,
} from "@/data/skill-levels";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";

describe("Zed Skill – Level Thresholds & Config", () => {
  it("has 5 levels with ascending point thresholds", () => {
    expect(SKILL_LEVEL_THRESHOLDS).toHaveLength(5);
    expect(SKILL_LEVEL_THRESHOLDS[0].level).toBe(1);
    expect(SKILL_LEVEL_THRESHOLDS[0].pointsRequired).toBe(0);
    expect(SKILL_LEVEL_THRESHOLDS[1].level).toBe(2);
    expect(SKILL_LEVEL_THRESHOLDS[1].pointsRequired).toBe(100);
    expect(SKILL_LEVEL_THRESHOLDS[2].level).toBe(3);
    expect(SKILL_LEVEL_THRESHOLDS[2].pointsRequired).toBe(250);
    expect(SKILL_LEVEL_THRESHOLDS[3].level).toBe(4);
    expect(SKILL_LEVEL_THRESHOLDS[3].pointsRequired).toBe(500);
    expect(SKILL_LEVEL_THRESHOLDS[4].level).toBe(5);
    expect(SKILL_LEVEL_THRESHOLDS[4].pointsRequired).toBe(1000);
  });
});

describe("computeEligibleLevel", () => {
  it("returns Level 1 for 0 to 99 points", () => {
    expect(computeEligibleLevel(0)).toBe(1);
    expect(computeEligibleLevel(50)).toBe(1);
    expect(computeEligibleLevel(99)).toBe(1);
  });

  it("returns Level 2 for 100 to 249 points", () => {
    expect(computeEligibleLevel(100)).toBe(2);
    expect(computeEligibleLevel(150)).toBe(2);
    expect(computeEligibleLevel(249)).toBe(2);
  });

  it("returns Level 3 for 250 to 499 points", () => {
    expect(computeEligibleLevel(250)).toBe(3);
    expect(computeEligibleLevel(350)).toBe(3);
    expect(computeEligibleLevel(499)).toBe(3);
  });

  it("returns Level 4 for 500 to 999 points", () => {
    expect(computeEligibleLevel(500)).toBe(4);
    expect(computeEligibleLevel(750)).toBe(4);
    expect(computeEligibleLevel(999)).toBe(4);
  });

  it("returns Level 5 for 1000+ points", () => {
    expect(computeEligibleLevel(1000)).toBe(5);
    expect(computeEligibleLevel(5000)).toBe(5);
  });

  it("handles negative inputs gracefully by falling back to Level 1", () => {
    expect(computeEligibleLevel(-25)).toBe(1);
  });
});

describe("getSkillLevelProgress", () => {
  it("calculates progression toward Level 2 at 0 points", () => {
    const res = getSkillLevelProgress(0);
    expect(res.currentEligibleLevel).toBe(1);
    expect(res.nextLevel).toBe(2);
    expect(res.nextLevelName).toBe("Explorer");
    expect(res.pointsNeeded).toBe(100);
    expect(res.progressPercent).toBe(0);
  });

  it("calculates 50% progression toward Level 2 at 50 points", () => {
    const res = getSkillLevelProgress(50);
    expect(res.currentEligibleLevel).toBe(1);
    expect(res.nextLevel).toBe(2);
    expect(res.pointsNeeded).toBe(50);
    expect(res.progressPercent).toBe(50);
  });

  it("calculates progression toward Level 3 once Level 2 threshold is reached", () => {
    const res = getSkillLevelProgress(100);
    expect(res.currentEligibleLevel).toBe(2);
    expect(res.nextLevel).toBe(3);
    expect(res.nextLevelName).toBe("Builder");
    expect(res.pointsNeeded).toBe(150); // 250 - 100
    expect(res.progressPercent).toBe(0);
  });

  it("calculates partial progression within the Level 2 to Level 3 band", () => {
    // Band: 100 to 250 (150 total span). 175 is 75 into the band (50%)
    const res = getSkillLevelProgress(175);
    expect(res.currentEligibleLevel).toBe(2);
    expect(res.nextLevel).toBe(3);
    expect(res.pointsNeeded).toBe(75);
    expect(res.progressPercent).toBe(50);
  });

  it("handles maximum level (Level 5) with no next level", () => {
    const res = getSkillLevelProgress(1200);
    expect(res.currentEligibleLevel).toBe(5);
    expect(res.nextLevel).toBeNull();
    expect(res.nextLevelName).toBeNull();
    expect(res.pointsNeeded).toBe(0);
    expect(res.progressPercent).toBe(100);
  });
});

describe("Idempotent Lesson Completion Logic", () => {
  interface LessonProgressState {
    completedLessonIds: Set<string>;
    totalSkillPoints: number;
  }

  function simulateCompleteLesson(
    state: LessonProgressState,
    lesson: { id: string; skill_points: number }
  ): { pointsAwarded: number; alreadyCompleted: boolean; newTotalPoints: number } {
    if (state.completedLessonIds.has(lesson.id)) {
      return {
        pointsAwarded: 0,
        alreadyCompleted: true,
        newTotalPoints: state.totalSkillPoints,
      };
    }

    state.completedLessonIds.add(lesson.id);
    state.totalSkillPoints += lesson.skill_points;

    return {
      pointsAwarded: lesson.skill_points,
      alreadyCompleted: false,
      newTotalPoints: state.totalSkillPoints,
    };
  }

  it("awards points on the first completion and zero on duplicate completion", () => {
    const state: LessonProgressState = {
      completedLessonIds: new Set<string>(),
      totalSkillPoints: 0,
    };

    const lessonA = { id: "lesson-1", skill_points: 15 };

    // First completion
    const firstAttempt = simulateCompleteLesson(state, lessonA);
    expect(firstAttempt.pointsAwarded).toBe(15);
    expect(firstAttempt.alreadyCompleted).toBe(false);
    expect(firstAttempt.newTotalPoints).toBe(15);
    expect(state.totalSkillPoints).toBe(15);

    // Second completion (duplicate)
    const secondAttempt = simulateCompleteLesson(state, lessonA);
    expect(secondAttempt.pointsAwarded).toBe(0);
    expect(secondAttempt.alreadyCompleted).toBe(true);
    expect(secondAttempt.newTotalPoints).toBe(15);
    expect(state.totalSkillPoints).toBe(15);

    // Another distinct lesson awards its points
    const lessonB = { id: "lesson-2", skill_points: 20 };
    const thirdAttempt = simulateCompleteLesson(state, lessonB);
    expect(thirdAttempt.pointsAwarded).toBe(20);
    expect(thirdAttempt.alreadyCompleted).toBe(false);
    expect(thirdAttempt.newTotalPoints).toBe(35);
    expect(state.totalSkillPoints).toBe(35);
  });
});

describe("Eligible level label (formatEligibleLevelLabel)", () => {
  it("shows 'Rookie' for 0 points (Level 1)", () => {
    const level = computeEligibleLevel(0);
    const name = getSkillLevelName(level);
    expect(name).toBe("Rookie");
    expect(formatEligibleLevelLabel(level, name)).toBe("Eligible Level: 1 (Rookie)");
  });

  it("shows 'Explorer' for 100 points (Level 2)", () => {
    const level = computeEligibleLevel(100);
    const name = getSkillLevelName(level);
    expect(name).toBe("Explorer");
    expect(formatEligibleLevelLabel(level, name)).toBe("Eligible Level: 2 (Explorer)");
  });

  it("shows 'Builder' for 250 points (Level 3)", () => {
    const level = computeEligibleLevel(250);
    const name = getSkillLevelName(level);
    expect(name).toBe("Builder");
    expect(formatEligibleLevelLabel(level, name)).toBe("Eligible Level: 3 (Builder)");
  });

  it("shows 'Zed Legend' for 1000 points (Level 5)", () => {
    const level = computeEligibleLevel(1000);
    const name = getSkillLevelName(level);
    expect(name).toBe("Zed Legend");
    expect(formatEligibleLevelLabel(level, name)).toBe("Eligible Level: 5 (Zed Legend)");
  });
});

describe("LessonMarkdown component", () => {
  it("renders sample content_md with heading, list items, bold text, and inline code", () => {
    const sampleMd = [
      "### Core Structure",
      "",
      "Recruiters spend a few seconds on a first look. Use **bold labels** and `code_tokens`.",
      "",
      "#### Checklist:",
      "- Action verb + Context + Result",
      "- Proofread carefully",
      "",
      "1. Header section",
      "2. Professional Summary",
    ].join("\n");

    const html = renderToStaticMarkup(
      React.createElement(LessonMarkdown, { content: sampleMd })
    );

    // Headings rendered
    expect(html).toContain("Core Structure");
    expect(html).toContain("<h4");
    expect(html).toContain("Checklist:");
    expect(html).toContain("<h5");

    // Bold text rendered
    expect(html).toContain("<strong");
    expect(html).toContain("bold labels");

    // Inline code rendered in a chip
    expect(html).toContain("<code");
    expect(html).toContain("code_tokens");

    // Unordered and ordered list items rendered
    expect(html).toContain("<ul");
    expect(html).toContain("Action verb + Context + Result");
    expect(html).toContain("Proofread carefully");
    expect(html).toContain("<ol");
    expect(html).toContain("Header section");
    expect(html).toContain("Professional Summary");
  });
});

