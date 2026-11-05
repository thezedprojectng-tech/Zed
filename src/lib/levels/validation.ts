/**
 * Validation for admin-configurable level requirements
 */

export const ALLOWED_REQUIREMENT_TYPES = [
  "total_mined",
  "mining_days",
  "verified_referrals",
  "completed_courses",
] as const;

export type RequirementType = (typeof ALLOWED_REQUIREMENT_TYPES)[number];

export interface LevelRuleInput {
  level_id: number;
  requirement_type: string;
  threshold: number;
}

export interface LevelRule {
  level_id: 2 | 3 | 4 | 5;
  requirement_type: RequirementType;
  threshold: number;
}

export type ValidationResult =
  | { valid: true; data: LevelRule[] }
  | { valid: false; error: string };

export function validateLevelRules(input: unknown): ValidationResult {
  if (!Array.isArray(input)) {
    return { valid: false, error: "Rules must be an array" };
  }

  if (input.length > 20) {
    return { valid: false, error: "Too many rules (maximum 20 allowed)" };
  }

  const seen = new Set<string>();
  const validated: LevelRule[] = [];

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (!item || typeof item !== "object") {
      return { valid: false, error: `Rule at index ${i} must be an object` };
    }

    const { level_id, requirement_type, threshold } = item as Record<
      string,
      unknown
    >;

    // level_id validation (must be 2, 3, 4, or 5)
    if (
      typeof level_id !== "number" ||
      !Number.isInteger(level_id) ||
      level_id < 2 ||
      level_id > 5
    ) {
      return {
        valid: false,
        error: `Invalid level_id at index ${i}: must be an integer between 2 and 5`,
      };
    }

    // requirement_type validation
    if (
      typeof requirement_type !== "string" ||
      !ALLOWED_REQUIREMENT_TYPES.includes(requirement_type as RequirementType)
    ) {
      return {
        valid: false,
        error: `Invalid requirement_type at index ${i}: must be one of ${ALLOWED_REQUIREMENT_TYPES.join(", ")}`,
      };
    }

    // threshold validation
    if (
      typeof threshold !== "number" ||
      !Number.isFinite(threshold) ||
      Number.isNaN(threshold) ||
      threshold <= 0 ||
      threshold > 1_000_000_000
    ) {
      return {
        valid: false,
        error: `Invalid threshold for ${requirement_type} at level ${level_id}: must be a finite number greater than 0 and at most 1,000,000,000`,
      };
    }

    // Integer-only types
    if (
      (requirement_type === "mining_days" ||
        requirement_type === "verified_referrals" ||
        requirement_type === "completed_courses") &&
      !Number.isInteger(threshold)
    ) {
      return {
        valid: false,
        error: `Threshold for ${requirement_type} at level ${level_id} must be a whole integer`,
      };
    }

    // Duplicate check
    const key = `${level_id}:${requirement_type}`;
    if (seen.has(key)) {
      return {
        valid: false,
        error: `Duplicate rule for Level ${level_id} and requirement ${requirement_type}`,
      };
    }
    seen.add(key);

    validated.push({
      level_id: level_id as 2 | 3 | 4 | 5,
      requirement_type: requirement_type as RequirementType,
      threshold,
    });
  }

  return { valid: true, data: validated };
}

