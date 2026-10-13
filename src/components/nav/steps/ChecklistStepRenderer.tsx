"use client";

import type { ChecklistStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
    <div className="space-y-5">
      <ul className="space-y-3">
        {step.items.map((item) => {
          const checked = checkedIds.includes(item.id);
          return (
            <li key={item.id}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border-hairline p-3.5 cursor-pointer transition-colors",
                  checked
                    ? "bg-accent/30 border-primary/30"
                    : "bg-card hover:bg-secondary/60"
                )}
                onClick={() => onToggle(item.id)}
              >
                <Checkbox
                  id={`check-${item.id}`}
                  checked={checked}
                  onCheckedChange={() => onToggle(item.id)}
                  className="mt-0.5"
                  aria-label={item.label}
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor={`check-${item.id}`}
                    className={cn(
                      "type-small cursor-pointer leading-snug",
                      checked
                        ? "text-foreground/70 line-through"
                        : "text-foreground"
                    )}
                  >
                    {item.label}
                  </Label>
                  {item.hint && (
                    <p className="type-caption text-muted-foreground normal-case tracking-normal">
                      {item.hint}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="type-caption text-muted-foreground normal-case tracking-normal">
        {checkedIds.length} of {step.items.length} checked
      </p>

      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onNext} disabled={!allChecked} size="sm">
          {isLast ? "Complete" : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
