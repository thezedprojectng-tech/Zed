import * as React from "react";
import {
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Archive,
  User,
  Clock,
  Globe,
  EyeOff,
  AlertTriangle,
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
  | "neutral"
  | "reviewing"
  | "accepted"
  | "waitlisted"
  | "declined"
  | "published"
  | "unpublished"
  | "draft"
  | "expired";

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

    case "reviewing":
      return {
        icon: <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: "Reviewing",
        style:
          "bg-[color:var(--data-flows-subtle)] text-[color:var(--data-flows-ink)] border border-[color:var(--data-flows-border)]",
      };

    case "approved":
    case "accepted":
    case "verified":
      return {
        icon: <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label:
          variant === "accepted"
            ? "Accepted"
            : variant === "approved"
            ? "Approved"
            : "Verified",
        style:
          "bg-[color:var(--data-verified-subtle)] text-[color:var(--data-verified-ink)] border border-[color:var(--data-verified-border)]",
      };

    case "published":
      return {
        icon: <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: "Published",
        style:
          "bg-[color:var(--data-verified-subtle)] text-[color:var(--data-verified-ink)] border border-[color:var(--data-verified-border)]",
      };

    case "rejected":
    case "declined":
      return {
        icon: <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: variant === "declined" ? "Declined" : "Rejected",
        style:
          "bg-[color:var(--data-negative-subtle)] text-[color:var(--data-negative-ink)] border border-[color:var(--data-negative-border)]",
      };

    case "waitlisted":
      return {
        dot: <Dot className="bg-[color:var(--data-signups)]" />,
        label: "Waitlisted",
        style:
          "bg-[color:var(--data-signups-subtle)] text-[color:var(--data-signups-ink)] border border-[color:var(--data-signups-border)]",
      };

    case "new":
      return {
        dot: <Dot className="bg-[color:var(--data-signups)]" />,
        label: "New",
        style:
          "bg-[color:var(--data-signups-subtle)] text-[color:var(--data-signups-ink)] border border-[color:var(--data-signups-border)]",
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

    case "unpublished":
      return {
        icon: <EyeOff className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: "Unpublished",
        style:
          "bg-secondary text-muted-foreground border border-border",
      };

    case "draft":
      return {
        dot: <Dot className="bg-muted-foreground/60" />,
        label: "Draft",
        style:
          "bg-secondary text-muted-foreground border border-border",
      };

    case "expired":
      return {
        icon: <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />,
        label: "Expired",
        style:
          "bg-secondary text-muted-foreground border border-border",
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
