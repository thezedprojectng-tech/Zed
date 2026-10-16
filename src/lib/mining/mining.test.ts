import { describe, it, expect } from "vitest";
import { MINING_LEVELS, MINING_LEVEL_MAP, getDailyClaimAmount } from "@/data/levels";
import {
  getLagosDate,
  isSameLagosDay,
  calculateStreak,
  msUntilNextLagosMidnight,
  formatCountdown,
} from "@/lib/mining/helpers";

// ─── Level Matrix ─────────────────────────────────────────────────────────────

describe("MINING_LEVELS matrix", () => {
  it("has exactly 5 levels", () => {
    expect(MINING_LEVELS).toHaveLength(5);
  });

  it("has the exact spec names: Rookie, Explorer, Builder, Pro, Zed Legend", () => {
    expect(MINING_LEVEL_MAP[1].name).toBe("Rookie");
    expect(MINING_LEVEL_MAP[2].name).toBe("Explorer");
    expect(MINING_LEVEL_MAP[3].name).toBe("Builder");
    expect(MINING_LEVEL_MAP[4].name).toBe("Pro");
    expect(MINING_LEVEL_MAP[5].name).toBe("Zed Legend");
  });

  it("does not include Pioneer or Ambassador", () => {
    const names = MINING_LEVELS.map((l) => l.name.toLowerCase());
    expect(names.some((n) => n.includes("pioneer"))).toBe(false);
    expect(names.some((n) => n.includes("ambassador"))).toBe(false);
  });

  it("has the correct multipliers", () => {
    expect(MINING_LEVEL_MAP[1].multiplier).toBe(1.0);
    expect(MINING_LEVEL_MAP[2].multiplier).toBe(2.0);
    expect(MINING_LEVEL_MAP[3].multiplier).toBe(3.5);
    expect(MINING_LEVEL_MAP[4].multiplier).toBe(5.0);
    expect(MINING_LEVEL_MAP[5].multiplier).toBe(10.0);
  });

  it("has the correct daily caps", () => {
    expect(MINING_LEVEL_MAP[1].dailyCap).toBe(100);
    expect(MINING_LEVEL_MAP[2].dailyCap).toBe(200);
    expect(MINING_LEVEL_MAP[3].dailyCap).toBe(350);
    expect(MINING_LEVEL_MAP[4].dailyCap).toBe(500);
    expect(MINING_LEVEL_MAP[5].dailyCap).toBe(1000);
  });

  it("has the exact unlock criteria for levels 2-5", () => {
    expect(MINING_LEVEL_MAP[2].unlockCriteria).toBe(
      "Complete 1 Skill course OR refer 3 verified friends"
    );
    expect(MINING_LEVEL_MAP[3].unlockCriteria).toBe(
      "Complete 3 courses + post 2 active community threads"
    );
    expect(MINING_LEVEL_MAP[4].unlockCriteria).toBe(
      "Complete 1 freelance gig OR buy Zed Pass"
    );
    expect(MINING_LEVEL_MAP[5].unlockCriteria).toBe(
      "Top 1% monthly active user / vetted community mentor"
    );
  });

  it("daily_claim = 100 * multiplier for each level", () => {
    for (const level of MINING_LEVELS) {
      expect(getDailyClaimAmount(level.id)).toBeCloseTo(
        100 * level.multiplier,
        2
      );
    }
  });

  it("levels 2-5 are locked with no self-promotion", () => {
    expect(MINING_LEVEL_MAP[1].locked).toBe(false);
    expect(MINING_LEVEL_MAP[2].locked).toBe(true);
    expect(MINING_LEVEL_MAP[3].locked).toBe(true);
    expect(MINING_LEVEL_MAP[4].locked).toBe(true);
    expect(MINING_LEVEL_MAP[5].locked).toBe(true);
  });

  it("getDailyClaimAmount falls back to Rookie for unknown level", () => {
    expect(getDailyClaimAmount(99)).toBe(100);
  });
});

// ─── Lagos date helpers ───────────────────────────────────────────────────────

describe("getLagosDate", () => {
  it("returns ISO-format date string", () => {
    const d = new Date("2024-01-15T10:00:00Z");
    const result = getLagosDate(d);
    // Lagos is UTC+1, so 10:00 UTC = 11:00 Lagos → still 2024-01-15
    expect(result).toBe("2024-01-15");
  });

  it("handles UTC/Lagos midnight boundary correctly – 23:30 UTC = 00:30 WAT", () => {
    // 23:30 UTC on Jan 14 = 00:30 WAT on Jan 15
    const d = new Date("2024-01-14T23:30:00Z");
    const result = getLagosDate(d);
    expect(result).toBe("2024-01-15");
  });

  it("22:00 UTC and 23:30 UTC are on different Lagos days (23:30 UTC = 00:30 WAT next day)", () => {
    // 22:00 UTC Jan 14 = 23:00 WAT Jan 14 → same Lagos day
    // 23:30 UTC Jan 14 = 00:30 WAT Jan 15 → NEXT Lagos day
    const a = new Date("2024-01-14T22:00:00Z");
    const b = new Date("2024-01-14T23:30:00Z");
    expect(getLagosDate(a)).toBe("2024-01-14");
    expect(getLagosDate(b)).toBe("2024-01-15");
  });
});

describe("isSameLagosDay", () => {
  it("returns true for same Lagos day across UTC midnight", () => {
    // 23:30 UTC Jan 14 and 00:30 UTC Jan 15 are both Jan 15 in Lagos
    const a = new Date("2024-01-14T23:30:00Z"); // 00:30 WAT Jan 15
    const b = new Date("2024-01-15T00:30:00Z"); // 01:30 WAT Jan 15
    expect(isSameLagosDay(a, b)).toBe(true);
  });

  it("returns false for different Lagos days", () => {
    const a = new Date("2024-01-14T00:00:00Z"); // 01:00 WAT Jan 14
    const b = new Date("2024-01-15T00:00:00Z"); // 01:00 WAT Jan 15
    expect(isSameLagosDay(a, b)).toBe(false);
  });
});

// ─── Streak calculation ───────────────────────────────────────────────────────

describe("calculateStreak", () => {
  it("returns 1 for first-ever claim (null lastMined)", () => {
    const now = new Date("2024-03-10T10:00:00Z");
    expect(calculateStreak(null, now)).toBe(1);
  });

  it("returns 1 for consecutive claim (caller should add to existing streak)", () => {
    // lastMined was yesterday Lagos time
    const lastMined = new Date("2024-03-09T12:00:00Z");
    const now = new Date("2024-03-10T12:00:00Z");
    expect(calculateStreak(lastMined, now)).toBe(1);
  });

  it("resets streak to 1 when there is a gap (>1 day)", () => {
    const lastMined = new Date("2024-03-07T12:00:00Z");
    const now = new Date("2024-03-10T12:00:00Z");
    expect(calculateStreak(lastMined, now)).toBe(1);
  });

  it("returns 0 sentinel when lastMined is today (already claimed)", () => {
    const now = new Date("2024-03-10T12:00:00Z");
    const lastMined = new Date("2024-03-10T10:00:00Z");
    expect(calculateStreak(lastMined, now)).toBe(0);
  });
});

// ─── Countdown to next Lagos midnight ────────────────────────────────────────

describe("msUntilNextLagosMidnight", () => {
  it("returns a positive number of milliseconds", () => {
    const ms = msUntilNextLagosMidnight(new Date());
    expect(ms).toBeGreaterThan(0);
  });

  it("returns < 24h worth of ms", () => {
    const ms = msUntilNextLagosMidnight(new Date());
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it("returns near-zero ms just before midnight Lagos", () => {
    // 22:59:59 UTC = 23:59:59 WAT (1 second before midnight Lagos)
    const d = new Date("2024-03-10T22:59:59Z");
    const ms = msUntilNextLagosMidnight(d);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThan(2000); // less than 2 seconds
  });
});

describe("formatCountdown", () => {
  it("formats zero as 00:00:00", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
  });

  it("formats 1 hour 2 minutes 3 seconds correctly", () => {
    const ms = (1 * 3600 + 2 * 60 + 3) * 1000;
    expect(formatCountdown(ms)).toBe("01:02:03");
  });

  it("formats exactly 23:59:59", () => {
    const ms = (23 * 3600 + 59 * 60 + 59) * 1000;
    expect(formatCountdown(ms)).toBe("23:59:59");
  });
});
