"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FilterOption<T extends string> {
  value?: T;
  id?: T;
  label: string;
  count?: number;
  icon?: React.ElementType;
}

export interface SegmentedControlProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel = "Filter options",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/70 overflow-x-auto max-w-full select-none",
        className
      )}
    >
      {options.map((opt) => {
        const optValue = (opt.value ?? opt.id) as T;
        const isActive = optValue === value;
        const Icon = opt.icon;

        return (
          <button
            key={optValue}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(optValue)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150 shrink-0 whitespace-nowrap min-h-[36px] sm:min-h-[38px] px-3",
              size === "sm" ? "text-xs py-1.5" : "text-xs sm:text-sm py-2",
              isActive
                ? "bg-card text-foreground font-semibold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={cn(
                  "font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

