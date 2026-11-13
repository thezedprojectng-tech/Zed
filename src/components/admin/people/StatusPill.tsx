import * as React from "react";
import {
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Archive,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusPillVariant =
  | "pending"
  | "approved"
  | "verified"
  | "rejected"
  | "new"
  | "read"
  | "archived"
  | "admin"
  | "user"
  | "neutral";

export interface StatusPillProps {
  variant: StatusPillVariant;
  size?: "sm" | "md";
  label?: string; // override default label
  className?: string;
}

/** Dot indicator used for pending / new / neutral variants */
function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-1.5 w-1.5 rounded-full shrink-0", className)}
    />
  );
}

type PillConfig = {
  icon?: React.ReactNode;
  dot?: React.ReactNode;
  label: string;
  /** Tailwind classes for background, text, and optional border */
  style: string;
};

function getConfig(variant: StatusPillVariant): PillConfig {
  switch (variant) {
    case "pending":
      return {
        dot: (
          <Dot className="bg-[color:var(--data-flows)]" />
        ),
        label: "Pending",
        style:
          "bg-[color:var(--data-flows-subtle)] text-[color:var(--data-flows-ink)] border border-[color:var(--data-flows-border)]",
      };

    case "approved":
    case "verified":
      return {
        icon: <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: variant === "approved" ? "Approved" : "Verified",
        style:
          "bg-[color:var(--data-verified-subtle)] text-[color:var(--data-verified-ink)] border border-[color:var(--data-verified-border)]",
      };

    case "rejected":
      return {
        icon: <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: "Rejected",
        style:
          "bg-[color:var(--data-negative-subtle)] text-[color:var(--data-negative-ink)] border border-[color:var(--data-negative-border)]",
      };

    case "new":
      return {
        dot: <Dot className="bg-[color:var(--data-users)]" />,
        label: "New",
        style:
          "bg-[color:var(--data-users-subtle)] text-[color:var(--data-users-ink)] border border-[color:var(--data-users-border)]",
      };

    case "read":
      return {
        icon: (
          <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
        ),
        label: "Read",
        style:
          "bg-secondary text-foreground/70 border border-border",
      };

    case "archived":
      return {
        icon: <Archive className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: "Archived",
        style:
          "bg-secondary text-muted-foreground border border-border",
      };

    case "admin":
      return {
        icon: (
          <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
        ),
        label: "Admin",
        style:
          "bg-[color:var(--data-flows-subtle)] text-[color:var(--data-flows-ink)] border border-[color:var(--data-flows-border)]",
      };

    case "user":
      return {
        icon: <User className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: "Citizen",
        style:
          "bg-secondary text-muted-foreground/80 border border-border",
      };

    case "neutral":
    default:
      return {
        dot: <Dot className="bg-muted-foreground/60" />,
        label: variant,
        style:
          "bg-secondary text-muted-foreground border border-border",
      };
  }
}

const sizeClasses: Record<"sm" | "md", string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

export function StatusPill({
  variant,
  size = "sm",
  label: labelOverride,
  className,
}: StatusPillProps) {
  const config = getConfig(variant);
  const displayLabel = labelOverride ?? config.label;
  const leading = config.icon ?? config.dot;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
        sizeClasses[size],
        config.style,
        className
      )}
    >
      {leading}
      {displayLabel}
    </span>
  );
}
