"use client";

import * as React from "react";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AdminNavSectionKey } from "../navConfig";

export interface StatTrend {
  value: number | string;
  label: string;
  positive?: boolean;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  section?: AdminNavSectionKey;
  trend?: StatTrend;
  badge?: React.ReactNode;
  sparkline?: React.ReactNode;
  countUp?: boolean;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  section = "overview",
  trend,
  badge,
  sparkline,
  countUp = true,
  onClick,
  active = false,
  className,
}: StatCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isPlainInteger = typeof value === "number" && Number.isInteger(value);
  const [displayValue, setDisplayValue] = React.useState<number | string>(() => {
    if (isPlainInteger && countUp && !shouldReduceMotion) {
      return 0;
    }
    return value;
  });

  React.useEffect(() => {
    if (!isPlainInteger || !countUp || shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const target = value as number;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 400; // ms
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, [value, isPlainInteger, countUp, shouldReduceMotion]);

  const formattedDisplay =
    typeof displayValue === "number"
      ? displayValue.toLocaleString()
      : displayValue;

  const finalAriaLabel = `${label}: ${typeof value === "number" ? value.toLocaleString() : value}${subtext ? ` - ${subtext}` : ""}`;

  const iconChipStyles = {
    overview: "text-primary bg-primary/10 border-primary/20",
    people: "text-admin-accent-people bg-admin-accent-people-subtle border-admin-accent-people-border",
    content: "text-admin-accent-content bg-admin-accent-content-subtle border-admin-accent-content-border",
    money: "text-admin-accent-money bg-admin-accent-money-subtle border-admin-accent-money-border",
    inbox: "text-admin-accent-inbox bg-admin-accent-inbox-subtle border-admin-accent-inbox-border",
    system: "text-muted-foreground bg-secondary/60 border-border",
  }[section];

  return (
    <div
      role={onClick ? "button" : "region"}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={finalAriaLabel}
      className={cn(
        "rounded-xl border bg-card p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 select-none",
        active
          ? "border-primary shadow-xs ring-1 ring-primary/20"
          : "border-border/70 shadow-xs hover:border-border hover:-translate-y-0.5 hover:shadow-sm",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Header: Label + Icon */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            iconChipStyles
          )}
        >
          {React.isValidElement(Icon) ? (
            Icon
          ) : typeof Icon === "function" || (typeof Icon === "object" && Icon !== null) ? (
            React.createElement(Icon as React.ComponentType<{ className?: string }>, {
              className: "h-4 w-4",
            })
          ) : null}
        </div>
      </div>

      {/* Metric Value */}
      <div className="mt-3">
        <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
          {formattedDisplay}
        </p>

        {/* Subtext, Badge, or Trend */}
        <div className="flex items-center gap-2 mt-2 min-h-[20px] flex-wrap">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-mono font-semibold rounded-full px-1.5 py-0.2 border",
                trend.positive ?? (typeof trend.value === "number" ? trend.value >= 0 : true)
                  ? "bg-admin-success-subtle text-admin-success-ink border-admin-success-border"
                  : "bg-admin-warning-subtle text-admin-warning-ink border-admin-warning-border"
              )}
            >
              {trend.positive ?? (typeof trend.value === "number" ? trend.value >= 0 : true) ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{typeof trend.value === "number" && trend.value > 0 ? `+${trend.value}` : trend.value}%</span>
            </span>
          )}

          {badge}

          {subtext && (
            <span className="text-xs text-muted-foreground truncate">
              {subtext}
            </span>
          )}
        </div>
      </div>

      {sparkline && <div className="mt-2.5 pt-2 border-t border-border/50">{sparkline}</div>}
    </div>
  );
}

