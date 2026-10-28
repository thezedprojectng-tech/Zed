import crypto from "crypto";

/**
 * Creates a salted SHA-256 hash of the client IP.
 * The raw IP is never persisted to the database.
 * If no IP is detected, fallback to hashing "unknown" so ip_hash is never null.
 */
export function hashClientIp(ip: string | null | undefined, salt: string): string {
  const normalized = ip && ip.trim().length > 0 ? ip.trim() : "unknown";
  return crypto.createHash("sha256").update(`${salt}:${normalized}`).digest("hex");
}

/**
 * Pure rate limit evaluator for Campus Ambassador applications.
 * Limits: 10 per hour per IP hash, and 40 per day (tuned for shared campus Wi-Fi).
 */
export function checkAmbassadorRateLimits(
  hourlyCount: number,
  dailyCount: number
): { allowed: boolean; reason?: string } {
  if (hourlyCount >= 10) {
    return {
      allowed: false,
      reason: "Too many applications submitted recently from this network. Please wait an hour before submitting again.",
    };
  }
  if (dailyCount >= 40) {
    return {
      allowed: false,
      reason: "Daily application limit reached for this network. Please try again tomorrow.",
    };
  }
  return { allowed: true };
}

