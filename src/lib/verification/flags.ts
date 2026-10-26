/**
 * Centralised feature flag for public verification badges and verification prompts.
 *
 * When NEXT_PUBLIC_SHOW_VERIFIED_BADGE is not explicitly "true":
 * - VerifiedBadge and "Not verified" tags are hidden across the entire application.
 * - Unverified seller caution dialogs are bypassed on contact reveal.
 * - Dismissible "Get verified" prompt cards are hidden on the dashboard and profile.
 * - Withdrawal pages show "Withdrawals are not open yet" instead of prompting for NIN verification.
 */
export function isVerifiedBadgeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE === "true";
}

/**
 * Determines whether the unverified seller contact warning dialog should display.
 * - flag off = no dialog (reveal contact directly)
 * - flag on + unverified seller = show dialog
 * - verified seller = no dialog
 */
export function shouldShowContactWarning(sellerVerified: boolean): boolean {
  return isVerifiedBadgeEnabled() && !sellerVerified;
}
