import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, ShieldAlert, Clock, User, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Console — Audit Log",
  description: "Immutable administrative action ledger and compliance records",
};

interface AuditLogRow {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_user?: {
    full_name: string | null;
    phone_number: string | null;
  } | null;
}

function getActionBadge(action: string) {
  if (action === "user.delete") {
    return {
      label: "USER DELETED",
      cls: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }
  if (action === "user.role_change") {
    return {
      label: "ROLE CHANGED",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    };
  }
  if (action === "report.delete") {
    return {
      label: "REPORT DELETED",
      cls: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    };
  }
  if (action === "report.bulk_delete") {
    return {
      label: "BULK REPORT DELETE",
      cls: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }
  if (action === "users.export_csv") {
    return {
      label: "CSV EXPORT",
      cls: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    };
  }
  return {
    label: action.toUpperCase(),
    cls: "border-border text-muted-foreground",
  };
}

async function AuditLogContent() {
  await requireAdmin();
  const admin = createAdminClient();

  // Fetch audit logs with admin user details
  const { data: logs, error } = await admin
    .from("admin_audit_log")
    .select(`
      id,
      admin_id,
      action,
      target_type,
      target_id,
      metadata,
      created_at,
      admin_user:admin_id (
        full_name,
        phone_number
      )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    // If the table doesn't exist yet in Supabase, show a friendly guide with the exact SQL
    return (
      <Card className="p-6 border-amber-500/30 bg-amber-500/5 space-y-4">
        <div className="flex items-center gap-2 text-amber-500">
          <Terminal className="h-5 w-5" />
          <h3 className="text-sm font-bold">Audit Log Table Needs Setup</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          The <code className="font-mono text-foreground">admin_audit_log</code> table has not been created yet in your Supabase database. Run the migration script in Supabase SQL Editor:
        </p>
        <div className="rounded-lg border border-border bg-card p-4 font-mono text-[11px] text-foreground overflow-x-auto">
          <pre>{`CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log: admin select"
  ON public.admin_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'admin'));

CREATE POLICY "admin_audit_log: insert"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (auth.uid() = admin_id OR auth.role() = 'service_role');`}</pre>
        </div>
      </Card>
    );
  }

  const logList = (logs as unknown as AuditLogRow[]) ?? [];

  if (logList.length === 0) {
    return (
      <Card className="p-12 border-border bg-card text-center space-y-2">
        <ScrollText className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
        <p className="text-sm font-semibold text-foreground">No Audit Records Yet</p>
        <p className="text-xs text-muted-foreground font-mono">
          Administrative actions (deletions, role changes, CSV exports) will be logged here automatically.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
        <span>{logList.length} recorded events (newest first)</span>
        <span className="text-emerald-500 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Immutable Append-Only Ledger
        </span>
      </div>

      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                  Timestamp
                </th>
                <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                  Administrator
                </th>
                <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                  Action
                </th>
                <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                  Target
                </th>
                <th className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap">
                  Details / Metadata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logList.map((entry) => {
                const badge = getActionBadge(entry.action);
                const adminName = !entry.admin_id
                  ? "Deleted admin"
                  : entry.admin_user?.full_name || "Administrator";

                return (
                  <tr key={entry.id} className="hover:bg-secondary/30 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap text-[11px]">
                      {new Date(entry.created_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    {/* Admin */}
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{adminName}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono font-bold py-0.5 px-2 ${badge.cls}`}
                      >
                        {badge.label}
                      </Badge>
                    </td>

                    {/* Target */}
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap text-[11px]">
                      <span className="uppercase text-foreground font-semibold">
                        {entry.target_type}
                      </span>
                      {entry.target_id && (
                        <span className="text-[10px] text-muted-foreground ml-1.5 truncate max-w-[100px] inline-block align-bottom">
                          #{entry.target_id.slice(0, 8)}...
                        </span>
                      )}
                    </td>

                    {/* Metadata */}
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground max-w-sm truncate">
                      {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                        <span className="bg-secondary/60 rounded px-1.5 py-0.5 border border-border/60 text-foreground">
                          {JSON.stringify(entry.metadata)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Administrative Audit Log
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Immutable audit trail tracking all administrative actions, data exports, and deletions.
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-6 border-border bg-card space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </Card>
        }
      >
        <AuditLogContent />
      </Suspense>
    </div>
  );
}
