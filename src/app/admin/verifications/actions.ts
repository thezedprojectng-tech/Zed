"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  adminReviewBankVerificationSchema,
  type AdminReviewBankVerificationInput,
} from "@/lib/verification/validation";

export interface AdminVerificationRow {
  id: string;
  user_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile_full_name: string | null;
  user_email: string | null;
  user_phone: string | null;
}

/**
 * Fetch bank verifications for admin queue.
 * Pending items are returned oldest-first (FIFO queue).
 */
export async function adminGetBankVerifications(
  statusFilter: "pending" | "all" = "all"
): Promise<{ ok: true; data: AdminVerificationRow[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    let query = admin
      .from("bank_verifications")
      .select("*");

    if (statusFilter === "pending") {
      // Pending queue oldest first
      query = query.eq("status", "pending").order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: rawRows, error } = await query;
    if (error) {
      console.error("[Admin] adminGetBankVerifications error:", {
        code: error.code,
        message: error.message,
      });
      return { ok: false, error: error.message };
    }

    const rows = rawRows ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));

    const usersMap: Record<
      string,
      { full_name: string | null; phone_number: string | null; email: string | null }
    > = {};

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await admin
        .from("users")
        .select("id, full_name, phone_number")
        .in("id", userIds);

      if (usersError) {
        console.error("[Admin] adminGetBankVerifications users query error:", {
          code: usersError.code,
          message: usersError.message,
        });
        return { ok: false, error: usersError.message || "Failed to load user profiles" };
      }

      // Fetch emails for each unique user via Auth Admin API
      const emailMap: Record<string, string | null> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(uid);
            if (!authErr && authUser?.user?.email) {
              emailMap[uid] = authUser.user.email;
            } else {
              emailMap[uid] = null;
            }
          } catch {
            emailMap[uid] = null;
          }
        })
      );

      for (const u of usersData ?? []) {
        usersMap[u.id] = {
          full_name: u.full_name ?? null,
          phone_number: u.phone_number ?? null,
          email: emailMap[u.id] ?? null,
        };
      }
    }

    const formatted: AdminVerificationRow[] = rows.map((r) => {
      const u = usersMap[r.user_id];
      return {
        id: r.id,
        user_id: r.user_id,
        bank_code: r.bank_code,
        bank_name: r.bank_name,
        account_number: r.account_number,
        account_name: r.account_name,
        status: r.status as "pending" | "approved" | "rejected",
        reject_reason: r.reject_reason,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
        profile_full_name: u?.full_name ?? null,
        user_email: u?.email ?? null,
        user_phone: u?.phone_number ?? null,
      };
    });

    return { ok: true, data: formatted };
  } catch (err) {
    console.error("[Admin] adminGetBankVerifications unexpected error");
    return {
      ok: false,
      error: "Failed to load bank verifications",
    };
  }
}

/**
 * Review bank verification (Approve or Reject with reason)
 */
export async function adminReviewBankVerificationAction(
  rawInput: unknown
): Promise<{ ok: true; status: "approved" | "rejected" } | { ok: false; error: string }> {
  try {
    await requireAdmin();

    const parsed = adminReviewBankVerificationSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return { ok: false, error: firstError };
    }

    const { verification_id, approve, reason } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_review_bank_verification", {
      p_verification_id: verification_id,
      p_approve: approve,
      p_reason: approve ? null : reason?.trim(),
    });

    if (error) {
      console.error("[Admin] admin_review_bank_verification RPC error:", {
        code: error.code,
        message: error.message,
      });
      return { ok: false, error: error.message };
    }

    const res = data as { ok: boolean; reason?: string; status?: "approved" | "rejected" } | null;

    if (!res || !res.ok) {
      const msg = res?.reason ? `Review failed: ${res.reason}` : "Review failed";
      return { ok: false, error: msg };
    }

    revalidatePath("/admin/verifications");
    revalidatePath("/verify");

    return { ok: true, status: res.status ?? (approve ? "approved" : "rejected") };
  } catch (err) {
    console.error("[Admin] adminReviewBankVerificationAction unexpected error");
    return {
      ok: false,
      error: "Failed to review verification",
    };
  }
}

