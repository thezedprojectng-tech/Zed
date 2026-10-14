"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export interface ReportDayData {
  date: string;
  count: number;
}

interface ReportsPerDayChartProps {
  data: ReportDayData[];
  busiestCentre?: {
    name: string;
    count: number;
  } | null;
}

const chartConfig = {
  count: {
    label: "Wait-time Reports",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function ReportsPerDayChart({
  data,
  busiestCentre,
}: ReportsPerDayChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Wait-Time Reports (14 Days)
            </CardTitle>
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-500 px-1.5 py-0"
            >
              {total} TOTAL
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Citizen crowd-sourced reports from passport processing centres
          </CardDescription>
        </div>

        {busiestCentre && busiestCentre.count > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-500 font-medium">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[200px]">
              Busiest: <strong>{busiestCentre.name}</strong> ({busiestCentre.count})
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 px-2 sm:px-6">
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground font-mono">
            No wait-time reports recorded in the last 14 days.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[210px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
                }}
                className="font-mono text-[10px] text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                className="font-mono text-[10px] text-muted-foreground"
              />
              <ChartTooltip
                cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(val) =>
                      new Date(val).toLocaleDateString("en-GB", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--chart-3)"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
