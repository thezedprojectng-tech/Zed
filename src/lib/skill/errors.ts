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

  if (msg.includes("lesson not found") || msg.includes("not found")) {
    return "This lesson is no longer available.";
  }

  // Preserve readable time-gate, quiz-gate, and progression errors raised by complete_lesson
  if (
    msg.includes("quiz") ||
    msg.includes("pass") ||
    msg.includes("second") ||
    msg.includes("minute") ||
    /\btime\b/.test(msg) ||
    msg.includes("remaining") ||
    msg.includes("wait") ||
    msg.includes("unlock") ||
    msg.includes("previous") ||
    msg.includes("attempt")
  ) {
    return errorMessage;
  }

  return "Could not complete the lesson. Please try again.";
}
