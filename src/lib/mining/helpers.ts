/**
 * Zed Mining – Pure helper functions.
 *
 * ALL functions are pure (no side-effects, no imports from Next.js or Supabase)
 * so they can be tested easily in Vitest with environment:"node".
 */

/**
 * Return today's calendar date in the Africa/Lagos timezone (UTC+1).
 * Used to determine whether a user has already claimed today.
 */
export function getLagosDate(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  // "en-CA" locale produces ISO 8601 YYYY-MM-DD format
}

/**
 * Determine whether two Date instances fall on the same Lagos calendar day.
 */
export function isSameLagosDay(a: Date, b: Date): boolean {
  return getLagosDate(a) === getLagosDate(b);
}

/**
 * Given the last-mined Date and the current Date, calculate the new streak.
 *
 * Rules:
 *  - If lastMined was on the Lagos-calendar day immediately before today → streak + 1
 *  - If lastMined was today (should not reach here in practice) → unchanged
 *  - Otherwise (gap) → reset to 1
 */
export function calculateStreak(lastMined: Date | null, now: Date = new Date()): number {
  if (!lastMined) return 1;

  const todayStr = getLagosDate(now);
  const lastStr = getLagosDate(lastMined);

  if (lastStr === todayStr) {
    // Same day – should be blocked upstream; return unchanged conceptually
    return 0; // sentinel: "already claimed"
  }

  // Build yesterday's Lagos date string
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getLagosDate(yesterday);

  if (lastStr === yesterdayStr) {
    return 1; // caller should add to previous streak
  }

  // Gap: reset
  return 1;
}

/**
 * Return the number of milliseconds until the next Lagos midnight
 * (00:00 Africa/Lagos) from the given `now`.
 *
 * This is used to drive the countdown timer on the mining page.
 */
export function msUntilNextLagosMidnight(now: Date = new Date()): number {
  // Parse today's Lagos date
  const todayStr = getLagosDate(now);
  const [year, month, day] = todayStr.split("-").map(Number);

  // Build "tomorrow 00:00 Lagos" as a UTC instant.
  // Lagos is UTC+1 = 3600s offset.
  // Tomorrow 00:00 Lagos = tomorrow 00:00 + 1h UTC.
  const tomorrowLocal = Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0);
  const lagosOffsetMs = 60 * 60 * 1000; // UTC+1
  const nextMidnightUtc = tomorrowLocal - lagosOffsetMs;

  return Math.max(0, nextMidnightUtc - now.getTime());
}

/**
 * Format milliseconds as HH:MM:SS countdown string.
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
