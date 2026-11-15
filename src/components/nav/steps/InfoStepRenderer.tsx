"use client";

import type { InfoStep } from "@/types/nav";
import { AlertTriangle, Lightbulb, ArrowRight, ArrowLeft } from "lucide-react";
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
    <div className="space-y-6">
      {/* Body in readable column */}
      <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line max-w-[70ch]">
        {step.body}
      </p>

      {/* Tips: flat callout with left accent */}
      {step.tips && step.tips.length > 0 && (
        <aside
          aria-label="Important tips"
          className="rounded-r-lg border-l-4 border-l-[var(--data-flows)] bg-secondary/30 p-4 space-y-2.5"
        >
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
            <Lightbulb className="h-4 w-4 text-[var(--data-flows)] shrink-0 stroke-[1.5]" />
            <span>Important tips</span>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {step.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="text-[var(--data-flows)] font-bold">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Warning: flat callout with left accent */}
      {step.warning && (
        <aside
          aria-label="Critical notice"
          className="rounded-r-lg border-l-4 border-l-destructive bg-destructive/10 p-4 flex gap-3 text-xs text-destructive/90"
        >
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5 stroke-[1.5]" />
          <p className="leading-relaxed font-medium">{step.warning}</p>
        </aside>
      )}

      {/* Primary Next / secondary Back in sticky bottom bar on phones */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:static bg-card/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-border/80 sm:border-0 p-4 sm:p-0 flex items-center justify-between gap-3 shadow-lg sm:shadow-none">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onBack}
            className="h-10 px-4 text-xs font-medium border-border/70 hover:bg-secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
            <span>Back</span>
          </Button>
        ) : (
          <span />
        )}

        <Button
          type="button"
          onClick={onNext}
          size="default"
          className="h-10 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>{isLast ? "Complete guide" : "Next step"}</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1.5 stroke-[1.5]" />
        </Button>
      </div>
    </div>
  );
}
