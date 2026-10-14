"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server action: delete a center_report row.
 * Admin check is enforced on every call — no client-side guard is relied upon.
 */
export async function deleteReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!reportId || typeof reportId !== "string") {
      return { success: false, error: "Invalid report ID." };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("center_reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      console.error("[deleteReport] Supabase error:", error.message);
      return { success: false, error: "Failed to delete report. Please try again." };
    }

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (err) {
    console.error("[deleteReport] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
