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

export interface LevelDataPoint {
  level: string; // "Lvl 1", "Lvl 2", etc.
  count: number;
}

interface CivicLevelBarChartProps {
  data: LevelDataPoint[];
}

const chartConfig = {
  count: {
    label: "Citizens",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function CivicLevelBarChart({ data }: CivicLevelBarChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card className="border-border bg-card shadow-xs flex flex-col">
      <CardHeader className="pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            Users by Civic Level
          </CardTitle>
          <Badge
            variant="outline"
            className="font-mono text-[10px] border-violet-500/30 bg-violet-500/10 text-violet-400 px-1.5 py-0"
          >
            5 TIERS
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Distribution of citizens across progression levels (1 to 5)
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-4 pt-2">
        {total === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground font-mono">
            No citizen levels recorded yet.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.6} />
              <YAxis
                dataKey="level"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="font-mono text-[11px] text-muted-foreground font-medium"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                className="font-mono text-[10px] text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--chart-4)"
                radius={[0, 4, 4, 0]}
                animationDuration={500}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
