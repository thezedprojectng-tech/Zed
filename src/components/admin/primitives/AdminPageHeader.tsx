import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminNavSectionKey } from "../navConfig";

export interface AdminPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  section?: AdminNavSectionKey;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  section = "overview",
  badge,
  actions,
  className,
}: AdminPageHeaderProps) {
  const iconChipStyles = {
    overview: "text-primary bg-primary/10 border-primary/20",
    people: "text-admin-accent-people bg-admin-accent-people-subtle border-admin-accent-people-border",
    content: "text-admin-accent-content bg-admin-accent-content-subtle border-admin-accent-content-border",
    money: "text-admin-accent-money bg-admin-accent-money-subtle border-admin-accent-money-border",
    inbox: "text-admin-accent-inbox bg-admin-accent-inbox-subtle border-admin-accent-inbox-border",
    system: "text-muted-foreground bg-secondary/60 border-border",
  }[section];

  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/70",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs mt-0.5 sm:mt-0",
            iconChipStyles
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center pt-2 sm:pt-0">
          {actions}
        </div>
      )}
    </header>
  );
}

