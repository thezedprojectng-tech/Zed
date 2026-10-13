"use client";

import type { InfoStep } from "@/types/nav";
import { AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfoStepRendererProps {
  step: InfoStep;
  onNext: () => void;
  onBack: (() => void) | null;
  isLast: boolean;
}

export function InfoStepRenderer({
  step,
  onNext,
  onBack,
  isLast,
}: InfoStepRendererProps) {
  return (
    <div className="space-y-5">
      {/* Body */}
      <p className="type-body text-foreground/90 leading-relaxed whitespace-pre-line">
        {step.body}
      </p>

      {/* Tips */}
      {step.tips && step.tips.length > 0 && (
        <div className="rounded-lg border-hairline bg-accent/40 p-4 space-y-2">
          <div className="flex items-center gap-2 text-accent-foreground">
            <Lightbulb className="h-3.5 w-3.5 shrink-0" />
            <span className="type-caption text-accent-foreground">Tips</span>
          </div>
          <ul className="space-y-1.5">
            {step.tips.map((tip, i) => (
              <li key={i} className="type-small text-muted-foreground flex gap-2">
                <span className="text-accent-foreground mt-0.5">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning */}
      {step.warning && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="type-small text-destructive/90 leading-relaxed">
            {step.warning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onNext} size="sm">
          {isLast ? "Complete" : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
