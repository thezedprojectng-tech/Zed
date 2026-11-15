"use client";

import type { ChecklistStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

interface ChecklistStepRendererProps {
  step: ChecklistStep;
  checkedIds: string[];
  onToggle: (itemId: string) => void;
  onNext: () => void;
  onBack: (() => void) | null;
  isLast: boolean;
}

export function ChecklistStepRenderer({
  step,
  checkedIds,
  onToggle,
  onNext,
  onBack,
  isLast,
}: ChecklistStepRendererProps) {
  const allChecked = step.items.every((item) => checkedIds.includes(item.id));

  return (
    <div className="space-y-6">
      <ul className="space-y-2.5">
        {step.items.map((item) => {
          const checked = checkedIds.includes(item.id);
          return (
            <li key={item.id}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3.5 min-h-[44px] cursor-pointer transition-colors select-none",
                  checked
                    ? "bg-[var(--data-verified-subtle)] border-[var(--data-verified-border)] text-foreground"
                    : "bg-card hover:bg-secondary/40 border-border/70 text-foreground"
                )}
                onClick={() => onToggle(item.id)}
              >
                <Checkbox
                  id={`check-${item.id}`}
                  checked={checked}
                  onCheckedChange={() => onToggle(item.id)}
                  className="mt-0.5 shrink-0"
                  aria-label={item.label}
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label
                    htmlFor={`check-${item.id}`}
                    className={cn(
                      "text-sm font-medium cursor-pointer leading-snug block",
                      checked
                        ? "text-muted-foreground line-through decoration-muted-foreground/60"
                        : "text-foreground"
                    )}
                  >
                    {item.label}
                  </Label>
                  {item.hint && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.hint}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground font-sans tabular-nums">
        {checkedIds.length} of {step.items.length} completed
      </p>

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
          disabled={!allChecked}
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
