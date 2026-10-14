import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin, maskPhone } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { SignupsAreaChart, SignupDataPoint } from "@/components/admin/charts/SignupsAreaChart";
import { FlowsGroupedBarChart, FlowGuideStat } from "@/components/admin/charts/FlowsGroupedBarChart";
import { VerificationDonutChart } from "@/components/admin/charts/VerificationDonutChart";
import { CivicLevelBarChart, LevelDataPoint } from "@/components/admin/charts/CivicLevelBarChart";
import { ReportsPerDayChart, ReportDayData } from "@/components/admin/charts/ReportsPerDayChart";
import { DeleteReportButton } from "./reports/DeleteReportButton";
import { getLevelName } from "@/types";

export const metadata: Metadata = {
  title: "Admin Console — Overview",
  description: "Zed Admin Console Overview and Platform Metrics",
};

interface RecentUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  level_id: number;
  is_verified: boolean;
  created_at: string;
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

function getInitials(name?: string | null) {
  if (!name) return "ZE";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

/* ── Fetch overview metrics ───────────────────────────────────────── */
async function fetchOverviewMetrics() {
  await requireAdmin();
  const admin = createAdminClient();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: verifiedUsers },
    { count: signupsLast7d },
    { count: signupsPrev7d },
    { count: reports24h },
    { count: totalReports },
    { data: recentUsersRaw },
    { data: recentReportsRaw },
    { data: signups90dRaw },
    { data: navProgressRaw },
    { data: levelCountsRaw },
    { data: reports14dRaw },
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }).eq("is_verified", true),
    admin.from("users").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo),
    admin.from("center_reports").select("*", { count: "exact", head: true }).gte("reported_at", twentyFourHoursAgo),
    admin.from("center_reports").select("*", { count: "exact", head: true }),
    admin
      .from("users")
      .select("id, full_name, avatar_url, phone_number, level_id, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
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
      .gte("created_at", ninetyDaysAgo)
      .order("created_at", { ascending: true }),
    admin.from("nav_progress").select("flow_id, state"),
    admin.from("users").select("level_id"),
    admin
      .from("center_reports")
      .select("center_name, reported_at")
      .gte("reported_at", fourteenDaysAgo)
      .order("reported_at", { ascending: true }),
  ]);

  // Signups 90d map
  const signupsMap: Record<string, number> = {};
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    signupsMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of signups90dRaw ?? []) {
    const day = r.created_at.slice(0, 10);
    if (day in signupsMap) signupsMap[day]++;
  }
  const signups90d: SignupDataPoint[] = Object.entries(signupsMap).map(([date, count]) => ({
    date,
    count,
  }));

  // Guide completion counts
  const guideDefs: Record<string, string> = {
    passport: "Nigerian Passport",
    nysc: "NYSC Mobilisation",
    "nin-bvn": "NIN & BVN",
    cac: "CAC Registration",
  };
  const guideMap: Record<string, { started: number; completed: number }> = {
    passport: { started: 0, completed: 0 },
    nysc: { started: 0, completed: 0 },
    "nin-bvn": { started: 0, completed: 0 },
    cac: { started: 0, completed: 0 },
  };

  let totalFlowsStarted = 0;
  let totalFlowsCompleted = 0;

  for (const row of navProgressRaw ?? []) {
    const fid = row.flow_id as string;
    if (!guideMap[fid]) {
      guideMap[fid] = { started: 0, completed: 0 };
    }
    guideMap[fid].started++;
    totalFlowsStarted++;

    const state = row.state as { completed_steps?: string[]; steps?: string[] } | null;
    if (state && Array.isArray(state.completed_steps) && Array.isArray(state.steps)) {
      if (state.completed_steps.length === state.steps.length && state.steps.length > 0) {
        guideMap[fid].completed++;
        totalFlowsCompleted++;
      }
    }
  }

  const flowGuideStats: FlowGuideStat[] = Object.entries(guideMap).map(([fid, stat]) => ({
    flow_id: fid,
    name: guideDefs[fid] || fid,
    started: stat.started,
    completed: stat.completed,
  }));

  // Levels 1 to 5 breakdown
  const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of levelCountsRaw ?? []) {
    const lvl = Number(row.level_id) || 1;
    if (lvl in levelCounts) levelCounts[lvl]++;
  }
  const levelData: LevelDataPoint[] = [1, 2, 3, 4, 5].map((lvl) => ({
    level: getLevelName(lvl),
    count: levelCounts[lvl] || 0,
  }));

  // Reports 14d & Busiest centre
  const reports14dMap: Record<string, number> = {};
  const centreFreq: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    reports14dMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of reports14dRaw ?? []) {
    const day = r.reported_at.slice(0, 10);
    if (day in reports14dMap) reports14dMap[day]++;
    if (r.center_name) {
      centreFreq[r.center_name] = (centreFreq[r.center_name] || 0) + 1;
    }
  }
  const reports14d: ReportDayData[] = Object.entries(reports14dMap).map(([date, count]) => ({
    date,
    count,
  }));

  let busiestCentre: { name: string; count: number } | null = null;
  for (const [name, count] of Object.entries(centreFreq)) {
    if (!busiestCentre || count > busiestCentre.count) {
      busiestCentre = { name, count };
    }
  }

  // 7-day signups comparison
  const sLast = signupsLast7d ?? 0;
  const sPrev = signupsPrev7d ?? 0;
  let signupGrowthPct = 0;
  if (sPrev > 0) {
    signupGrowthPct = Math.round(((sLast - sPrev) / sPrev) * 100);
  } else if (sLast > 0) {
    signupGrowthPct = 100;
  }

  return {
    totalUsers: totalUsers ?? 0,
    verifiedUsers: verifiedUsers ?? 0,
    signupsLast7d: sLast,
    signupGrowthPct,
    totalFlowsStarted,
    totalFlowsCompleted,
    reports24h: reports24h ?? 0,
    totalReports: totalReports ?? 0,
    signups90d,
    flowGuideStats,
    levelData,
    reports14d,
    busiestCentre,
    recentUsers: (recentUsersRaw as unknown as RecentUser[]) ?? [],
    recentReports: (recentReportsRaw as unknown as RecentReport[]) ?? [],
  };
}

/* ── KPI Metric Card ──────────────────────────────────────────────── */
function KPICard({
  label,
  value,
  subtext,
  badge,
  icon: Icon,
  accent = "border-border text-foreground",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: React.ReactNode;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="p-4 border-border bg-card shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <div className={`p-1.5 rounded-md border bg-secondary/40 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2.5">
        <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1 min-h-[18px]">
          {badge}
          {subtext && <span className="text-[11px] text-muted-foreground">{subtext}</span>}
        </div>
      </div>
    </Card>
  );
}

/* ── Page Content ─────────────────────────────────────────────────── */
async function OverviewContent() {
  const data = await fetchOverviewMetrics();

  const verificationRate =
    data.totalUsers > 0
      ? Math.round((data.verifiedUsers / data.totalUsers) * 100)
      : 0;

  const flowCompletionRate =
    data.totalFlowsStarted > 0
      ? Math.round((data.totalFlowsCompleted / data.totalFlowsStarted) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* KPI Cards (6 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Total Users */}
        <KPICard
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
          subtext="registered citizens"
          icon={Users}
        />

        {/* 2. Verified Users */}
        <KPICard
          label="Verified Users"
          value={data.verifiedUsers.toLocaleString()}
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-500 py-0 px-1"
            >
              {verificationRate}% RATE
            </Badge>
          }
          icon={ShieldCheck}
          accent="border-emerald-500/20 text-emerald-500"
        />

        {/* 3. Signups 7d with change vs previous 7d */}
        <KPICard
          label="Signups (7d)"
          value={data.signupsLast7d.toLocaleString()}
          badge={
            <Badge
              variant="outline"
              className={`text-[10px] font-mono py-0 px-1 ${
                data.signupGrowthPct >= 0
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              }`}
            >
              {data.signupGrowthPct >= 0 ? "+" : ""}
              {data.signupGrowthPct}% vs prev 7d
            </Badge>
          }
          icon={TrendingUp}
          accent="border-blue-500/20 text-blue-400"
        />

        {/* 4. Flows Started */}
        <KPICard
          label="Flows Started"
          value={data.totalFlowsStarted.toLocaleString()}
          subtext="guide interactions"
          icon={Compass}
          accent="border-violet-500/20 text-violet-400"
        />

        {/* 5. Flows Completed */}
        <KPICard
          label="Flows Completed"
          value={data.totalFlowsCompleted.toLocaleString()}
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-primary/30 bg-primary/10 text-primary py-0 px-1"
            >
              {flowCompletionRate}% COMPLETION
            </Badge>
          }
          icon={CheckCircle2}
          accent="border-primary/20 text-primary"
        />

        {/* 6. Reports in Last 24h */}
        <KPICard
          label="Reports (24h)"
          value={data.reports24h.toLocaleString()}
          subtext={`${data.totalReports} total all-time`}
          icon={Clock}
          accent="border-amber-500/20 text-amber-500"
        />
      </div>

      {/* Row 1 Charts: Signups Area Chart & Guide Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SignupsAreaChart data90d={data.signups90d} />
        <FlowsGroupedBarChart data={data.flowGuideStats} />
      </div>

      {/* Row 2 Charts: Verification Donut, Progression Levels, & Reports per Day */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VerificationDonutChart
          verified={data.verifiedUsers}
          unverified={Math.max(0, data.totalUsers - data.verifiedUsers)}
        />
        <CivicLevelBarChart data={data.levelData} />
        <ReportsPerDayChart
          data={data.reports14d}
          busiestCentre={data.busiestCentre}
        />
      </div>

      {/* Bottom Tables: Recent Signups & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Signups Table */}
        <Card className="border-border bg-card shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-foreground">
                Recent Signups
              </h3>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>View all users</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {data.recentUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              No citizens registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-muted-foreground text-[10px] font-mono uppercase">
                    <th className="text-left px-4 py-2.5">Citizen</th>
                    <th className="text-left px-4 py-2.5">Phone</th>
                    <th className="text-left px-4 py-2.5">Level</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-right px-4 py-2.5">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-border">
                            <AvatarImage src={u.avatar_url || ""} />
                            <AvatarFallback className="text-[9px] font-bold">
                              {getInitials(u.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground truncate max-w-[130px]">
                            {u.full_name || "Citizen"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                        {maskPhone(u.phone_number)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                        {getLevelName(u.level_id)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-mono py-0 px-1.5 ${
                            u.is_verified
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {u.is_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground text-right text-[11px] whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Reports List */}
        <Card className="border-border bg-card shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-foreground">
                Recent Wait-Time Reports
              </h3>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>View all reports</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {data.recentReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              No reports submitted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-muted-foreground text-[10px] font-mono uppercase">
                    <th className="text-left px-4 py-2.5">Centre</th>
                    <th className="text-left px-4 py-2.5">Wait</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-left px-4 py-2.5">Reporter</th>
                    <th className="text-right px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.recentReports.map((r) => {
                    const badge = waitBadge(r.wait_minutes);
                    const reporterName = r.users?.full_name || "Citizen";
                    const maskedPhone = maskPhone(r.users?.phone_number);

                    return (
                      <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-foreground block truncate max-w-[140px]">
                            {r.center_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {r.state}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                          {formatMinutes(r.wait_minutes)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-mono py-0 px-1.5 ${badge.cls}`}
                          >
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 truncate max-w-[130px]">
                          <span className="font-medium text-foreground block truncate">
                            {reporterName}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {maskedPhone}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
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
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4 border-border bg-card">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-16 mb-2" />
                <Skeleton className="h-3 w-28" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6 border-border bg-card">
              <Skeleton className="h-[250px] w-full" />
            </Card>
            <Card className="p-6 border-border bg-card">
              <Skeleton className="h-[250px] w-full" />
            </Card>
          </div>
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}
