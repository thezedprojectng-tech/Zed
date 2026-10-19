import crypto from "crypto";

/**
 * Creates a salted SHA-256 hash of the client IP.
 * The raw IP is never persisted to the database.
 */
export function hashClientIp(ip: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${ip.trim()}`).digest("hex");
}

/**
 * Pure rate limit evaluator for unit tests and server enforcement.
 */
export function checkRateLimits(
  emailCount: number,
  ipCount: number
): { allowed: boolean; reason?: string } {
  if (emailCount >= 3) {
    return {
      allowed: false,
      reason: "Too many submissions from this email address today. Please try again in 24 hours.",
    };
  }
  if (ipCount >= 5) {
    return {
      allowed: false,
      reason: "Too many submissions from your connection today. Please try again in 24 hours.",
    };
  }
  return { allowed: true };
}
