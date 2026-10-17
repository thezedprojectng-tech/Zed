/**
 * Pure error-mapping utilities for Zed Skill actions and RPC responses.
 */

export function mapSkillRpcError(errorMessage?: string | null): string {
  if (!errorMessage) {
    return "Could not complete the lesson. Please try again.";
  }

  const msg = errorMessage.toLowerCase();

  if (msg.includes("not authenticated")) {
    return "Please sign in again.";
  }

  if (msg.includes("not verified")) {
    return "Verify your account to earn skill points.";
  }

  if (msg.includes("lesson not found") || msg.includes("not found")) {
    return "This lesson is no longer available.";
  }

  return "Could not complete the lesson. Please try again.";
}
