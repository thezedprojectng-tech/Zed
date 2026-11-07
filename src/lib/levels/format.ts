/**
 * Shared formatter for level requirement display.
 * Used by the mining page level ladder and anywhere else requirement
 * descriptions are shown to authenticated users.
 */

import type { RequirementType } from "./validation";

/**
 * Returns a human-readable description of a single requirement.
 * e.g. formatRequirement("mining_days", 14) → "Mine on 14 different days"
 */
export function formatRequirement(type: RequirementType, threshold: number): string {
  switch (type) {
    case "total_mined":
      return `Mine ${threshold.toLocaleString()} ZED in total`;
    case "mining_days":
      return `Mine on ${threshold} different day${threshold === 1 ? "" : "s"}`;
    case "verified_referrals":
      return `Refer ${threshold} verified friend${threshold === 1 ? "" : "s"}`;
    case "completed_courses":
      return `Complete ${threshold} skill course${threshold === 1 ? "" : "s"}`;
    default: {
      // exhaustive check
      const _exhaustive: never = type;
      return String(_exhaustive);
    }
  }
}

