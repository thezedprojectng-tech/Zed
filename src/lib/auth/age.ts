/**
 * Age validation utilities for Zed authentication.
 * Minimum age is strictly 16 years, computed against today's date in Africa/Lagos.
 */

export const MIN_AGE = 16;

export type DobValidationResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "underage" };

/**
 * Returns today's date in Africa/Lagos formatted as 'YYYY-MM-DD'.
 */
export function lagosToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Builds an ISO date string ('YYYY-MM-DD') from year, month, and day.
 * Returns null if the combination does not form a real calendar date
 * (e.g., February 31, or February 29 in a non-leap year).
 */
export function buildDob(
  year: number,
  month: number,
  day: number
): string | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Construct UTC date and verify that parts round-trip identically
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Computes the full years of age on a specific target date (defaulting to today in Lagos).
 * Correctly accounts for leap-day birthdays: a person born Feb 29 turns 16 on Feb 29
 * of the 16th year (which is always a leap year since 16 is divisible by 4).
 */
export function ageOn(dob: string, todayIso: string): number {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ty, tm, td] = todayIso.split("-").map(Number);

  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) {
    age--;
  }
  return age;
}

/**
 * Validates a date of birth against Zed rules:
 * - Must be a valid 'YYYY-MM-DD' calendar date
 * - Year must be 1900 or later
 * - Date cannot be in the future relative to Lagos today
 * - User must be at least MIN_AGE (16) years old today in Lagos
 */
export function validateDob(
  dob: string | null | undefined
): DobValidationResult {
  if (!dob || typeof dob !== "string" || !dob.trim()) {
    return { ok: false, reason: "missing" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return { ok: false, reason: "invalid" };
  }

  const [y, m, d] = dob.split("-").map(Number);
  if (buildDob(y, m, d) !== dob) {
    return { ok: false, reason: "invalid" };
  }

  if (y < 1900) {
    return { ok: false, reason: "invalid" };
  }

  const today = lagosToday();
  if (dob > today) {
    return { ok: false, reason: "invalid" };
  }

  const age = ageOn(dob, today);
  if (age < MIN_AGE) {
    return { ok: false, reason: "underage" };
  }

  return { ok: true };
}
