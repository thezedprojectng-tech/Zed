"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export interface SignupDataPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

interface SignupsAreaChartProps {
  data90d: SignupDataPoint[];
  range?: "7d" | "30d" | "90d";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomSignupsTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  let formattedDate = label;
  try {
    if (label) {
      formattedDate = new Date(label).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    formattedDate = label;
  }

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-[11px] text-muted-foreground font-medium mb-1">
        {formattedDate}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--data-signups)" }}
        />
        <span className="text-muted-foreground">Signups:</span>
        <span className="font-mono font-bold text-foreground tabular-nums">
          {payload[0].value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function SignupsAreaChart({ data90d, range = "30d" }: SignupsAreaChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const filteredData = React.useMemo(() => {
    return (data90d ?? []).slice(-days);
  }, [data90d, days]);

  const totalInPeriod = React.useMemo(() => {
    return filteredData.reduce((acc, d) => acc + d.count, 0);
  }, [filteredData]);

  const dailyAverage = React.useMemo(() => {
    if (filteredData.length === 0) return "0";
    return (totalInPeriod / filteredData.length).toFixed(1);
  }, [filteredData, totalInPeriod]);

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-border/40">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Signups over time
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily citizen registrations across the selected period
          </p>
        </div>

        {/* Inline summary metrics */}
        <div className="flex items-center gap-3 text-xs">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 border border-border/60">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {totalInPeriod.toLocaleString()}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 border border-border/60">
            <span className="text-muted-foreground">Avg/day:</span>
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {dailyAverage}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas or Hydration Skeleton */}
      <div className="pt-4 h-[260px] w-full">
        {!mounted ? (
          <div className="h-full w-full flex flex-col justify-between py-2">
            <div className="h-44 flex items-end gap-2 px-1">
              {[45, 60, 35, 75, 50, 90, 65, 80, 55, 70, 85, 60].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                  <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="signups-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--data-signups)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--data-signups)" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Faint horizontal gridlines only */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.5}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                className="font-sans text-[11px] fill-muted-foreground"
                tickFormatter={(value: string) => {
                  try {
                    const d = new Date(value);
                    return d.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    });
                  } catch {
                    return value;
                  }
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                className="font-mono text-[11px] fill-muted-foreground"
              />

              <Tooltip
                content={<CustomSignupsTooltip />}
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              />

              <Area
                type="monotone"
                dataKey="count"
                name="Signups"
                stroke="var(--data-signups)"
                strokeWidth={2}
                fill="url(#signups-gradient)"
                isAnimationActive={!shouldReduceMotion}
                animationDuration={shouldReduceMotion ? 0 : 600}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
