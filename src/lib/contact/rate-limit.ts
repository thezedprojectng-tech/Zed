import crypto from "crypto";

/**
 * Creates a salted SHA-256 hash of the client IP.
 * The raw IP is never persisted to the database.
 */
export function hashClientIp(ip: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${ip.trim()}`).digest("hex");
}

/**
 * Pure rate limit evaluator for contact submissions.
 * Limits: 5 per hour per IP hash, and 20 per day.
 */
export function checkContactRateLimits(
  hourlyCount: number,
  dailyCount: number
): { allowed: boolean; reason?: string } {
  if (hourlyCount >= 5) {
    return {
      allowed: false,
      reason: "Too many messages sent recently. Please wait an hour before submitting again.",
    };
  }
  if (dailyCount >= 20) {
    return {
      allowed: false,
      reason: "Daily contact submission limit reached. Please try again tomorrow or email us directly.",
    };
  }
  return { allowed: true };
}
