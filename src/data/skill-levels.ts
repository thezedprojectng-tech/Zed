/**
 * Zed Skill – Skill Point Level Thresholds
 *
 * Config-only file defining the point thresholds required for each level.
 *
 * NOTE: Auto-promotion is NOT active in Phase 1 (users are not automatically promoted
 * when crossing thresholds). This file provides `computeEligibleLevel` and
 * `getSkillLevelProgress` so the UI can show progression (e.g. "X points to Level 2")
 * and promotion can be activated in a subsequent release.
 */

export interface SkillLevelThreshold {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  pointsRequired: number;
}

export const SKILL_LEVEL_THRESHOLDS: readonly SkillLevelThreshold[] = [
  { level: 1, name: "Rookie", pointsRequired: 0 },
  { level: 2, name: "Explorer", pointsRequired: 100 },
  { level: 3, name: "Builder", pointsRequired: 250 },
  { level: 4, name: "Pro", pointsRequired: 500 },
  { level: 5, name: "Zed Legend", pointsRequired: 1000 },
] as const;

/**
 * Computes the highest level a user is eligible for based strictly
 * on their earned skill points.
 *
 * @param totalSkillPoints Cumulative skill points earned across all completed lessons.
 * @returns 1 | 2 | 3 | 4 | 5
 */
export function computeEligibleLevel(totalSkillPoints: number): number {
  const points = Math.max(0, Math.floor(totalSkillPoints));

  // Iterate backwards from highest level to lowest
  for (let i = SKILL_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= SKILL_LEVEL_THRESHOLDS[i].pointsRequired) {
      return SKILL_LEVEL_THRESHOLDS[i].level;
    }
  }

  return 1;
}

/**
 * Returns the configured name for a skill level from SKILL_LEVEL_THRESHOLDS.
 */
export function getSkillLevelName(level: number): string {
  const threshold = SKILL_LEVEL_THRESHOLDS.find((t) => t.level === level);
  return threshold?.name ?? `Level ${level}`;
}

/**
 * Formats the eligible level display label, e.g. "Eligible Level: 2 (Explorer)"
 */
export function formatEligibleLevelLabel(level: number, name?: string): string {
  const levelName = name ?? getSkillLevelName(level);
  return `Eligible Level: ${level} (${levelName})`;
}

export interface SkillProgressSummary {
  currentPoints: number;
  currentEligibleLevel: number;
  currentEligibleLevelName: string;
  nextLevel: number | null;
  nextLevelName: string | null;
  pointsNeeded: number;
  nextLevelThreshold: number | null;
  /** Percentage (0-100) toward the next level threshold */
  progressPercent: number;
}

/**
 * Calculates current progress toward the next skill level threshold.
 *
 * @param totalSkillPoints Cumulative skill points earned by the user.
 */
export function getSkillLevelProgress(totalSkillPoints: number): SkillProgressSummary {
  const points = Math.max(0, Math.floor(totalSkillPoints));
  const eligibleLevel = computeEligibleLevel(points);
  const currentEligibleLevelName = getSkillLevelName(eligibleLevel);

  const nextThreshold = SKILL_LEVEL_THRESHOLDS.find(
    (t) => t.level === eligibleLevel + 1
  );

  if (!nextThreshold) {
    // Already at highest level
    return {
      currentPoints: points,
      currentEligibleLevel: eligibleLevel,
      currentEligibleLevelName,
      nextLevel: null,
      nextLevelName: null,
      pointsNeeded: 0,
      nextLevelThreshold: null,
      progressPercent: 100,
    };
  }

  const currentThresholdPoints =
    SKILL_LEVEL_THRESHOLDS.find((t) => t.level === eligibleLevel)
      ?.pointsRequired ?? 0;

  const pointsInBand = points - currentThresholdPoints;
  const bandTotal = nextThreshold.pointsRequired - currentThresholdPoints;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((pointsInBand / bandTotal) * 100))
  );

  return {
    currentPoints: points,
    currentEligibleLevel: eligibleLevel,
    currentEligibleLevelName,
    nextLevel: nextThreshold.level,
    nextLevelName: nextThreshold.name,
    pointsNeeded: Math.max(0, nextThreshold.pointsRequired - points),
    nextLevelThreshold: nextThreshold.pointsRequired,
    progressPercent,
  };
}
