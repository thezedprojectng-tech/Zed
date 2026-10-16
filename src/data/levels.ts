/**
 * Zed Mining – Level Matrix
 *
 * SINGLE SOURCE OF TRUTH used by:
 *  - DB migration 0006_zed_mining.sql (mirrors values and rules)
 *  - The /mining UI (level ladder, current level display)
 *  - Vitest unit tests (src/lib/mining/mining.test.ts)
 *
 * Rules:
 *  1 Rookie     : x1.0,  claim 100,  cap 100  (account + verified)
 *  2 Explorer   : x2.0,  claim 200,  cap 200  (complete 1 Skill course OR refer 3 verified friends)
 *  3 Builder    : x3.5,  claim 350,  cap 350  (complete 3 courses + post 2 active community threads)
 *  4 Pro        : x5.0,  claim 500,  cap 500  (complete 1 freelance gig OR buy Zed Pass)
 *  5 Zed Legend : x10.0, claim 1000, cap 1000 (top 1% monthly active user / vetted community mentor)
 *
 * Daily claim = 100 * multiplier.
 * Levels 2-5 stay locked in this phase (no way to self-promote).
 * $ZED has NO cash value in this version.
 */

export interface MiningLevel {
  /** 1-5 level identifier, matches public.users.level_id */
  id: 1 | 2 | 3 | 4 | 5;
  /** Display name */
  name: string;
  /** Mining multiplier applied to the base 100-point daily claim */
  multiplier: number;
  /** Maximum $ZED claimable per Lagos-calendar day */
  dailyCap: number;
  /** Human-readable unlock criteria shown in the UI */
  unlockCriteria: string;
  /** Whether this level is currently unlockable. Levels 2-5 are locked. */
  locked: boolean;
}

export const MINING_LEVELS: readonly MiningLevel[] = [
  {
    id: 1,
    name: "Rookie",
    multiplier: 1.0,
    dailyCap: 100,
    unlockCriteria: "Account + verified",
    locked: false,
  },
  {
    id: 2,
    name: "Explorer",
    multiplier: 2.0,
    dailyCap: 200,
    unlockCriteria: "Complete 1 Skill course OR refer 3 verified friends",
    locked: true,
  },
  {
    id: 3,
    name: "Builder",
    multiplier: 3.5,
    dailyCap: 350,
    unlockCriteria: "Complete 3 courses + post 2 active community threads",
    locked: true,
  },
  {
    id: 4,
    name: "Pro",
    multiplier: 5.0,
    dailyCap: 500,
    unlockCriteria: "Complete 1 freelance gig OR buy Zed Pass",
    locked: true,
  },
  {
    id: 5,
    name: "Zed Legend",
    multiplier: 10.0,
    dailyCap: 1000,
    unlockCriteria: "Top 1% monthly active user / vetted community mentor",
    locked: true,
  },
] as const;

/** Lookup by level id (1-5). */
export const MINING_LEVEL_MAP = Object.fromEntries(
  MINING_LEVELS.map((l) => [l.id, l])
) as Record<1 | 2 | 3 | 4 | 5, MiningLevel>;

/**
 * Calculate the daily claim amount for a given level id.
 * daily_claim = 100 * multiplier
 */
export function getDailyClaimAmount(levelId: number): number {
  const level =
    MINING_LEVEL_MAP[levelId as 1 | 2 | 3 | 4 | 5] ?? MINING_LEVEL_MAP[1];
  return Math.round(100 * level.multiplier * 100) / 100;
}
