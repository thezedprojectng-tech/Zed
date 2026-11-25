import Link from "next/link";
import { ArrowRight, Building2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VerifyAccountBannerProps {
  status: "none" | "pending" | "rejected";
}

export function VerifyAccountBanner({ status }: VerifyAccountBannerProps) {
  const config = {
    none: {
      message:
        "Confirm your bank account before withdrawing ZED and to unlock higher Zed Market limits.",
      buttonLabel: "Verify account",
      icon: Building2,
      accentBar: "bg-primary",
      iconClass: "border-primary/25 bg-primary/10 text-primary",
    },
    pending: {
      message: "Your bank verification is in review.",
      buttonLabel: "View status",
      icon: Clock,
      accentBar: "bg-amber-500",
      iconClass:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    rejected: {
      message:
        "Your bank verification was not approved. Open it to see the reason and resubmit.",
      buttonLabel: "View status",
      icon: AlertCircle,
      accentBar: "bg-rose-500",
      iconClass:
        "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    },
  }[status];

  const Icon = config.icon;

  return (
    <aside aria-label="Account verification notice" className="relative">
      <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card motion-safe:transition-colors duration-200">
        <div
          className={cn("absolute inset-x-0 top-0 h-[2px]", config.accentBar)}
        />
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                config.iconClass
              )}
            >
              <Icon className="h-4 w-4 stroke-[1.5]" />
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {config.message}
            </p>
          </div>
          <div className="shrink-0 pl-12 sm:pl-0">
            <Button
              asChild
              size="sm"
              className="gap-2 font-medium rounded-lg h-9"
            >
              <Link href="/verify">
                <span>{config.buttonLabel}</span>
                <ArrowRight className="h-4 w-4 stroke-[1.5]" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
