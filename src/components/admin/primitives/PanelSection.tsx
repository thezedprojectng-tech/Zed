import * as React from "react";
import { cn } from "@/lib/utils";

export interface PanelSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PanelSection({
  title,
  description,
  action,
  children,
  className,
  ...props
}: PanelSectionProps) {
  return (
    <div className={cn("space-y-3.5", className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
          <div>
            {title && (
              <h3 className="text-sm font-medium tracking-tight text-foreground font-sans">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export interface FieldItemProps {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  hint?: string;
  className?: string;
  span?: 1 | 2;
  mono?: boolean;
}

export function FieldItem({
  label,
  value,
  children,
  hint,
  className,
  span = 1,
  mono = false,
}: FieldItemProps) {
  const content = value !== undefined ? value : children;
  const isEmpty = content === null || content === undefined || content === "";

  return (
    <div
      className={cn(
        "space-y-1 text-xs",
        span === 2 && "col-span-1 sm:col-span-2",
        className
      )}
    >
      <dt className="text-muted-foreground font-medium font-sans">{label}</dt>
      <dd
        className={cn(
          "text-foreground break-words",
          mono ? "font-mono" : "font-sans"
        )}
      >
        {isEmpty ? (
          <span className="text-muted-foreground italic font-sans">Not provided</span>
        ) : (
          content
        )}
      </dd>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">{hint}</p>}
    </div>
  );
}

export interface FieldListProps extends React.HTMLAttributes<HTMLDListElement> {
  columns?: 1 | 2;
  children: React.ReactNode;
  className?: string;
}

export function FieldList({
  columns = 2,
  children,
  className,
  ...props
}: FieldListProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-4 gap-y-3",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className
      )}
      {...props}
    >
      {children}
    </dl>
  );
}

export interface PanelHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  timestamp?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  title,
  subtitle,
  badge,
  timestamp,
  actions,
  className,
  ...props
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6 sm:py-5 shrink-0 bg-card max-h-[72px]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          {badge}
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate font-sans">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate font-sans">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {timestamp && (
          <span className="tabular-nums text-xs text-muted-foreground hidden sm:inline-block font-sans">
            {timestamp}
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}

export interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function PanelFooter({ children, className, ...props }: PanelFooterProps) {
  return (
    <div
      className={cn(
        "border-t border-border/70 px-5 py-3.5 sm:px-6 sm:py-4 bg-card/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
