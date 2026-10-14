"use client";

import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
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

interface VerificationDonutChartProps {
  verified: number;
  unverified: number;
}

const chartConfig = {
  verified: {
    label: "Verified Citizens",
    color: "var(--chart-1)",
  },
  unverified: {
    label: "Unverified Citizens",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function VerificationDonutChart({
  verified,
  unverified,
}: VerificationDonutChartProps) {
  const total = verified + unverified;
  const rate = total > 0 ? Math.round((verified / total) * 100) : 0;

  const chartData = useMemo(
    () => [
      { status: "verified", count: verified, fill: "var(--chart-1)" },
      { status: "unverified", count: unverified, fill: "var(--chart-3)" },
    ],
    [verified, unverified]
  );

  return (
    <Card className="border-border bg-card shadow-xs flex flex-col">
      <CardHeader className="pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            Identity Verification
          </CardTitle>
          <Badge
            variant="outline"
            className="font-mono text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-1.5 py-0"
          >
            {rate}% VERIFIED
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          NIN-verified vs pending verification status
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-4 pt-2">
        {total === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground font-mono">
            No citizen accounts registered yet.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[220px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                outerRadius={80}
                strokeWidth={2}
                stroke="var(--card)"
                animationDuration={500}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold font-mono"
                          >
                            {total.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
                            className="fill-muted-foreground text-[10px] font-mono uppercase tracking-wider"
                          >
                            TOTAL USERS
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
