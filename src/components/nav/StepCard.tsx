"use client";

import type { NavStep } from "@/types/nav";

interface StepCardProps {
  step: NavStep;
}

/** Safely extracts a body string from step types that have one. */
function getBody(step: NavStep): string | null {
  if (step.type === "info" || step.type === "link") return step.body;
  return null;
}

export function StepCard({ step }: StepCardProps) {
  const body = getBody(step);
  return (
    <div className="rounded-lg border border-border/70 bg-card p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/50 px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
          {step.type.replace(/-/g, " ")}
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
      {body && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
}
