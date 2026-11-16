"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: HeaderProps) {
  return (
    <header className={cn("space-y-1.5 pb-2", className)}>
      {backHref && (
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}
