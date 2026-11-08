import Link from "next/link";
import { ArrowRight, Building2, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface VerifyAccountBannerProps {
  status: "none" | "pending" | "rejected";
}

export function VerifyAccountBanner({ status }: VerifyAccountBannerProps) {
  const config = {
    none: {
      message:
        "We now verify accounts with a bank account. Verify yours to withdraw and to keep your marketplace limits.",
      buttonLabel: "Verify account",
      icon: Building2,
      accentClass: "bg-primary",
      iconClass: "text-primary bg-primary/10 border-primary/20",
    },
    pending: {
      message: "Your bank verification is under review.",
      buttonLabel: "View status",
      icon: Clock,
      accentClass: "bg-amber-500",
      iconClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    rejected: {
      message:
        "Your bank verification was not approved. Open it to see why and resubmit.",
      buttonLabel: "View status",
      icon: AlertCircle,
      accentClass: "bg-destructive",
      iconClass: "text-destructive bg-destructive/10 border-destructive/20",
    },
  }[status];

  const Icon = config.icon;

  return (
    <aside aria-label="Account verification notice" className="relative">
      <Card className="p-0 border-hairline bg-card relative overflow-hidden">
        <div
          className={`absolute inset-x-0 top-0 h-[2px] ${config.accentClass} rounded-t-xl`}
        />
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${config.iconClass}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {config.message}
            </p>
          </div>
          <div className="shrink-0">
            <Button asChild size="sm" className="gap-2 font-medium">
              <Link href="/verify">
                <span>{config.buttonLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </aside>
  );
}

