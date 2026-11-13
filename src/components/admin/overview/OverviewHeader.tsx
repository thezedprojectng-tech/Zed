"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type RangeOption = "7d" | "30d" | "90d";

interface OverviewHeaderProps {
  range: RangeOption;
  onRangeChange: (range: RangeOption) => void;
  updatedAt?: string;
}

export function OverviewHeader({
  range,
  onRangeChange,
  updatedAt,
}: OverviewHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const [displayDate, setDisplayDate] = React.useState<string>("");
  const [displayTime, setDisplayTime] = React.useState<string>("");

  React.useEffect(() => {
    setMounted(true);
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(now);

    const formattedTime =
      updatedAt ||
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);

    setDisplayDate(formattedDate);
    setDisplayTime(formattedTime);
  }, [updatedAt]);

  const ranges: RangeOption[] = ["7d", "30d", "90d"];

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <span>{mounted ? displayDate : "Today"}</span>
          <span className="text-muted-foreground/40 font-normal">·</span>
          <span>Updated {mounted ? displayTime : "just now"}</span>
        </p>
      </div>

      {/* Range control toggle with animated indicator */}
      <div
        role="group"
        aria-label="Overview date range filter"
        className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 self-start sm:self-auto"
      >
        {ranges.map((r) => {
          const isSelected = range === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              aria-pressed={isSelected}
              className={cn(
                "relative px-3 py-1 text-xs font-medium transition-colors rounded-md tabular-nums select-none",
                isSelected
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="overview-range-pill"
                  className="absolute inset-0 rounded-md bg-card shadow-xs border border-border/80"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", bounce: 0.15, duration: 0.3 }
                  }
                />
              )}
              <span className="relative z-10">{r}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

