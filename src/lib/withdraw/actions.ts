"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  mapWithdrawalError,
  mergeWithdrawalsWithUsers,
  type RawWithdrawalRow,
  type UserLookupInfo,
} from "./helpers";
import {
  withdrawalRequestSchema,
  adminSettingsSchema,
  adminReviewSchema,
  type WithdrawalRequestInput,
  type AdminSettingsInput,
} from "./validation";
import type {
  PriceHistoryEntry,
  UserWithdrawalOverview,
  WithdrawalRequest,
  WithdrawalStatus,
  ZedSettings,
} from "./types";

const DEFAULT_SETTINGS: ZedSettings = {
  id: 1,
  token_price_ngn: 0,
  withdrawals_enabled: false,
  min_withdraw_zed: 1000,
  max_withdraw_zed: 100000,
  min_level: 1,
  updated_at: new Date().toISOString(),
};

/**
 * Fetch overview data for the current user's withdrawal screen:
 * - Zed settings (price, limits, enabled status)
 * - User balance & level & verification
 * - Active pending request (if any)
 * - Recent withdrawal history
 */
export async function getWithdrawalOverview(): Promise<UserWithdrawalOverview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [settingsRes, profileRes, walletRes, pendingRes, historyRes] =
    await Promise.all([
      supabase
        .from("zed_settings")
        .select("id, token_price_ngn, withdrawals_enabled, min_withdraw_zed, max_withdraw_zed, min_level, updated_at")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("users")
        .select("is_verified, level_id")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("token_wallets")
        .select("balance_zed")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle(),
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const rawSettings = settingsRes.data;
  const settings: ZedSettings = rawSettings
    ? {
        id: rawSettings.id,
        token_price_ngn: Number(rawSettings.token_price_ngn ?? 0),
        withdrawals_enabled: Boolean(rawSettings.withdrawals_enabled),
        min_withdraw_zed: Number(rawSettings.min_withdraw_zed ?? 1000),
        max_withdraw_zed: Number(rawSettings.max_withdraw_zed ?? 100000),
        min_level: Number(rawSettings.min_level ?? 1),
        updated_at: rawSettings.updated_at,
      }
    : DEFAULT_SETTINGS;

  const rawRequests = (historyRes.data ?? []) as Array<Record<string, unknown>>;
  const requests: WithdrawalRequest[] = rawRequests.map((r) => ({
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
  }));

  const pendingRequest = pendingRes.data
    ? ({
        id: String(pendingRes.data.id),
        user_id: String(pendingRes.data.user_id),
        amount_zed: Number(pendingRes.data.amount_zed),
        price_ngn_snapshot: Number(pendingRes.data.price_ngn_snapshot),
        amount_ngn: Number(pendingRes.data.amount_ngn),
        bank_name: String(pendingRes.data.bank_name),
        account_number: String(pendingRes.data.account_number),
        account_name: String(pendingRes.data.account_name),
        status: pendingRes.data.status as WithdrawalStatus,
        reject_reason: pendingRes.data.reject_reason
          ? String(pendingRes.data.reject_reason)
          : null,
        admin_note: pendingRes.data.admin_note
          ? String(pendingRes.data.admin_note)
          : null,
        created_at: String(pendingRes.data.created_at),
        reviewed_at: pendingRes.data.reviewed_at
          ? String(pendingRes.data.reviewed_at)
          : null,
        reviewed_by: pendingRes.data.reviewed_by
          ? String(pendingRes.data.reviewed_by)
          : null,
      } as WithdrawalRequest)
    : null;

  return {
    settings,
    balanceZed: Number(walletRes.data?.balance_zed ?? 0),
    userLevel: Number(profileRes.data?.level_id ?? 1),
    isVerified: Boolean(profileRes.data?.is_verified),
    pendingRequest,
    requests,
  };
}

/**
 * Server action: User requests a withdrawal of ZED to bank account.
 * Deducts ZED atomically, saves snapshot price, and creates pending request.
 */
export async function requestWithdrawalAction(
  input: WithdrawalRequestInput
): Promise<
  | {
      ok: true;
      data: {
        request_id: string;
        new_balance: number;
        amount_ngn: number;
      };
    }
  | {
      ok: false;
      error: string;
    }
> {
  const parsed = withdrawalRequestSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid withdrawal request.";
    return { ok: false, error: errorMsg };
  }

  const { amount_zed, bank_name, account_number, account_name } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const { data, error } = await supabase.rpc("request_withdrawal", {
    p_amount: amount_zed,
    p_bank_name: bank_name,
    p_account_number: account_number,
    p_account_name: account_name,
  });

  if (error) {
    // Note: NEVER log account numbers or sensitive credentials
    console.error("[Withdrawal] request_withdrawal RPC error:", error.message);
    return { ok: false, error: mapWithdrawalError(error.message) };
  }

  const result = data as {
    ok?: boolean;
    error?: string;
    request_id?: string;
    new_balance?: number;
    amount_ngn?: number;
  };

  if (!result || result.ok === false) {
    return { ok: false, error: mapWithdrawalError(result?.error) };
  }

  revalidatePath("/mining");
  revalidatePath("/mining/withdraw");

  return {
    ok: true,
    data: {
      request_id: String(result.request_id),
      new_balance: Number(result.new_balance ?? 0),
      amount_ngn: Number(result.amount_ngn ?? 0),
    },
  };
}

/**
 * Server action: User cancels a pending withdrawal request.
 * Atomically refunds the held ZED back to user's wallet.
 */
export async function cancelWithdrawalAction(
  requestId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!requestId || typeof requestId !== "string") {
    return { ok: false, error: "Invalid request ID." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in again." };
  }

  const { data, error } = await supabase.rpc("cancel_withdrawal", {
    p_id: requestId,
  });

  if (error) {
    console.error("[Withdrawal] cancel_withdrawal RPC error:", error.message);
    return { ok: false, error: mapWithdrawalError(error.message) };
  }

  const result = data as { ok?: boolean; error?: string };
  if (!result || result.ok === false) {
    return { ok: false, error: mapWithdrawalError(result?.error) };
  }

  revalidatePath("/mining");
  revalidatePath("/mining/withdraw");

  return { ok: true };
}

/**
 * Admin check helper
 */
async function verifyAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, authorized: false as const, user: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { supabase, authorized: false as const, user };
  }

  return { supabase, authorized: true as const, user };
}

/**
 * Admin: Get all withdrawal requests, optionally filtered by status
 */
export async function adminGetWithdrawals(statusFilter?: string) {
  const { supabase, authorized } = await verifyAdminSession();
  if (!authorized) {
    return { ok: false as const, error: "Unauthorized access" };
  }

  // 1. Fetch withdrawal_requests without embedding users directly
  let query = supabase
    .from("withdrawal_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: requestsData, error: requestsError } = await query;

  if (requestsError) {
    console.error("[Admin] adminGetWithdrawals error:", requestsError.message);
    return {
      ok: false as const,
      error: requestsError.message || "Failed to fetch withdrawal requests",
    };
  }

  const rawRows = (requestsData ?? []) as RawWithdrawalRow[];
  const userIds = Array.from(
    new Set(rawRows.map((r) => r.user_id).filter(Boolean))
  );
  const usersMap: Record<string, UserLookupInfo> = {};

  // 2. Fetch matching users in a second query so a profile lookup issue never drops records
  if (userIds.length > 0) {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, phone_number")
      .in("id", userIds);

    if (usersError) {
      console.warn(
        "[Admin] adminGetWithdrawals user lookup warning:",
        usersError.message
      );
    } else {
      for (const u of (usersData ?? []) as Array<{
        id: string;
        full_name?: string | null;
        phone_number?: string | null;
      }>) {
        usersMap[u.id] = {
          id: u.id,
          full_name: u.full_name,
          phone_number: u.phone_number,
        };
      }
    }
  }

  const list = mergeWithdrawalsWithUsers(rawRows, usersMap);

  return { ok: true as const, data: list };
}

/**
 * Admin: Review withdrawal request (approved | rejected | paid)
 */
export async function adminReviewWithdrawalAction(
  requestId: string,
  decision: "approved" | "rejected" | "paid",
  note?: string,
  rejectReason?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, authorized } = await verifyAdminSession();
  if (!authorized) {
    return { ok: false, error: "Unauthorized access" };
  }

  const parsed = adminReviewSchema.safeParse({
    decision,
    note,
    reject_reason: rejectReason,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid review inputs." };
  }

  const { error } = await supabase.rpc("admin_review_withdrawal", {
    p_id: requestId,
    p_decision: decision,
    p_note: note || null,
    p_reject_reason: rejectReason || null,
  });

  if (error) {
    console.error("[Admin] admin_review_withdrawal error:", error.message);
    return { ok: false, error: mapWithdrawalError(error.message) };
  }

  revalidatePath("/admin/withdrawals");
  revalidatePath("/mining/withdraw");

  return { ok: true };
}

/**
 * Admin: Get Zed settings and price history
 */
export async function adminGetZedSettings(): Promise<
  | {
      ok: true;
      settings: ZedSettings;
      history: PriceHistoryEntry[];
    }
  | {
      ok: false;
      error: string;
    }
> {
  const { supabase, authorized } = await verifyAdminSession();
  if (!authorized) {
    return { ok: false, error: "Unauthorized access" };
  }

  const [settingsRes, historyRes] = await Promise.all([
    supabase.from("zed_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("zed_price_history")
      .select(`
        id,
        price_ngn,
        set_by,
        set_at,
        users (
          full_name
        )
      `)
      .order("set_at", { ascending: false })
      .limit(50),
  ]);

  if (settingsRes.error) {
    return { ok: false, error: "Failed to load settings." };
  }

  const rawSettings = settingsRes.data;
  const settings: ZedSettings = rawSettings
    ? {
        id: rawSettings.id,
        token_price_ngn: Number(rawSettings.token_price_ngn ?? 0),
        withdrawals_enabled: Boolean(rawSettings.withdrawals_enabled),
        min_withdraw_zed: Number(rawSettings.min_withdraw_zed ?? 1000),
        max_withdraw_zed: Number(rawSettings.max_withdraw_zed ?? 100000),
        min_level: Number(rawSettings.min_level ?? 1),
        updated_at: rawSettings.updated_at,
      }
    : DEFAULT_SETTINGS;

  const history = ((historyRes.data ?? []) as Array<Record<string, unknown>>).map((h) => {
    const userObj = h.users as { full_name?: string } | null;
    return {
      id: Number(h.id),
      price_ngn: Number(h.price_ngn),
      set_by: h.set_by ? String(h.set_by) : null,
      set_at: String(h.set_at),
      setter_name: userObj?.full_name || "Admin",
    };
  });

  return { ok: true, settings, history };
}

/**
 * Admin: Update ZED token settings (token price, min/max limits, enabled toggle, min level)
 */
export async function adminUpdateZedSettingsAction(
  input: AdminSettingsInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, authorized } = await verifyAdminSession();
  if (!authorized) {
    return { ok: false, error: "Unauthorized access" };
  }

  const parsed = adminSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid settings input." };
  }

  const {
    token_price_ngn,
    withdrawals_enabled,
    min_withdraw_zed,
    max_withdraw_zed,
    min_level,
  } = parsed.data;

  const { error } = await supabase.rpc("admin_update_zed_settings", {
    p_token_price_ngn: token_price_ngn,
    p_withdrawals_enabled: withdrawals_enabled,
    p_min_withdraw_zed: min_withdraw_zed,
    p_max_withdraw_zed: max_withdraw_zed,
    p_min_level: min_level,
  });

  if (error) {
    console.error("[Admin] admin_update_zed_settings error:", error.message);
    return { ok: false, error: mapWithdrawalError(error.message) };
  }

  revalidatePath("/admin/settings/zed");
  revalidatePath("/mining/withdraw");
  revalidatePath("/mining");

  return { ok: true };
}
