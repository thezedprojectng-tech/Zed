/**
 * Pure Turnstile error-code utilities.
 *
 * Extracted from actions.ts so they can be imported by tests without
 * pulling in Next.js server-only APIs (revalidatePath, createClient).
 *
 * Cloudflare error-code reference:
 * https://developers.cloudflare.com/turnstile/reference/siteverify-response/
 */

export type TurnstileErrorCode =
  | "TURNSTILE_FAILED"
  | "TURNSTILE_EXPIRED"
  | "TURNSTILE_MISSING";

/**
 * Maps Cloudflare Turnstile `error-codes` to our typed error union.
 *
 * Priority order (first match wins):
 *  1. "timeout-or-duplicate" → TURNSTILE_EXPIRED
 *  2. "missing-input-response" → TURNSTILE_MISSING
 *  3. anything else (or empty array) → TURNSTILE_FAILED
 */
export function mapTurnstileErrorCodes(
  errorCodes: string[]
): TurnstileErrorCode {
  for (const code of errorCodes) {
    if (code === "timeout-or-duplicate") return "TURNSTILE_EXPIRED";
    if (code === "missing-input-response") return "TURNSTILE_MISSING";
  }
  return "TURNSTILE_FAILED";
}
