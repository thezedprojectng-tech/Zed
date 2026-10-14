import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsTableClient, ReportItem } from "./ReportsTableClient";
import { PASSPORT_CENTRES, NIGERIAN_STATES } from "@/data/centers";

export const metadata: Metadata = {
  title: "Admin Console — Centre Reports",
  description: "Moderate and audit passport centre crowd-sourced wait-time reports",
};

interface RawReportWithUser {
  id: string;
  center_name: string;
  state: string;
  wait_minutes: number;
  reported_at: string;
  user_id: string;
  users?: {
    full_name: string | null;
    phone_number: string | null;
  } | null;
}

async function ReportsContent() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: rawReports, error } = await admin
    .from("center_reports")
    .select(`
      id,
      center_name,
      state,
      wait_minutes,
      reported_at,
      user_id,
      users:user_id (
        full_name,
        phone_number
      )
    `)
    .order("reported_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[AdminReportsPage] Error fetching reports:", error.message);
  }

  const reportList: ReportItem[] = (rawReports as unknown as RawReportWithUser[] ?? []).map((r) => ({
    id: r.id,
    center_name: r.center_name,
    state: r.state,
    wait_minutes: r.wait_minutes,
    reported_at: r.reported_at,
    user_id: r.user_id,
    reporter_name: r.users?.full_name || "Citizen",
    masked_phone: maskPhone(r.users?.phone_number),
  }));

  const availableCentres = Array.from(new Set(PASSPORT_CENTRES.map((c) => c.name)));
  const availableStates = Array.from(new Set(NIGERIAN_STATES.filter((s) => s !== "All States")));

  return (
    <ReportsTableClient
      reports={reportList}
      availableCentres={availableCentres}
      availableStates={availableStates}
    />
  );
}

export default function AdminReportsPage() {
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Passport Centre Reports
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review crowd-sourced wait time reports, moderate spam, and perform bulk actions.
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
        <ReportsContent />
      </Suspense>
    </div>
  );
}
