"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit/log";

/**
 * Server action: delete a single center_report row.
 * Admin check is enforced on every call and logged to audit trail.
 */
export async function deleteReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentAdminId = await requireAdmin();

    if (!reportId || typeof reportId !== "string") {
      return { success: false, error: "Invalid report ID." };
    }

    const admin = createAdminClient();

    // Fetch report info before delete for audit metadata
    const { data: existingReport } = await admin
      .from("center_reports")
      .select("center_name, state, wait_minutes")
      .eq("id", reportId)
      .maybeSingle();

    const { error } = await admin
      .from("center_reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      console.error("[deleteReport] Supabase error:", error.message);
      return { success: false, error: "Failed to delete report." };
    }

    // Write to audit log
    await logAdminAction({
      adminId: currentAdminId,
      action: "report.delete",
      targetType: "center_report",
      targetId: reportId,
      metadata: {
        center_name: existingReport?.center_name,
        state: existingReport?.state,
        wait_minutes: existingReport?.wait_minutes,
      },
    });

    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[deleteReport] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Server action: bulk delete multiple center_report rows.
 * Admin check is enforced on every call and logged to audit trail.
 */
export async function bulkDeleteReports(
  reportIds: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const currentAdminId = await requireAdmin();

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return { success: false, error: "No reports selected." };
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("center_reports")
      .delete()
      .in("id", reportIds);

    if (error) {
      console.error("[bulkDeleteReports] Error:", error.message);
      return { success: false, error: "Failed to delete reports in bulk." };
    }

    // Write to audit log
    await logAdminAction({
      adminId: currentAdminId,
      action: "report.bulk_delete",
      targetType: "center_report",
      metadata: {
        deleted_count: reportIds.length,
        deleted_ids: reportIds,
      },
    });

    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    return { success: true, count: reportIds.length };
  } catch (err) {
    console.error("[bulkDeleteReports] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred during bulk delete." };
  }
}
