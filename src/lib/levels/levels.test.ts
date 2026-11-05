import { describe, it, expect } from "vitest";
import { validateLevelRules } from "./validation";

describe("validateLevelRules", () => {
  it("accepts a valid rules payload", () => {
    const input = [
      { level_id: 2, requirement_type: "total_mined", threshold: 100 },
      { level_id: 2, requirement_type: "mining_days", threshold: 3 },
      { level_id: 3, requirement_type: "verified_referrals", threshold: 2 },
      { level_id: 4, requirement_type: "completed_courses", threshold: 1 },
      { level_id: 5, requirement_type: "total_mined", threshold: 50000.5 },
    ];
    const res = validateLevelRules(input);
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data).toHaveLength(5);
      expect(res.data[0].level_id).toBe(2);
    }
  });

  it("accepts an empty array (all levels locked)", () => {
    const res = validateLevelRules([]);
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data).toEqual([]);
    }
  });

  it("rejects non-array input", () => {
    expect(validateLevelRules(null).valid).toBe(false);
    expect(validateLevelRules({}).valid).toBe(false);
    expect(validateLevelRules("rules").valid).toBe(false);
  });

  it("rejects invalid level_id (less than 2 or greater than 5)", () => {
    const res1 = validateLevelRules([
      { level_id: 1, requirement_type: "total_mined", threshold: 10 },
    ]);
    expect(res1.valid).toBe(false);
    if (!res1.valid) {
      expect(res1.error).toContain("must be an integer between 2 and 5");
    }

    const res2 = validateLevelRules([
      { level_id: 6, requirement_type: "total_mined", threshold: 10 },
    ]);
    expect(res2.valid).toBe(false);

    const res3 = validateLevelRules([
      { level_id: 2.5, requirement_type: "total_mined", threshold: 10 },
    ]);
    expect(res3.valid).toBe(false);
  });

  it("rejects invalid requirement_type", () => {
    const res = validateLevelRules([
      { level_id: 2, requirement_type: "fake_metric", threshold: 10 },
    ]);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("Invalid requirement_type");
    }
  });

  it("rejects negative thresholds", () => {
    const res = validateLevelRules([
      { level_id: 2, requirement_type: "total_mined", threshold: -5 },
    ]);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("must be a finite number greater than 0 and at most 1,000,000,000");
    }
  });

  it("rejects threshold of 0", () => {
    const res = validateLevelRules([
      { level_id: 2, requirement_type: "total_mined", threshold: 0 },
    ]);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("must be a finite number greater than 0 and at most 1,000,000,000");
    }
  });

  it("rejects NaN and Infinity thresholds", () => {
    const res1 = validateLevelRules([
      { level_id: 2, requirement_type: "total_mined", threshold: NaN },
    ]);
    expect(res1.valid).toBe(false);

    const res2 = validateLevelRules([
      { level_id: 2, requirement_type: "total_mined", threshold: Infinity },
    ]);
    expect(res2.valid).toBe(false);
  });

  it("rejects non-integer thresholds for integer-only types", () => {
    const resMiningDays = validateLevelRules([
      { level_id: 2, requirement_type: "mining_days", threshold: 2.5 },
    ]);
    expect(resMiningDays.valid).toBe(false);
    if (!resMiningDays.valid) {
      expect(resMiningDays.error).toContain("must be a whole integer");
    }

    const resReferrals = validateLevelRules([
      { level_id: 3, requirement_type: "verified_referrals", threshold: 1.1 },
    ]);
    expect(resReferrals.valid).toBe(false);

    const resCourses = validateLevelRules([
      { level_id: 4, requirement_type: "completed_courses", threshold: 0.9 },
    ]);
    expect(resCourses.valid).toBe(false);

    // total_mined can have decimals
    const resTotalMined = validateLevelRules([
      { level_id: 2, requirement_type: "total_mined", threshold: 100.5 },
    ]);
    expect(resTotalMined.valid).toBe(true);
  });

  it("rejects duplicate rules for same (level_id, requirement_type)", () => {
    const res = validateLevelRules([
      { level_id: 2, requirement_type: "total_mined", threshold: 100 },
      { level_id: 2, requirement_type: "total_mined", threshold: 200 },
    ]);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("Duplicate rule for Level 2 and requirement total_mined");
    }
  });

  it("rejects payloads exceeding 20 rules", () => {
    const rules = Array.from({ length: 21 }, (_, i) => ({
      level_id: (2 + (i % 4)) as 2 | 3 | 4 | 5,
      requirement_type: "total_mined",
      threshold: i,
    }));
    const res = validateLevelRules(rules);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("Too many rules");
    }
  });
});

