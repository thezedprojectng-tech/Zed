import type { WithdrawalRequest, WithdrawalStatus } from "./types";

export interface RawWithdrawalRow {
  id: string;
  user_id: string;
  amount_zed: number;
  price_ngn_snapshot: number;
  amount_ngn: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  reject_reason: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface UserLookupInfo {
  id: string;
  full_name?: string | null;
  phone_number?: string | null;
  email?: string | null;
}

/**
 * Pure helpers for Zed Withdrawals & Token Pricing
 */

/**
 * Merges raw withdrawal request rows with user profile information.
 * Ensures rows with missing or failed user lookups are never dropped.
 */
export function mergeWithdrawalsWithUsers(
  requests: RawWithdrawalRow[],
  usersMap: Record<string, UserLookupInfo>
): WithdrawalRequest[] {
  return requests.map((r) => {
    const user = usersMap[r.user_id];
    return {
      id: String(r.id),
      user_id: String(r.user_id),
      amount_zed: Number(r.amount_zed),
      price_ngn_snapshot: Number(r.price_ngn_snapshot),
      amount_ngn: Number(r.amount_ngn),
      bank_name: String(r.bank_name),
      account_number: String(r.account_number),
      account_name: String(r.account_name),
      status: r.status as WithdrawalStatus,
      reject_reason: r.reject_reason ? String(r.reject_reason) : null,
      admin_note: r.admin_note ? String(r.admin_note) : null,
      created_at: String(r.created_at),
      reviewed_at: r.reviewed_at ? String(r.reviewed_at) : null,
      reviewed_by: r.reviewed_by ? String(r.reviewed_by) : null,
      user_name: user?.full_name?.trim() || "Unknown Citizen",
      user_email: user?.phone_number || user?.email || "",
    };
  });
}

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
