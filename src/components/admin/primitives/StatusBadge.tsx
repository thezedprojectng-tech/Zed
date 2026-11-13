import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface StatusBadgeConfig {
  variant: StatusVariant;
  label?: string;
  pulse?: boolean;
}

export interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: StatusVariant;
  variantMap?: Record<string, StatusBadgeConfig>;
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  label,
  variant,
  variantMap,
  pulse = false,
  size = "sm",
  className,
}: StatusBadgeProps) {
  // If a per-page map is provided, resolve config from it
  const mappedConfig = variantMap ? variantMap[status.toLowerCase()] : undefined;

  const resolvedVariant: StatusVariant =
    variant ?? mappedConfig?.variant ?? "neutral";
  const resolvedLabel: string =
    label ?? mappedConfig?.label ?? status;
  const shouldPulse: boolean = pulse || Boolean(mappedConfig?.pulse);

  const variantStyles: Record<StatusVariant, string> = {
    success:
      "bg-admin-success-subtle text-admin-success-ink border-admin-success-border",
    warning:
      "bg-admin-warning-subtle text-admin-warning-ink border-admin-warning-border",
    danger:
      "bg-admin-danger-subtle text-admin-danger-ink border-admin-danger-border",
    info:
      "bg-admin-info-subtle text-admin-info-ink border-admin-info-border",
    neutral:
      "bg-secondary/70 text-muted-foreground border-border",
  };

  const pulseDotStyles: Record<StatusVariant, string> = {
    success: "bg-admin-success",
    warning: "bg-admin-warning",
    danger: "bg-admin-danger",
    info: "bg-admin-info",
    neutral: "bg-muted-foreground",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono uppercase font-semibold tracking-wider",
        variantStyles[resolvedVariant],
        sizeStyles,
        className
      )}
    >
      {shouldPulse && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse shrink-0",
            pulseDotStyles[resolvedVariant]
          )}
          aria-hidden="true"
        />
      )}
      <span>{resolvedLabel}</span>
    </span>
  );
}

