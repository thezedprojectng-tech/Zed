import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAuditLogClient } from "./AdminAuditLogClient";
import type { AuditLogRow } from "./AdminAuditLogClient";

export const metadata: Metadata = {
  title: "Admin – Audit log | Zed",
  description: "Immutable record of all administrative actions.",
};

interface SearchParams {
  q?: string;
  admin_id?: string;
  target_type?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();

  const params = await searchParams;

  const q = params.q?.trim() || "";
  const adminFilter = params.admin_id?.trim() || "";
  const targetTypeFilter = params.target_type?.trim() || "";
  const fromDate = params.from?.trim() || "";
  const toDate = params.to?.trim() || "";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const limitRaw = parseInt(params.limit || "50", 10);
  const limit = [25, 50, 100].includes(limitRaw) ? limitRaw : 50;

  const admin = createAdminClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // ── Main query ───────────────────────────────────────────────────────────
  let query = admin
    .from("admin_audit_log")
    .select(
      `id, admin_id, action, target_type, target_id, metadata, created_at, admin_user:admin_id(full_name)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`action.ilike.%${q}%,target_id.ilike.%${q}%`);
  }

  if (adminFilter === "system") {
    query = query.is("admin_id", null);
  } else if (adminFilter) {
    query = query.eq("admin_id", adminFilter);
  }

  if (targetTypeFilter) {
    query = query.eq("target_type", targetTypeFilter);
  }

  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }

  if (toDate) {
    // Add end of day
    const endOfDay = toDate.includes("T") ? toDate : `${toDate}T23:59:59Z`;
    query = query.lte("created_at", endOfDay);
  }

  const { data, count, error } = await query;

  // ── Distinct target types ─────────────────────────────────────────────────
  let targetTypes: string[] = [];
  try {
    const { data: ttData } = await admin
      .from("admin_audit_log")
      .select("target_type")
      .limit(200);
    if (ttData) {
      const seen = new Set<string>();
      for (const row of ttData) {
        if (row.target_type && !seen.has(row.target_type)) {
          seen.add(row.target_type);
          targetTypes.push(row.target_type as string);
        }
      }
      targetTypes.sort();
    }
  } catch {
    // ignore
  }

  // ── Distinct admins ───────────────────────────────────────────────────────
  let admins: { id: string; name: string }[] = [];
  try {
    const { data: adminData } = await admin
      .from("admin_audit_log")
      .select("admin_id, admin_user:admin_id(full_name)")
      .not("admin_id", "is", null)
      .limit(500);

    if (adminData) {
      const seenIds = new Set<string>();
      for (const row of adminData) {
        const id = row.admin_id as string;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          const adminUserObj = Array.isArray(row.admin_user)
            ? (row.admin_user[0] as unknown as { full_name: string | null } | null)
            : (row.admin_user as unknown as { full_name: string | null } | null);
          const name = adminUserObj?.full_name || "Administrator";
          admins.push({ id, name });
        }
      }
    }
  } catch {
    // ignore
  }

  const logs = (data as unknown as AuditLogRow[]) ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <AdminAuditLogClient
      logs={logs}
      total={total}
      page={page}
      limit={limit}
      totalPages={totalPages}
      targetTypes={targetTypes}
      admins={admins}
      q={q}
      adminFilter={adminFilter}
      targetTypeFilter={targetTypeFilter}
      fromDate={fromDate}
      toDate={toDate}
      hasError={!!error}
    />
  );
}
