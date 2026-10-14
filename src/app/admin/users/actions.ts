"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit/log";
import { getLevelName } from "@/types";

/**
 * Server action: Delete a user using Supabase Auth Admin.
 *
 * Safeguards:
 * 1. Admin authentication required.
 * 2. Cannot delete yourself.
 * 3. Cannot delete other admins.
 * 4. Must match the user's email typed in the confirmation prompt.
 * 5. Cascades to public.users and nav_progress via foreign keys.
 * 6. Logs action to public.admin_audit_log.
 */
export async function deleteUserAction(
  targetUserId: string,
  confirmEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentAdminId = await requireAdmin();

    if (!targetUserId || !confirmEmail) {
      return { success: false, error: "Missing required parameters." };
    }

    if (targetUserId === currentAdminId) {
      return { success: false, error: "Security restriction: You cannot delete your own account." };
    }

    const admin = createAdminClient();

    // 1. Verify target user profile and ensure target is not an admin
    const { data: targetProfile, error: profileErr } = await admin
      .from("users")
      .select("id, full_name, role, phone_number")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileErr || !targetProfile) {
      return { success: false, error: "User not found." };
    }

    if (targetProfile.role === "admin") {
      return { success: false, error: "Security restriction: Cannot delete an administrator account." };
    }

    // 2. Fetch the target user's auth record to verify email match
    const { data: authUser, error: authGetErr } = await admin.auth.admin.getUserById(targetUserId);

    if (authGetErr || !authUser?.user) {
      return { success: false, error: "Could not retrieve user auth record." };
    }

    const actualEmail = authUser.user.email?.toLowerCase().trim() || "";
    const typedEmail = confirmEmail.toLowerCase().trim();

    if (actualEmail !== typedEmail) {
      return {
        success: false,
        error: `Confirmation email does not match. Expected "${actualEmail}".`,
      };
    }

    // 3. Delete via auth.admin (cascades to public.users and nav_progress)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(targetUserId);

    if (deleteErr) {
      console.error("[deleteUserAction] Supabase error:", deleteErr.message);
      return { success: false, error: `Failed to delete user: ${deleteErr.message}` };
    }

    // 4. Log to admin audit log
    await logAdminAction({
      adminId: currentAdminId,
      action: "user.delete",
      targetType: "user",
      targetId: targetUserId,
      metadata: {
        deleted_email: actualEmail,
        deleted_name: targetProfile.full_name,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[deleteUserAction] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred while deleting user." };
  }
}

/**
 * Server action: Change user role ('user' | 'admin').
 *
 * Safeguards:
 * 1. Admin authentication required.
 * 2. Cannot demote yourself.
 * 3. Cannot remove the last remaining admin on the platform.
 * 4. Logs action to public.admin_audit_log.
 */
export async function changeUserRoleAction(
  targetUserId: string,
  newRole: "user" | "admin"
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentAdminId = await requireAdmin();

    if (!targetUserId || (newRole !== "user" && newRole !== "admin")) {
      return { success: false, error: "Invalid role specified." };
    }

    if (targetUserId === currentAdminId && newRole !== "admin") {
      return { success: false, error: "Security restriction: You cannot demote yourself from admin." };
    }

    const admin = createAdminClient();

    // Check target profile
    const { data: targetProfile, error: profileErr } = await admin
      .from("users")
      .select("id, full_name, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileErr || !targetProfile) {
      return { success: false, error: "User not found." };
    }

    // If demoting an admin, ensure at least one other admin remains
    if (targetProfile.role === "admin" && newRole === "user") {
      const { count: adminCount } = await admin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if ((adminCount ?? 0) <= 1) {
        return {
          success: false,
          error: "Security restriction: Cannot remove the last remaining administrator.",
        };
      }
    }

    // Update role
    const { error: updateErr } = await admin
      .from("users")
      .update({ role: newRole })
      .eq("id", targetUserId);

    if (updateErr) {
      console.error("[changeUserRoleAction] Update error:", updateErr.message);
      return { success: false, error: `Failed to update role: ${updateErr.message}` };
    }

    // Write to audit log
    await logAdminAction({
      adminId: currentAdminId,
      action: "user.role_change",
      targetType: "user",
      targetId: targetUserId,
      metadata: {
        previous_role: targetProfile.role,
        new_role: newRole,
        user_name: targetProfile.full_name,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[changeUserRoleAction] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Server action: Export users CSV (masked phone, no NIN data).
 * Logs export to audit log and returns CSV string.
 */
export async function exportUsersCsvAction(): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  try {
    const currentAdminId = await requireAdmin();
    const admin = createAdminClient();

    // Fetch users (never select nin_hash)
    const { data: users, error } = await admin
      .from("users")
      .select("id, full_name, phone_number, level_id, is_verified, role, created_at")
      .order("created_at", { ascending: false });

    if (error || !users) {
      return { success: false, error: "Failed to fetch users for CSV export." };
    }

    const headers = ["ID", "Full Name", "Masked Phone", "Level", "Level Name", "Verified", "Role", "Joined Date"];
    const rows = users.map((u) => [
      `"${u.id}"`,
      `"${(u.full_name || "").replace(/"/g, '""')}"`,
      `"${maskPhone(u.phone_number)}"`,
      u.level_id,
      `"${getLevelName(u.level_id)}"`,
      u.is_verified ? "true" : "false",
      `"${u.role}"`,
      `"${u.created_at}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    // Write audit log entry
    await logAdminAction({
      adminId: currentAdminId,
      action: "users.export_csv",
      targetType: "export",
      metadata: {
        exported_count: users.length,
      },
    });

    return { success: true, csv: csvContent };
  } catch (err) {
    console.error("[exportUsersCsvAction] Unexpected error:", err);
    return { success: false, error: "Failed to generate CSV export." };
  }
}
