"use client";

import type { DecisionStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

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
    <div className="space-y-5">
      <p className="type-body text-foreground/90 leading-relaxed">
        {step.question}
      </p>

      <ul className="space-y-2.5">
        {step.options.map((option) => (
          <li key={option.label}>
            <button
              onClick={() => onChoose(option.label)}
              className="w-full flex items-center justify-between rounded-lg border-hairline bg-card hover:bg-secondary/60 hover:border-primary/40 px-4 py-3.5 transition-all group text-left"
              aria-label={option.label}
            >
              <span className="type-body font-medium text-foreground group-hover:text-primary transition-colors">
                {option.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </li>
        ))}
      </ul>

      {onBack && (
        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
        </div>
      )}
    </div>
  );
}
