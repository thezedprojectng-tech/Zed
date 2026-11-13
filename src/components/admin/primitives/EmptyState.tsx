import * as React from "react";
import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-card/40 text-center flex flex-col items-center justify-center",
        compact ? "p-8 space-y-2.5" : "p-12 sm:p-16 space-y-3.5",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 border border-border/60 text-muted-foreground shadow-2xs">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

