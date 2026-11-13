"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  UserPlus,
  Coins,
  Compass,
  CheckCircle2,
  Pickaxe,
} from "lucide-react";
import { OverviewHeader, type RangeOption } from "@/components/admin/overview/OverviewHeader";
import { OverviewKpiTile } from "@/components/admin/overview/OverviewKpiTile";
import { SignupsAreaChart, type SignupDataPoint } from "@/components/admin/charts/SignupsAreaChart";
import { VerificationDonutChart } from "@/components/admin/charts/VerificationDonutChart";
import { FlowsGroupedBarChart, type FlowGuideStat } from "@/components/admin/charts/FlowsGroupedBarChart";
import { CivicLevelBarChart, type LevelDataPoint } from "@/components/admin/charts/CivicLevelBarChart";

export interface RecentUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  level_id: number;
  is_verified: boolean;
  created_at: string;
}

export interface AdminOverviewData {
  totalUsers: number;
  verifiedUsers: number;
  signupsLast7d: number;
  signupGrowthPct: number;
  totalFlowsStarted: number;
  totalFlowsCompleted: number;
  miningClaimsToday: number;
  totalZedIssued: number;
  signups90d: SignupDataPoint[];
  flowGuideStats: FlowGuideStat[];
  levelData: LevelDataPoint[];
  recentUsers: RecentUser[];
}

export function AdminOverviewClient({ data }: { data: AdminOverviewData }) {
  const shouldReduceMotion = useReducedMotion();
  const [range, setRange] = React.useState<RangeOption>("30d");

  const verificationRate =
    data.totalUsers > 0
      ? Math.round((data.verifiedUsers / data.totalUsers) * 100)
      : 0;

  const flowCompletionRate =
    data.totalFlowsStarted > 0
      ? Math.round((data.totalFlowsCompleted / data.totalFlowsStarted) * 100)
      : 0;

  const containerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
        delayChildren: shouldReduceMotion ? 0 : 0.02,
      },
    },
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Page Header: "Overview", today's date, "Updated <time>" and 7d/30d/90d range control */}
      <OverviewHeader range={range} onRangeChange={setRange} />

      {/* Main 12-Column Grid */}
      <div className="space-y-4">
        {/* Row 1: Four KPI tiles (col-span-3 each on desktop, 2 on tablet, 1 on mobile) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* 1. Total users */}
          <OverviewKpiTile
            label="Total users"
            value={data.totalUsers}
            isCountUp={true}
            subtext="registered citizens"
            icon={Users}
            role="users"
            sparklineData={data.signups90d.slice(-14)}
          />

          {/* 2. Verified users */}
          <OverviewKpiTile
            label="Verified users"
            value={data.verifiedUsers}
            isCountUp={true}
            badge={
              <span className="text-[11px] font-semibold text-data-verified-ink bg-data-verified-subtle border border-data-verified-border px-1.5 py-0.5 rounded tabular-nums select-none">
                {verificationRate}% verified
              </span>
            }
            subtext="with approved identity"
            icon={ShieldCheck}
            role="verified"
          />

          {/* 3. Signups 7d with delta pill */}
          <OverviewKpiTile
            label="Signups (7d)"
            value={data.signupsLast7d}
            isCountUp={true}
            delta={{
              value: data.signupGrowthPct,
              label: "vs prev 7d",
            }}
            subtext="new accounts this week"
            icon={UserPlus}
            role="signups"
          />

          {/* 4. ZED issued all-time */}
          <OverviewKpiTile
            label="ZED issued"
            value={data.totalZedIssued.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            isCountUp={false} // Never count-up on ZED amounts
            subtext="off-chain civic points"
            icon={Coins}
            role="mining"
          />
        </motion.div>

        {/* Row 2: Three KPI tiles (col-span-4 each on desktop, 2/1 on tablet, 1 on mobile) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* 5. Flows started */}
          <OverviewKpiTile
            label="Flows started"
            value={data.totalFlowsStarted}
            isCountUp={true}
            subtext="civic guide sessions"
            icon={Compass}
            role="flows"
          />

          {/* 6. Flows completed with completion % or zero state */}
          <OverviewKpiTile
            label="Flows completed"
            value={data.totalFlowsCompleted}
            isCountUp={true}
            badge={
              data.totalFlowsCompleted === 0 ? (
                <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border px-1.5 py-0.5 rounded select-none">
                  No completions yet
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-data-verified-ink bg-data-verified-subtle border border-data-verified-border px-1.5 py-0.5 rounded tabular-nums select-none">
                  {flowCompletionRate}% completion
                </span>
              )
            }
            subtext="completed all steps"
            icon={CheckCircle2}
            role="flows"
          />

          {/* 7. Mining claims (24h) */}
          <OverviewKpiTile
            label="Mining claims (24h)"
            value={data.miningClaimsToday}
            isCountUp={true}
            subtext="claims in last 24 hours"
            icon={Pickaxe}
            role="mining"
            className="sm:col-span-2 lg:col-span-1"
          />
        </motion.div>

        {/* Row 3: Signups chart (col-span-8) + Verification donut (col-span-4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <SignupsAreaChart data90d={data.signups90d} range={range} />
          </div>
          <div className="lg:col-span-4">
            <VerificationDonutChart
              verified={data.verifiedUsers}
              unverified={Math.max(0, data.totalUsers - data.verifiedUsers)}
            />
          </div>
        </div>

        {/* Row 4: Guide completion (col-span-6) + Civic levels (col-span-6) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FlowsGroupedBarChart data={data.flowGuideStats} />
          <CivicLevelBarChart data={data.levelData} />
        </div>
      </div>
    </div>
  );
}
