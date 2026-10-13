"use client";

import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, className, actions }: HeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-hairline-b bg-card/30 px-4 py-5 md:px-8 backdrop-blur-xs",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="type-h1 text-foreground">{title}</h1>
        {subtitle && (
          <p className="type-small text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
