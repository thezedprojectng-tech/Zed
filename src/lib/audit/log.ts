import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "user.delete"
  | "user.role_change"
  | "users.export_csv"
  | "report.delete"
  | "report.bulk_delete";

interface LogAdminActionParams {
  adminId: string;
  action: AuditAction | string;
  targetType: "user" | "center_report" | "export" | "system";
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Record an entry into public.admin_audit_log using the service-role client.
 * Failures to log are logged to server stderr and won't crash the main action,
 * but success ensures an immutable audit trail.
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  metadata = {},
}: LogAdminActionParams): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId || null,
      metadata,
    });

    if (error) {
      console.error("[logAdminAction] Supabase error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[logAdminAction] Unexpected error:", err);
    return { success: false, error: "Failed to write audit log." };
  }
}
