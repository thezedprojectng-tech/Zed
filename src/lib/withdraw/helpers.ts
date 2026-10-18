/**
 * Pure helpers for Zed Withdrawals & Token Pricing
 */

/**
 * Masks a bank account number showing only the last 4 digits (e.g. •••• •••• 1234).
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return "•••• •••• ••••";
  const cleaned = accountNumber.replace(/\s+/g, "");
  if (cleaned.length < 4) return "••••";
  const last4 = cleaned.slice(-4);
  return `•••• •••• ${last4}`;
}

/**
 * Calculates the Naira equivalent of a given ZED amount at a specified token price,
 * rounded to 2 decimal places.
 */
export function calculateNairaAmount(amountZed: number, tokenPriceNgn: number): number {
  if (amountZed <= 0 || tokenPriceNgn <= 0) return 0;
  return Math.round(amountZed * tokenPriceNgn * 100) / 100;
}

/**
 * Validates whether a state transition is legal according to business rules:
 * - pending -> approved | rejected | cancelled
 * - approved -> paid | rejected
 * Terminal states (rejected, paid, cancelled) cannot transition further.
 */
export function isAllowedStatusTransition(currentStatus: string, targetStatus: string): boolean {
  if (currentStatus === "pending") {
    return targetStatus === "approved" || targetStatus === "rejected" || targetStatus === "cancelled";
  }
  if (currentStatus === "approved") {
    return targetStatus === "paid" || targetStatus === "rejected";
  }
  return false;
}

/**
 * Maps raw database / RPC errors to clean, safe, user-facing error messages.
 * Never leaks raw SQL or internal details to the client.
 */
export function mapWithdrawalError(rawError?: string | null): string {
  if (!rawError) {
    return "Something went wrong. Please try again.";
  }

  const msg = rawError.toLowerCase();

  if (msg.includes("not authenticated") || msg.includes("unauthorized")) {
    return "Please sign in again.";
  }

  if (msg.includes("not verified") || msg.includes("must be verified")) {
    return "You must verify your NIN before you can withdraw ZED.";
  }

  if (msg.includes("withdrawals are currently disabled")) {
    return "Withdrawals are currently closed. Please check back later.";
  }

  if (msg.includes("token price is not set")) {
    return "Withdrawal rates are currently being updated. Please try again soon.";
  }

  if (msg.includes("minimum level")) {
    return "Your current mining level is not yet eligible to withdraw.";
  }

  if (msg.includes("minimum withdrawal is")) {
    const match = rawError.match(/Minimum withdrawal is ([0-9.]+) ZED/i);
    return match ? `Minimum withdrawal is ${match[1]} ZED.` : "Amount is below the minimum withdrawal limit.";
  }

  if (msg.includes("maximum withdrawal is")) {
    const match = rawError.match(/Maximum withdrawal is ([0-9.]+) ZED/i);
    return match ? `Maximum withdrawal is ${match[1]} ZED.` : "Amount exceeds the maximum withdrawal limit.";
  }

  if (msg.includes("already have a pending")) {
    return "You already have a pending withdrawal request in review.";
  }

  if (msg.includes("insufficient zed balance") || msg.includes("insufficient")) {
    return "Insufficient ZED balance in your wallet.";
  }

  if (msg.includes("10 digits")) {
    return "Account number must be exactly 10 digits.";
  }

  if (msg.includes("only pending withdrawal requests can be cancelled")) {
    return "This withdrawal request can no longer be cancelled.";
  }

  if (msg.includes("cannot review their own")) {
    return "Admins cannot review their own withdrawal request.";
  }

  if (msg.includes("rejection reason")) {
    return "A valid rejection reason of at least 3 characters is required.";
  }

  if (msg.includes("not found")) {
    return "Withdrawal request was not found.";
  }

  return "Could not process withdrawal. Please try again.";
}
