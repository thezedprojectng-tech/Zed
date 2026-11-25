import { Check } from "lucide-react";
import { isVerifiedBadgeEnabled } from "@/lib/verification/flags";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  className?: string;
}

/**
 * Renders a "Verified" pill or a neutral "Not verified" tag.
 * Automatically hidden if NEXT_PUBLIC_SHOW_VERIFIED_BADGE !== "true".
 */
export function VerifiedBadge({
  isVerified,
  className = "",
}: VerifiedBadgeProps) {
  if (!isVerifiedBadgeEnabled()) {
    return null;
  }

  if (isVerified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]",
          className
        )}
      >
        <Check className="h-3 w-3 stroke-[2]" />
        <span>Verified</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border border-border/70 bg-secondary/50 text-muted-foreground",
        className
      )}
    >
      <span>Not verified</span>
    </span>
  );
}
