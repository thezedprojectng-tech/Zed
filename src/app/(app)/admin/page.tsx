import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import {
  Users,
  ShieldCheck,
  Clock,
  FileText,
  ArrowRight,
  TrendingUp,
  MapPin,
  Activity,
} from "lucide-react";
import { DeleteReportButton } from "./reports/DeleteReportButton";

export const metadata: Metadata = {
  title: "Admin — Overview",
  description: "Zed admin dashboard overview",
};

/* ── Helper types ─────────────────────────────────────────────────── */
interface DayCount {
  date: string;
  count: number;
}

interface FlowStat {
  flow_id: string;
  started: number;
  completed: number;
}

interface RecentReport {
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

/* ── Fetch helpers (all server-side, service-role) ────────────────── */
async function fetchStats() {
  await requireAdmin(); // double-check on every data fetch
  const admin = createAdminClient();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Execute queries in parallel using service role client
  const [
    { count: totalUsers },
    { count: verifiedUsers },
    { count: reports24h },
    { count: totalReports },
    { data: recentReports },
    { data: rawSignups },
    { data: navProgressRows },
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }),
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true),
    admin
      .from("center_reports")
      .select("*", { count: "exact", head: true })
      .gte("reported_at", twentyFourHoursAgo),
    admin.from("center_reports").select("*", { count: "exact", head: true }),
    admin
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
      .limit(5),
    admin
      .from("users")
      .select("created_at")
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: true }),
    admin.from("nav_progress").select("flow_id, state"),
  ]);

  // Signups per day for last 14 days
  const dayMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of rawSignups ?? []) {
    const day = row.created_at.slice(0, 10);
    if (day in dayMap) dayMap[day]++;
  }
  const signupsPerDay: DayCount[] = Object.entries(dayMap).map(([date, count]) => ({
    date,
    count,
  }));

  // Flow started vs completed
  const flowMap: Record<string, FlowStat> = {};
  for (const row of navProgressRows ?? []) {
    const fid = row.flow_id as string;
    if (!flowMap[fid]) flowMap[fid] = { flow_id: fid, started: 0, completed: 0 };
    flowMap[fid].started++;
    const state = row.state as { completed_steps?: string[]; steps?: string[] } | null;
    if (state && Array.isArray(state.completed_steps) && Array.isArray(state.steps)) {
      if (state.completed_steps.length === state.steps.length && state.steps.length > 0) {
        flowMap[fid].completed++;
      }
    }
  }
  const flowStats = Object.values(flowMap);

  return {
    totalUsers: totalUsers ?? 0,
    verifiedUsers: verifiedUsers ?? 0,
    reports24h: reports24h ?? 0,
    totalReports: totalReports ?? 0,
    recentReports: (recentReports as unknown as RecentReport[]) ?? [],
    signupsPerDay,
    flowStats,
  };
}

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="p-5 border-hairline bg-card flex items-start gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
          accent ?? "border-primary/20 bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground mt-0.5 font-mono">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

/* ── Recent reports widget ────────────────────────────────────────── */
function RecentReportsWidget({ reports }: { reports: RecentReport[] }) {
  return (
    <Card className="border-hairline bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">5 Most Recent Reports</h3>
        </div>
        <Link
          href="/admin/reports"
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <span>View all reports</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          No reports submitted yet.
        </div>
      ) : (
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
              {reports.map((r) => {
                const badge = waitBadge(r.wait_minutes);
                const reporterName = r.users?.full_name || "Citizen";
                const maskedPhone = maskPhone(r.users?.phone_number);

                return (
                  <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">
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
                    <td className="px-4 py-3 max-w-[160px] truncate">
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
      )}
    </Card>
  );
}

/* ── Quick links ─────────────────────────────────────────────────── */
function QuickLinks() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link
        href="/admin/users"
        className="group p-5 rounded-xl border border-hairline bg-card hover:border-primary/40 hover:bg-secondary/40 transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Manage Users
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search citizen accounts, verify status, and review levels.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </Link>

      <Link
        href="/admin/reports"
        className="group p-5 rounded-xl border border-hairline bg-card hover:border-primary/40 hover:bg-secondary/40 transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground group-hover:text-amber-500 transition-colors">
              Moderate Reports
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and moderate passport centre wait time submissions.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
async function AdminOverviewContent() {
  const {
    totalUsers,
    verifiedUsers,
    reports24h,
    totalReports,
    recentReports,
  } = await fetchStats();

  const verificationRate =
    totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1200px] px-3 sm:px-6 md:px-8 py-6 md:py-8 space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Verified Users"
          value={verifiedUsers.toLocaleString()}
          sub={`${verificationRate}% verification rate`}
          icon={ShieldCheck}
          accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          label="Reports (Last 24h)"
          value={reports24h.toLocaleString()}
          icon={Clock}
          accent="border-amber-500/20 bg-amber-500/10 text-amber-500"
        />
        <StatCard
          label="Total Reports"
          value={totalReports.toLocaleString()}
          icon={FileText}
          accent="border-blue-500/20 bg-blue-500/10 text-blue-400"
        />
      </div>

      {/* Quick Navigation to subpages */}
      <QuickLinks />

      {/* 5 Most Recent Center Reports with Delete Button */}
      <RecentReportsWidget reports={recentReports} />
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <>
      <Header
        title="Admin Overview"
        subtitle="Platform statistics, citizen engagement, and centre report moderation."
      />
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1200px] px-3 sm:px-6 md:px-8 py-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5 border-hairline bg-card">
                  <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-7 w-16" />
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <Card className="p-5 border-hairline bg-card">
              <Skeleton className="h-44 w-full" />
            </Card>
          </div>
        }
      >
        <AdminOverviewContent />
      </Suspense>
    </>
  );
}
