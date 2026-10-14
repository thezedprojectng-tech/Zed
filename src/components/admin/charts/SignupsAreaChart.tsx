"use client";

import { useState, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface SignupDataPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

interface SignupsAreaChartProps {
  data90d: SignupDataPoint[];
}

const chartConfig = {
  signups: {
    label: "Citizen Signups",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SignupsAreaChart({ data90d }: SignupsAreaChartProps) {
  const [range, setRange] = useState<"7" | "30" | "90">("30");

  const filteredData = useMemo(() => {
    const days = parseInt(range, 10);
    return data90d.slice(-days);
  }, [data90d, range]);

  // Calculate trend (% change between current period and previous equal period)
  const trend = useMemo(() => {
    const days = parseInt(range, 10);
    const currentSlice = data90d.slice(-days);
    const prevSlice = data90d.slice(-days * 2, -days);

    const currentTotal = currentSlice.reduce((acc, d) => acc + d.count, 0);
    const prevTotal = prevSlice.reduce((acc, d) => acc + d.count, 0);

    if (prevTotal === 0) {
      return { diff: currentTotal > 0 ? 100 : 0, isPositive: true };
    }
    const diff = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
    return { diff: Math.abs(diff), isPositive: diff >= 0 };
  }, [data90d, range]);

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Signups Over Time
            </CardTitle>
            <Badge
              variant="outline"
              className={`font-mono text-[10px] gap-1 px-1.5 py-0 ${
                trend.isPositive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {trend.isPositive ? "+" : "-"}
                {trend.diff}% vs prev {range}d
              </span>
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Daily citizen account registrations across Nigeria
          </CardDescription>
        </div>

        {/* Range Selector */}
        <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "30" | "90")}>
          <TabsList className="h-7 bg-secondary/80 border border-border p-0.5">
            <TabsTrigger value="7" className="text-[11px] px-2 py-0.5 font-mono">
              7d
            </TabsTrigger>
            <TabsTrigger value="30" className="text-[11px] px-2 py-0.5 font-mono">
              30d
            </TabsTrigger>
            <TabsTrigger value="90" className="text-[11px] px-2 py-0.5 font-mono">
              90d
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-4 px-2 sm:px-6">
        {filteredData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground font-mono">
            No signup data recorded for this window.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[230px] w-full">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillSignups" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
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
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(val) =>
                      new Date(val).toLocaleDateString("en-GB", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Citizen Signups"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fillSignups)"
                animationDuration={500}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
