"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface VerificationDonutChartProps {
  verified: number;
  unverified: number;
}

export function VerificationDonutChart({
  verified,
  unverified,
}: VerificationDonutChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const total = verified + unverified;
  const verifiedRate = total > 0 ? Math.round((verified / total) * 100) : 0;
  const unverifiedRate = total > 0 ? 100 - verifiedRate : 0;

  const chartData = React.useMemo(() => {
    return [
      { name: "Verified", value: verified, color: "var(--data-verified)" },
      { name: "Unverified", value: unverified, color: "var(--border)" },
    ];
  }, [verified, unverified]);

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Citizen verification
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identity review approval ratio
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-data-verified-subtle border border-data-verified-border text-data-verified-ink text-xs font-semibold tabular-nums">
          <span>{verifiedRate}%</span>
          <span className="text-[10px] font-normal opacity-90">verified</span>
        </div>
      </div>

      {/* Donut or Empty State or Skeleton */}
      <div className="py-2 flex-1 flex flex-col items-center justify-center min-h-[200px]">
        {!mounted ? (
          <div className="relative flex items-center justify-center py-4">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="absolute h-24 w-24 rounded-full bg-card" />
          </div>
        ) : total === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No citizen accounts registered yet.
          </div>
        ) : (
          <div className="relative w-full h-[190px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={total > 0 && verified > 0 && unverified > 0 ? 3 : 0}
                  strokeWidth={2}
                  stroke="var(--card)"
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 700}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                {verifiedRate}%
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Approved
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Inline Legend Rows */}
      <div className="pt-3 border-t border-border/40 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--data-verified)" }}
            />
            <span className="text-foreground font-medium">Verified citizens</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums text-muted-foreground">
            <span className="text-foreground font-semibold">{verified.toLocaleString()}</span>
            <span>({verifiedRate}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 border border-border"
            />
            <span className="text-muted-foreground">Unverified citizens</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums text-muted-foreground">
            <span>{unverified.toLocaleString()}</span>
            <span>({unverifiedRate}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
