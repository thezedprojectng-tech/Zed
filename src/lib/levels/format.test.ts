import { describe, it, expect } from "vitest";
import { formatRequirement } from "./format";

describe("formatRequirement", () => {
  it("formats total_mined with locale number", () => {
    expect(formatRequirement("total_mined", 500)).toBe("Mine 500 ZED in total");
    expect(formatRequirement("total_mined", 10000)).toBe("Mine 10,000 ZED in total");
  });

  it("formats mining_days with singular/plural", () => {
    expect(formatRequirement("mining_days", 1)).toBe("Mine on 1 different day");
    expect(formatRequirement("mining_days", 14)).toBe("Mine on 14 different days");
  });

  it("formats verified_referrals with singular/plural", () => {
    expect(formatRequirement("verified_referrals", 1)).toBe("Refer 1 verified friend");
    expect(formatRequirement("verified_referrals", 3)).toBe("Refer 3 verified friends");
  });

  it("formats completed_courses with singular/plural", () => {
    expect(formatRequirement("completed_courses", 1)).toBe("Complete 1 skill course");
    expect(formatRequirement("completed_courses", 2)).toBe("Complete 2 skill courses");
  });
});

