import { Check } from "lucide-react";
import { isVerifiedBadgeEnabled } from "@/lib/verification/flags";

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
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 ${className}`}
      >
        <Check className="h-2.5 w-2.5 stroke-[2.5]" />
        <span>Verified</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border bg-muted/50 border-border/80 text-muted-foreground ${className}`}
    >
      <span>Not verified</span>
    </span>
  );
}
