import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { FileText, MapPin, Filter, X } from "lucide-react";
import { DeleteReportButton } from "./DeleteReportButton";
import { PASSPORT_CENTRES, NIGERIAN_STATES } from "@/data/centers";

export const metadata: Metadata = {
  title: "Admin — Reports",
  description: "Moderate passport centre wait-time reports",
};

/* ── Report row type ──────────────────────────────────────────────────── */
interface ReportWithUser {
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

/* ── Status helpers ───────────────────────────────────────────────── */
function waitBadge(mins: number) {
  if (mins < 60)
    return { label: "Quiet", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" };
  if (mins <= 180)
    return { label: "Moderate", cls: "border-amber-500/30 bg-amber-500/10 text-amber-500" };
  return { label: "Busy", cls: "border-destructive/30 bg-destructive/10 text-destructive" };
}

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

/* ── Reports content ──────────────────────────────────────────────── */
async function ReportsContent({
  filterState,
  filterCenter,
}: {
  filterState?: string;
  filterCenter?: string;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
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
    .limit(200);

  if (filterState && filterState !== "All States") {
    query = query.eq("state", filterState);
  }

  if (filterCenter && filterCenter !== "All Centres") {
    query = query.eq("center_name", filterCenter);
  }

  const { data: reports, error } = await query;

  if (error) {
    console.error("[ReportsContent] Query error:", error.message);
  }

  const reportList = (reports as unknown as ReportWithUser[]) ?? [];

  if (reportList.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-12 text-center space-y-2">
        <MapPin className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
        <p className="text-sm font-semibold text-foreground">No reports found</p>
        <p className="text-xs text-muted-foreground">
          {filterState || filterCenter
            ? "No reports match the selected filters. Try clearing your selection."
            : "Citizen centre reports will appear here once submitted."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-mono">
        {reportList.length} report{reportList.length !== 1 ? "s" : ""} found
        {(filterState || filterCenter) && " (filtered)"}
      </p>

      <Card className="border-hairline bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-hairline">
                {["Centre", "State", "Wait Time", "Status", "Reporter", "Reported At", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-mono uppercase tracking-wider text-muted-foreground font-semibold text-[10px] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {reportList.map((r) => {
                const badge = waitBadge(r.wait_minutes);
                const reporterName = r.users?.full_name || "Citizen";
                const maskedPhone = maskPhone(r.users?.phone_number);

                return (
                  <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                      {r.center_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {r.state}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">
                      {formatMinutes(r.wait_minutes)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${badge.cls}`}
                      >
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate">
                      <span className="font-medium text-foreground block truncate">
                        {reporterName}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {maskedPhone}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(r.reported_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <DeleteReportButton reportId={r.id} centreName={r.center_name} />
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

/* ── Page ─────────────────────────────────────────────────────────── */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; center?: string }>;
}) {
  const params = await searchParams;
  const filterState = params.state || "";
  const filterCenter = params.center || "";

  const availableCentres = PASSPORT_CENTRES.map((c) => c.name);

  return (
    <>
      <Header
        title="Centre Reports"
        subtitle="Moderate and verify citizen-submitted wait time reports."
      />
      <div className="mx-auto max-w-[1200px] px-3 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
        {/* Filters Form */}
        <Card className="p-4 border-hairline bg-card">
          <form method="GET" action="/admin/reports" className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground font-mono uppercase">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Filters</span>
            </div>

            {/* Filter by State */}
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <select
                name="state"
                defaultValue={filterState}
                className="w-full h-9 px-3 rounded-lg border border-hairline bg-secondary/50 text-xs text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">All States</option>
                {NIGERIAN_STATES.filter((s) => s !== "All States").map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Centre */}
            <div className="flex-1 min-w-[180px] max-w-[260px]">
              <select
                name="center"
                defaultValue={filterCenter}
                className="w-full h-9 px-3 rounded-lg border border-hairline bg-secondary/50 text-xs text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">All Centres</option>
                {availableCentres.map((centre) => (
                  <option key={centre} value={centre}>
                    {centre}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-3.5 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Apply Filter
            </button>

            {(filterState || filterCenter) && (
              <Link
                href="/admin/reports"
                className="flex items-center gap-1 px-3 h-9 rounded-lg border border-hairline text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Link>
            )}
          </form>
        </Card>

        {/* Reports Table with Suspense */}
        <Suspense
          fallback={
            <Card className="p-5 border-hairline bg-card space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </Card>
          }
        >
          <ReportsContent filterState={filterState} filterCenter={filterCenter} />
        </Suspense>
      </div>
    </>
  );
}
