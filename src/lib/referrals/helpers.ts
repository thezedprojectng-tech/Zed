/**
 * Pure helpers for Zed Referrals ("Invite friends")
 */

/**
 * Masks a user's name showing only the first name and last initial (e.g. "Babatunde A.").
 * Never exposes full surname, phone numbers, or emails.
 */
export function maskUserName(fullName?: string | null): string {
  if (!fullName) return "User";
  const trimmed = fullName.trim();
  if (!trimmed) return "User";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0];
  }

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  return `${firstName} ${lastInitial}.`;
}

/**
 * Builds the canonical referral sign-up link for a given code.
 * Matches existing route: /signup?ref=CODE
 */
export function formatReferralLink(codeOrOrigin: string, originOrCode?: string): string {
  let code = codeOrOrigin || "";
  let origin = originOrCode;

  // Handle reversed argument order if caller passes (origin, code)
  if (
    code &&
    (code.startsWith("http://") || code.startsWith("https://")) &&
    originOrCode &&
    !originOrCode.startsWith("http")
  ) {
    origin = codeOrOrigin;
    code = originOrCode;
  }

  const cleanCode = code ? code.trim().toUpperCase() : "";
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) {
    return `/signup?ref=${encodeURIComponent(cleanCode)}`;
  }
  return `${base.replace(/\/+$/, "")}/signup?ref=${encodeURIComponent(cleanCode)}`;
}

/**
 * Creates a pre-filled WhatsApp share URL with the referral message and link.
 * Strictly uses "user" wording, never "citizen".
 */
export function buildWhatsAppShareUrl(linkOrCode: string, codeOrLink?: string): string {
  let link = linkOrCode;
  let code = codeOrLink || "";

  if (linkOrCode && !linkOrCode.startsWith("http") && !linkOrCode.startsWith("/")) {
    // first param was code
    code = linkOrCode;
    link = codeOrLink || formatReferralLink(code);
  } else if (!code && linkOrCode) {
    code = "";
  }

  const message = `Join me on Zed! Use my invite link to create your account and earn bonus ZED points once verified: ${link}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Maps database/RPC referral error codes to safe, friendly user-facing messages.
 */
export function mapReferralError(errorCode?: string | null): string {
  if (!errorCode) {
    return "Something went wrong. Please try again.";
  }

  const code = errorCode.toUpperCase().trim();

  switch (code) {
    case "INVALID_CODE":
      return "Please enter a valid referral code.";
    case "CODE_NOT_FOUND":
      return "This referral code does not exist. Please check and try again.";
    case "SELF_REFERRAL":
      return "You cannot refer your own account.";
    case "ALREADY_REFERRED":
      return "You have already been referred by someone.";
    case "ALREADY_VERIFIED":
      return "Referral codes can only be linked before account verification.";
    case "ACCOUNT_TOO_OLD":
      return "Referral codes must be applied within 7 days of registration.";
    case "NOT_AUTHENTICATED":
      return "Please sign in to apply a referral code.";
    case "USER_NOT_FOUND":
      return "User account could not be found.";
    default:
      if (code.includes("SELF")) return "You cannot refer your own account.";
      if (code.includes("VERIFIED")) return "Referral codes can only be linked before account verification.";
      if (code.includes("ALREADY")) return "You have already been referred by someone.";
      return "Could not apply referral code. Please try again.";
  }
}
