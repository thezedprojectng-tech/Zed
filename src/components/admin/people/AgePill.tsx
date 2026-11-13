"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AgePillProps {
  submittedAt: string;
  className?: string;
}

function getRelativeAge(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 8) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function getUrgencyClass(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = diffMs / 3_600_000;
  if (diffHours >= 72)
    return "bg-[color:var(--data-negative-subtle)] text-[color:var(--data-negative-ink)] border border-[color:var(--data-negative-border)]";
  if (diffHours >= 24)
    return "bg-[color:var(--data-flows-subtle)] text-[color:var(--data-flows-ink)] border border-[color:var(--data-flows-border)]";
  return "bg-secondary text-muted-foreground border border-border";
}

/**
 * Shows relative age (e.g. "2h ago"). Turns amber after 24h, rose after 72h.
 * Updates every minute. Tooltip shows the full ISO datetime.
 */
export function AgePill({ submittedAt, className }: AgePillProps) {
  const [label, setLabel] = React.useState(() => getRelativeAge(submittedAt));
  const [urgency, setUrgency] = React.useState(() =>
    getUrgencyClass(submittedAt)
  );

  React.useEffect(() => {
    // Respect prefers-reduced-motion — still update text, but skip interval churn
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mq?.matches) return;

    const id = setInterval(() => {
      setLabel(getRelativeAge(submittedAt));
      setUrgency(getUrgencyClass(submittedAt));
    }, 60_000);

    return () => clearInterval(id);
  }, [submittedAt]);

  const fullDate = new Date(submittedAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <span
      title={fullDate}
      aria-label={`Submitted ${fullDate}`}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        urgency,
        className
      )}
    >
      {label}
    </span>
  );
}
