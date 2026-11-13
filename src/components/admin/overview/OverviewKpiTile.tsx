"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DataRole = "users" | "verified" | "signups" | "flows" | "mining" | "negative";

export interface DeltaComparison {
  value: number; // percentage, e.g. 25 for +25% or -12 for -12%
  label: string; // e.g. "vs prev 7d"
}

export interface OverviewKpiTileProps {
  label: string;
  value: number | string; // Plain integer (counts up) or preformatted string like ZED amount
  isCountUp?: boolean; // Only true for plain integer counts
  subtext?: string;
  badge?: React.ReactNode;
  delta?: DeltaComparison;
  icon: LucideIcon;
  role: DataRole;
  sparklineData?: { date: string; count: number }[];
  className?: string;
}

function roleStyles(role: DataRole) {
  switch (role) {
    case "users":
      return {
        chip: "text-data-users bg-data-users-subtle border-data-users-border",
        stroke: "var(--data-users)",
      };
    case "verified":
      return {
        chip: "text-data-verified bg-data-verified-subtle border-data-verified-border",
        stroke: "var(--data-verified)",
      };
    case "signups":
      return {
        chip: "text-data-signups bg-data-signups-subtle border-data-signups-border",
        stroke: "var(--data-signups)",
      };
    case "flows":
      return {
        chip: "text-data-flows bg-data-flows-subtle border-data-flows-border",
        stroke: "var(--data-flows)",
      };
    case "mining":
      return {
        chip: "text-data-mining bg-data-mining-subtle border-data-mining-border",
        stroke: "var(--data-mining)",
      };
    case "negative":
      return {
        chip: "text-data-negative bg-data-negative-subtle border-data-negative-border",
        stroke: "var(--data-negative)",
      };
  }
}

/**
 * Lightweight SVG area sparkline for Total Users tile
 */
function MiniAreaSparkline({
  data,
  strokeColor,
}: {
  data: { count: number }[];
  strokeColor: string;
}) {
  if (!data || data.length < 2) return null;

  const width = 120;
  const height = 32;
  const padding = 2;

  const counts = data.map((d) => d.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.count - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-24 h-7 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="kpi-sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#kpi-sparkline-gradient)" />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[10px] text-muted-foreground/80 font-medium">14d trend</span>
    </div>
  );
}

export function OverviewKpiTile({
  label,
  value,
  isCountUp = false,
  subtext,
  badge,
  delta,
  icon: Icon,
  role,
  sparklineData,
  className,
}: OverviewKpiTileProps) {
  const shouldReduceMotion = useReducedMotion();
  const styles = roleStyles(role);

  // Integer count-up logic
  const isNumeric = typeof value === "number" && Number.isInteger(value);
  const shouldAnimate = isNumeric && isCountUp && !shouldReduceMotion;

  const [displayValue, setDisplayValue] = React.useState<number | string>(() =>
    shouldAnimate ? 0 : value
  );

  React.useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value);
      return;
    }

    const target = value as number;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 350; // ms
    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, shouldAnimate]);

  const formattedDisplay =
    typeof displayValue === "number"
      ? displayValue.toLocaleString()
      : displayValue;

  const ariaValue =
    typeof value === "number" ? value.toLocaleString() : String(value);
  const fullAriaLabel = `${label}: ${ariaValue}${subtext ? ` (${subtext})` : ""}`;

  return (
    <motion.div
      variants={{
        hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: shouldReduceMotion ? 0 : 0.22,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
      aria-label={fullAriaLabel}
      className={cn(
        "rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between",
        "transition-all duration-200",
        "hover:border-border hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      {/* Top row: Sentence-case label & Icon chip */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground select-none">
          {label}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            styles.chip
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>

      {/* Middle row: Large tabular-nums value */}
      <div className="mt-3 mb-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono tabular-nums">
          {formattedDisplay}
        </div>
      </div>

      {/* Bottom row: Delta comparison, badge, subtext, or sparkline */}
      <div className="mt-auto pt-1 flex items-center justify-between gap-2 flex-wrap min-h-[22px]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Delta pill only where real comparison exists */}
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-1.5 py-0.5 border tabular-nums select-none",
                delta.value >= 0
                  ? "bg-data-verified-subtle text-data-verified-ink border-data-verified-border"
                  : "bg-data-negative-subtle text-data-negative-ink border-data-negative-border"
              )}
            >
              {delta.value >= 0 ? (
                <TrendingUp className="h-3 w-3" strokeWidth={2} />
              ) : (
                <TrendingDown className="h-3 w-3" strokeWidth={2} />
              )}
              <span>
                {delta.value >= 0 ? `+${delta.value}%` : `${delta.value}%`}
              </span>
              <span className="text-[10px] font-normal opacity-90">{delta.label}</span>
            </span>
          )}

          {badge}

          {subtext && !delta && (
            <span className="text-xs text-muted-foreground select-none">
              {subtext}
            </span>
          )}
        </div>

        {/* Optional sparkline for Total users */}
        {sparklineData && (
          <MiniAreaSparkline data={sparklineData} strokeColor={styles.stroke} />
        )}
      </div>
    </motion.div>
  );
}

