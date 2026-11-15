"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Copy,
  Check,
  Gift,
  Clock,
  Coins,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/data/socials";
import { buildWhatsAppShareUrl, ensureAbsoluteLink } from "@/lib/referrals/helpers";
import { applyReferralAction } from "@/lib/referrals/actions";
import { pluralize } from "@/lib/utils";
import type {
  ReferralStatus,
  UserReferralOverview,
} from "@/lib/referrals/types";

interface ReferralsClientProps {
  overview: UserReferralOverview;
}

export function ReferralsClient({ overview }: ReferralsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const {
    referralCode,
    referralLink,
    settings,
    stats,
    isEligibleToEnterCode,
    referredUsers,
  } = overview;

  const absoluteReferralLink = ensureAbsoluteLink(referralLink);

  // Auto-apply referral code from localStorage if available and eligible
  useEffect(() => {
    if (!isEligibleToEnterCode) return;
    try {
      const raw = localStorage.getItem("zed_ref_code");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.code && parsed.expiresAt > Date.now()) {
          startTransition(async () => {
            const res = await applyReferralAction(parsed.code);
            localStorage.removeItem("zed_ref_code");
            if (res.ok) {
              toast.success("Referral code linked! Your reward is paid when you make your first mining claim.");
              router.refresh();
            }
          });
        } else {
          localStorage.removeItem("zed_ref_code");
        }
      }
    } catch {
      /* ignore */
    }
  }, [isEligibleToEnterCode, router]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Could not copy code.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(absoluteReferralLink);
      setCopiedLink(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleApplyManualCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error("Please enter a referral code.");
      return;
    }

    startTransition(async () => {
      const res = await applyReferralAction(manualCode.trim());
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Referral code linked! Your reward is paid when you make your first mining claim.");
      setManualCode("");
      router.refresh();
    });
  };

  const renderStatusBadge = (status: ReferralStatus, reward: number) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Pending first claim
          </span>
        );
      case "rewarded":
        return (
          <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
            +{reward > 0 ? reward : settings.referrer_reward_zed} ZED rewarded
          </span>
        );
      case "capped":
        return (
          <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Limit reached
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <section className="space-y-1 pb-2">
        <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
          Invite friends
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Invite friends to Zed. You earn bonus ZED when they verify their account and make their first claim.
        </p>
      </section>

      {/* ── Disabled / Coming Soon Callout (if disabled) ──────────── */}
      {!settings.enabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Referral rewards opening soon</p>
            <p className="text-muted-foreground leading-relaxed">
              Bonus point payouts are currently being finalized. You can start inviting friends today; reward bonuses will credit automatically once the program is officially enabled.
            </p>
          </div>
        </div>
      )}

      {/* ── 2. Referral Link & Code Share Card ─────────────────────── */}
      <section className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 space-y-5 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-users)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 stroke-[1.5] text-[var(--data-users)]" />
              <span>Your invite code</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Give this code to friends or share your personalized sign-up link.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-10 px-4 rounded-lg bg-secondary border border-border/70 font-mono text-base font-bold text-foreground flex items-center justify-center">
              {referralCode || "—"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="h-10 px-3 text-xs gap-1.5 border-border/70"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy code</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Link field + Share CTAs */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <Label className="text-xs font-medium text-foreground">
            Invite link
          </Label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              readOnly
              value={absoluteReferralLink}
              className="font-mono text-xs h-10 select-all bg-secondary/30 border-border/70"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none h-10 text-xs gap-1.5 border-border/70"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy link</span>
                  </>
                )}
              </Button>

              <Button
                asChild
                size="sm"
                className="flex-1 sm:flex-none h-10 text-xs gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white"
              >
                <a
                  href={buildWhatsAppShareUrl(referralCode, absoluteReferralLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>Share on WhatsApp</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Summary Tiles (Only numbers that exist today) ──────── */}
      <section aria-label="Referral metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Friends Invited */}
        <div className="rounded-lg border border-border/70 bg-card p-5 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-users)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Friends invited
            </span>
            <Users className="h-4 w-4 stroke-[1.5] text-[var(--data-users)]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-sans tabular-nums text-foreground">
              {stats.totalInvited}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans tabular-nums">
              {stats.pendingCount} awaiting first claim
            </p>
          </div>
        </div>

        {/* Verified / Rewarded Friends */}
        <div className="rounded-lg border border-border/70 bg-card p-5 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-verified)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Verified friends
            </span>
            <ShieldCheck className="h-4 w-4 stroke-[1.5] text-[var(--data-verified)]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-sans tabular-nums text-foreground">
              {stats.totalRewarded}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans tabular-nums">
              Max cap: {settings.max_rewarded_per_referrer}
            </p>
          </div>
        </div>

        {/* Bonus Earned */}
        <div className="rounded-lg border border-border/70 bg-card p-5 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-flows)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Bonus earned
            </span>
            <Coins className="h-4 w-4 stroke-[1.5] text-[var(--data-flows)]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-sans tabular-nums text-foreground">
              {stats.totalEarnedZed.toLocaleString()} ZED
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans tabular-nums">
              +{settings.referrer_reward_zed} ZED per friend who starts mining
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. "Have a code?" Section (When eligible) ─────────────── */}
      {isEligibleToEnterCode && (
        <section className="rounded-lg border border-border/70 bg-secondary/20 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-foreground">
                Were you invited by a friend?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your friend&apos;s referral code before your first mining claim. You and your referrer will both be rewarded after your first claim.
              </p>
            </div>
          </div>

          <form onSubmit={handleApplyManualCode} className="flex gap-2 pt-1 max-w-md">
            <Input
              type="text"
              placeholder="Enter 8-character code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              disabled={isPending}
              maxLength={20}
              className="font-mono text-xs uppercase h-10 border-border/70 bg-card"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isPending || manualCode.trim().length < 3}
              className="text-xs h-10 px-4 shrink-0"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 mr-1" />
              )}
              Apply code
            </Button>
          </form>
        </section>
      )}

      {/* ── 5. Referred Friends List ──────────────────────────────── */}
      <section aria-label="Invited friends list" className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Invited friends ({referredUsers.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track friends who joined using your invite code and their claim status.
          </p>
        </div>

        {referredUsers.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card p-8 text-center space-y-3">
            <Users className="h-6 w-6 stroke-[1.5] text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Invite friends to earn bonus ZED
              </p>
              <p className="text-xs text-muted-foreground">
                Share your invite code or link to begin earning rewards when friends verify.
              </p>
            </div>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="text-xs border-border/70 gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedLink ? "Copied invite link" : "Copy invite link"}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Invited friend</th>
                    <th className="text-left px-4 py-3 font-medium">Date joined</th>
                    <th className="text-right px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {referredUsers.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.masked_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-sans tabular-nums">
                        {new Date(item.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {renderStatusBadge(item.status, item.reward_earned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
