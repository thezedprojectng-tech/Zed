"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export interface FlowGuideStat {
  flow_id: string;
  name: string;
  started: number;
  completed: number;
}

interface FlowsGroupedBarChartProps {
  data: FlowGuideStat[];
}

interface CustomFlowsTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}

function CustomFlowsTooltip({ active, payload, label }: CustomFlowsTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const started = payload.find((p) => p.dataKey === "started")?.value ?? 0;
  const completed = payload.find((p) => p.dataKey === "completed")?.value ?? 0;
  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md space-y-1.5">
      <p className="text-[11px] font-semibold text-foreground border-b border-border/60 pb-1">
        {label}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--data-flows)" }}
            />
            <span>Started:</span>
          </div>
          <span className="font-mono font-bold text-foreground tabular-nums">
            {started.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--data-verified)" }}
            />
            <span>Completed:</span>
          </div>
          <span className="font-mono font-bold text-foreground tabular-nums">
            {completed.toLocaleString()}
          </span>
        </div>

        <div className="pt-1 border-t border-border/40 flex items-center justify-between gap-4 text-[11px]">
          <span className="text-muted-foreground">Completion rate:</span>
          <span className="font-mono font-bold text-data-verified-ink tabular-nums">
            {started > 0 ? `${completionRate}%` : "No starts yet"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FlowsGroupedBarChart({ data }: FlowsGroupedBarChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalStarted = (data ?? []).reduce((acc, d) => acc + d.started, 0);
  const totalCompleted = (data ?? []).reduce((acc, d) => acc + d.completed, 0);
  const avgCompletion =
    totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-border/40">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Guide completion
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sessions started versus completed across civic guides
          </p>
        </div>

        {/* Inline Legend */}
        <div className="flex items-center gap-3 text-xs select-none">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: "var(--data-flows)" }}
            />
            <span className="text-muted-foreground">Started</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: "var(--data-verified)" }}
            />
            <span className="text-muted-foreground">Completed</span>
          </div>
          {totalStarted > 0 && (
            <span className="font-mono text-[11px] font-semibold text-data-verified-ink bg-data-verified-subtle border border-data-verified-border px-1.5 py-0.5 rounded">
              {avgCompletion}% avg
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas or Hydration Skeleton */}
      <div className="pt-4 h-[260px] w-full">
        {!mounted ? (
          <div className="h-full w-full flex flex-col justify-between py-2">
            <div className="h-44 flex items-end gap-6 px-4">
              {[60, 45, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 flex gap-2 justify-center items-end h-full">
                  <Skeleton className="w-6 rounded-t" style={{ height: `${h}%` }} />
                  <Skeleton className="w-6 rounded-t" style={{ height: `${h * 0.65}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-around pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : !data || data.length === 0 || totalStarted === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No guide interactions recorded yet.
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
                dataKey="name"
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
                content={<CustomFlowsTooltip />}
                cursor={{ fill: "var(--accent)", opacity: 0.15 }}
              />

              <Bar
                dataKey="started"
                name="Started"
                fill="var(--data-flows)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!shouldReduceMotion}
                animationDuration={shouldReduceMotion ? 0 : 600}
                animationEasing="ease-out"
              />

              <Bar
                dataKey="completed"
                name="Completed"
                fill="var(--data-verified)"
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
