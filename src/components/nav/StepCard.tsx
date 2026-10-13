"use client";

import type { NavStep } from "@/types/nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card className="border-hairline bg-card p-5 space-y-2">
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="font-mono text-[10px] uppercase tracking-wide border-border text-muted-foreground"
        >
          {step.type}
        </Badge>
      </div>
      <h3 className="type-h3 text-foreground">{step.title}</h3>
      {body && (
        <p className="type-body text-muted-foreground text-sm leading-relaxed">
          {body}
        </p>
      )}
    </Card>
  );
}
