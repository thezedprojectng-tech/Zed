/**
 * NIN Hashing – SERVER ONLY.
 *
 * SECURITY CONTRACT:
 *  - The raw NIN is NEVER stored, logged, or returned by any function here.
 *  - Only the salted SHA-256 hex digest is persisted to the database.
 *  - Salt is read from the NIN_HASH_SALT environment variable at runtime.
 */

import { createHash } from "crypto";

function getSalt(): string {
  const salt = process.env.NIN_HASH_SALT;
  if (!salt || salt.length < 32) {
    throw new Error(
      "[nin/hash] NIN_HASH_SALT env var is missing or too short (min 32 chars)"
    );
  }
  return salt;
}

/**
 * Returns a salted SHA-256 hex digest for the given NIN.
 * @param nin - The raw 11-digit NIN. Must not be logged by the caller.
 */
export function hashNin(nin: string): string {
  const salt = getSalt();
  return createHash("sha256").update(salt + nin).digest("hex");
}
