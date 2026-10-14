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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

export interface FlowGuideStat {
  flow_id: string;
  name: string;
  started: number;
  completed: number;
}

interface FlowsGroupedBarChartProps {
  data: FlowGuideStat[];
}

const chartConfig = {
  started: {
    label: "Flows Started",
    color: "var(--chart-2)",
  },
  completed: {
    label: "Flows Completed",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function FlowsGroupedBarChart({ data }: FlowsGroupedBarChartProps) {
  const totalStarted = data.reduce((acc, d) => acc + d.started, 0);
  const totalCompleted = data.reduce((acc, d) => acc + d.completed, 0);
  const completionRate =
    totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Guide Completion Rates
            </CardTitle>
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-primary/30 bg-primary/10 text-primary px-1.5 py-0"
            >
              {completionRate}% AVG FINISH
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Civil guide engagement: started vs completed by citizens
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4 px-2 sm:px-6">
        {data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground font-mono">
            No guide progress entries recorded yet.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[230px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="font-sans text-[11px] text-muted-foreground font-medium"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                className="font-mono text-[10px] text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="started"
                name="Started"
                fill="var(--chart-2)"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
              />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="var(--chart-1)"
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
