import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLevelName } from "@/types";
import { AdminOverviewClient, type RecentUser } from "./AdminOverviewClient";
import AdminOverviewLoading from "./loading";
import type { SignupDataPoint } from "@/components/admin/charts/SignupsAreaChart";
import type { FlowGuideStat } from "@/components/admin/charts/FlowsGroupedBarChart";
import type { LevelDataPoint } from "@/components/admin/charts/CivicLevelBarChart";

export const metadata: Metadata = {
  title: "Admin Console — Overview",
  description: "Zed Admin Console Overview and Platform Metrics",
};

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
    { count: miningClaimsToday },
    { data: miningTotalRaw },
    { data: recentUsersRaw },
    { data: signups90dRaw },
    { data: navProgressRaw },
    { data: levelCountsRaw },
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }).eq("is_verified", true),
    admin.from("users").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo),
    admin.from("mining_logs").select("*", { count: "exact", head: true }).gte("mined_at", twentyFourHoursAgo),
    admin.from("token_wallets").select("total_mined"),
    admin
      .from("users")
      .select("id, full_name, avatar_url, phone_number, level_id, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("users")
      .select("created_at")
      .gte("created_at", ninetyDaysAgo)
      .order("created_at", { ascending: true }),
    admin.from("nav_progress").select("flow_id, state"),
    admin.from("users").select("level_id"),
  ]);

  // Mining totals
  const totalZedIssued = (miningTotalRaw ?? []).reduce(
    (sum, row) => sum + Number((row as { total_mined: number }).total_mined ?? 0),
    0
  );

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

    const state = row.state as { completed_steps?: string[]; steps?: string[]; completed?: boolean } | null;
    if (state) {
      const isComplete =
        Boolean(state.completed) ||
        (Array.isArray(state.completed_steps) &&
          Array.isArray(state.steps) &&
          state.steps.length > 0 &&
          state.completed_steps.length === state.steps.length);
      if (isComplete) {
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
    miningClaimsToday: miningClaimsToday ?? 0,
    totalZedIssued,
    signups90d,
    flowGuideStats,
    levelData,
    recentUsers: (recentUsersRaw as unknown as RecentUser[]) ?? [],
  };
}

/* ── Page Content ─────────────────────────────────────────────────── */
async function OverviewContent() {
  const data = await fetchOverviewMetrics();
  return <AdminOverviewClient data={data} />;
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<AdminOverviewLoading />}>
      <OverviewContent />
    </Suspense>
  );
}
