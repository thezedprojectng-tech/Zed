"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export interface LevelDataPoint {
  level: string; // "Lvl 1", "Lvl 2", etc.
  count: number;
}

interface CivicLevelBarChartProps {
  data: LevelDataPoint[];
}

interface CustomLevelTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  total: number;
}

function CustomLevelTooltip({ active, payload, label, total }: CustomLevelTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const count = payload[0].value ?? 0;
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md space-y-1">
      <p className="text-[11px] font-semibold text-foreground border-b border-border/60 pb-1">
        {label}
      </p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--data-users)" }}
          />
          <span>Citizens:</span>
        </div>
        <span className="font-mono font-bold text-foreground tabular-nums">
          {count.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[11px] text-muted-foreground pt-0.5">
        <span>Share:</span>
        <span className="font-mono font-semibold text-data-users-ink tabular-nums">
          {pct}%
        </span>
      </div>
    </div>
  );
}

export function CivicLevelBarChart({ data }: CivicLevelBarChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const total = (data ?? []).reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-border/40">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Civic level distribution
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active citizens across civic progression tiers
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-data-users-subtle border border-data-users-border text-data-users-ink text-xs font-semibold select-none">
          <span>5 tiers</span>
        </div>
      </div>

      {/* Chart Canvas or Hydration Skeleton */}
      <div className="pt-4 h-[260px] w-full">
        {!mounted ? (
          <div className="h-full w-full flex flex-col justify-between py-2">
            <div className="h-44 flex items-end gap-5 px-6">
              {[80, 55, 40, 25, 15].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                  <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-around pt-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ) : !data || data.length === 0 || total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No citizen level records yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              {/* Faint horizontal gridlines only */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.5}
              />

              <XAxis
                dataKey="level"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="font-sans text-[11px] fill-muted-foreground font-medium"
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                className="font-mono text-[11px] fill-muted-foreground"
              />

              <Tooltip
                content={<CustomLevelTooltip total={total} />}
                cursor={{ fill: "var(--accent)", opacity: 0.15 }}
              />

              <Bar
                dataKey="count"
                name="Citizens"
                fill="var(--data-users)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!shouldReduceMotion}
                animationDuration={shouldReduceMotion ? 0 : 600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
