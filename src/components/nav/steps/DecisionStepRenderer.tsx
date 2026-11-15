"use client";

import type { DecisionStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface DecisionStepRendererProps {
  step: DecisionStep;
  onChoose: (label: string) => void;
  onBack: (() => void) | null;
}

export function DecisionStepRenderer({
  step,
  onChoose,
  onBack,
}: DecisionStepRendererProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm sm:text-base text-foreground/90 leading-relaxed max-w-[70ch]">
        {step.question}
      </p>

      <ul className="space-y-2.5">
        {step.options.map((option) => (
          <li key={option.label}>
            <button
              type="button"
              onClick={() => onChoose(option.label)}
              className="w-full flex items-center justify-between rounded-lg border border-border/70 bg-card hover:bg-secondary/40 hover:border-primary/40 px-4 py-3.5 min-h-[44px] transition-all group text-left"
              aria-label={option.label}
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {option.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 stroke-[1.5]" />
            </button>
          </li>
        ))}
      </ul>

      {onBack && (
        <div className="fixed bottom-0 left-0 right-0 z-30 sm:static bg-card/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-border/80 sm:border-0 p-4 sm:p-0 flex items-center justify-start gap-3 shadow-lg sm:shadow-none">
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
        </div>
      )}
    </div>
  );
}
