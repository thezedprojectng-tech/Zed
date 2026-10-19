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
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/data/socials";
import { buildWhatsAppShareUrl } from "@/lib/referrals/helpers";
import { applyReferralAction } from "@/lib/referrals/actions";
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
              toast.success("Referral code linked! Welcome reward will activate once verified.");
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
      await navigator.clipboard.writeText(referralLink);
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
      toast.success("Referral code linked! Your bonus will be credited once you verify your account.");
      setManualCode("");
      router.refresh();
    });
  };

  const renderStatusBadge = (status: ReferralStatus, reward: number) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px] uppercase font-semibold"
          >
            Pending Verification
          </Badge>
        );
      case "rewarded":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-[10px] uppercase font-semibold"
          >
            +{reward > 0 ? reward : settings.referrer_reward_zed} ZED Rewarded
          </Badge>
        );
      case "capped":
        return (
          <Badge
            variant="outline"
            className="border-muted bg-muted/20 text-muted-foreground font-mono text-[10px] uppercase font-semibold"
          >
            Limit Reached
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-rose-500/10 text-rose-500 font-mono text-[10px] uppercase font-semibold"
          >
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <section className="space-y-1 border-hairline-b pb-6">
        <p className="type-caption text-muted-foreground font-mono uppercase tracking-wider">
          COMMUNITY & REWARDS
        </p>
        <h1 className="type-display text-foreground">Invite Friends</h1>
        <p className="type-body text-muted-foreground max-w-xl">
          Invite friends. You earn ZED when they verify their account.
        </p>
      </section>

      {/* ── Disabled / Coming Soon Callout ────────────────────────────────── */}
      {!settings.enabled && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Referral rewards open soon</p>
            <p className="text-muted-foreground">
              Bonus point payouts are currently being prepared. You can start inviting friends today; reward bonuses will credit automatically once the program is officially enabled.
            </p>
          </div>
        </Card>
      )}

      {/* ── Referral Link & Code Share Card ──────────────────────────────── */}
      <Card className="p-6 border-border bg-card shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span>Your Unique Invite Code</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Give this code to friends or share your personalized sign-up link.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-10 px-4 rounded-lg bg-secondary border border-border font-mono text-base font-bold tracking-widest text-foreground flex items-center justify-center">
              {referralCode || "—"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="h-10 px-3 text-xs gap-1.5"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Link field + Share CTAs */}
        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-xs font-semibold text-muted-foreground">
            Invite Link
          </Label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              readOnly
              value={referralLink}
              className="font-mono text-xs h-10 select-all bg-secondary/30"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none h-10 text-xs gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>

              <Button
                asChild
                size="sm"
                className="flex-1 sm:flex-none h-10 text-xs gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white"
              >
                <a
                  href={buildWhatsAppShareUrl(referralCode, referralLink)}
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
      </Card>

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <section aria-label="Referral metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Total Invited
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">
            {stats.totalInvited}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            {stats.pendingCount} awaiting verification
          </p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Verified & Rewarded
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">
            {stats.totalRewarded}
          </p>
          <p className="font-mono text-[11px] text-emerald-500 mt-0.5">
            Max cap: {settings.max_rewarded_per_referrer}
          </p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Total Earned
            </span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-500">
            {stats.totalEarnedZed.toLocaleString()} $ZED
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            +{settings.referrer_reward_zed} ZED per verified user
          </p>
        </Card>
      </section>

      {/* ── "Have a code?" Section (When eligible) ────────────────────────── */}
      {isEligibleToEnterCode && (
        <Card className="p-5 border-border bg-secondary/20 shadow-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-foreground">
                Were you invited by a friend?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your friend&apos;s referral code before verifying your account to link your bonus. Both you and your referrer will be rewarded once your verification is complete.
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
              className="font-mono text-xs uppercase tracking-wider"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isPending || manualCode.trim().length < 3}
              className="text-xs shrink-0"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <ArrowRight className="h-3 w-3 mr-1" />
              )}
              Apply Code
            </Button>
          </form>
        </Card>
      )}

      {/* ── Referred Users List ───────────────────────────────────────────── */}
      <section aria-label="Invited users list" className="space-y-3">
        <h2 className="type-caption text-muted-foreground font-semibold uppercase tracking-wider font-mono">
          Invited Friends ({referredUsers.length})
        </h2>

        {referredUsers.length === 0 ? (
          <Card className="p-8 border-border bg-card text-center space-y-2">
            <Users className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">
              No invited friends yet. Share your code or WhatsApp link above!
            </p>
          </Card>
        ) : (
          <Card className="border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-muted-foreground text-[10px] font-mono uppercase">
                    <th className="text-left px-4 py-3">Invited User</th>
                    <th className="text-left px-4 py-3">Date Joined</th>
                    <th className="text-right px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {referredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {item.masked_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
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
          </Card>
        )}
      </section>
    </div>
  );
}
