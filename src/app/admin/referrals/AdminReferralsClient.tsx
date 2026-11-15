"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Share2,
  Search,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Coins,
  Trophy,
  Loader2,
  AlertCircle,
  Gift,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AdminPageHeader,
  SegmentedControl,
  EmptyState,
} from "@/components/admin/primitives";
import { StatusPill } from "@/components/admin/people/StatusPill";
import {
  adminUpdateReferralSettingsAction,
  adminProcessPendingReferralsAction,
} from "@/lib/referrals/actions";
import type {
  AdminReferralData,
  AdminReferralSettingsInput,
  AdminReferralRecord,
  TopReferrerEntry,
  ReferralStatus,
} from "@/lib/referrals/types";
import { cn } from "@/lib/utils";

interface AdminReferralsClientProps {
  initialData: AdminReferralData | null;
  loadError?: string | null;
}

export function AdminReferralsClient({
  initialData,
  loadError,
}: AdminReferralsClientProps) {
  const router = useRouter();
  const [data, setData] = useState<AdminReferralData | null>(initialData);
  const [isPending, startTransition] = useTransition();

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<AdminReferralSettingsInput>({
    enabled: initialData?.settings.enabled ?? false,
    referrer_reward_zed: initialData?.settings.referrer_reward_zed ?? 100,
    referee_reward_zed: initialData?.settings.referee_reward_zed ?? 50,
    max_rewarded_per_referrer:
      initialData?.settings.max_rewarded_per_referrer ?? 50,
  });

  // Table filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Confirm dialog state
  const [showProcessConfirm, setShowProcessConfirm] = useState(false);
  const [showSaveSettingsConfirm, setShowSaveSettingsConfirm] = useState(false);

  // Search bar ref for '/' shortcut
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loadError || !data) {
    return (
      <div className="p-8 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Unable to Load Referral Data
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {loadError || "An error occurred while communicating with the database."}
        </p>
        <Button variant="outline" onClick={() => router.refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  const { settings, stats, topReferrers, referrals } = data;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await adminUpdateReferralSettingsAction(settingsForm);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Referral program settings updated successfully.");
      setData((prev: AdminReferralData | null) =>
        prev
          ? {
              ...prev,
              settings: {
                ...prev.settings,
                ...settingsForm,
              },
            }
          : prev
      );
      router.refresh();
    });
  };

  const handleProcessPending = () => {
    startTransition(async () => {
      const res = await adminProcessPendingReferralsAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Processed pending referrals (${res.processedCount} user${
          res.processedCount === 1 ? "" : "s"
        } rewarded).`
      );
      router.refresh();
    });
  };

  const filteredReferrals = referrals.filter((item: AdminReferralRecord) => {
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const refName = item.referrer_name.toLowerCase();
      const redName = item.referred_name.toLowerCase();
      const code = item.referrer_code.toLowerCase();
      return refName.includes(q) || redName.includes(q) || code.includes(q);
    }
    return true;
  });

  // SegmentedControl tab options with counts
  const statusTabs = [
    { value: "all" as const, label: "All", count: referrals.length },
    {
      value: "pending" as const,
      label: "Pending",
      count: referrals.filter((r) => r.status === "pending").length,
    },
    {
      value: "rewarded" as const,
      label: "Rewarded",
      count: referrals.filter((r) => r.status === "rewarded").length,
    },
    {
      value: "capped" as const,
      label: "Capped",
      count: referrals.filter((r) => r.status === "capped").length,
    },
    {
      value: "rejected" as const,
      label: "Rejected",
      count: referrals.filter((r) => r.status === "rejected").length,
    },
  ];

  const statusToPill: Record<ReferralStatus, "verified" | "pending" | "neutral" | "rejected"> = {
    rewarded: "verified",
    pending: "pending",
    capped: "neutral",
    rejected: "rejected",
  };

  const rankLabel = (index: number) => {
    if (index === 0) return "1st";
    if (index === 1) return "2nd";
    if (index === 2) return "3rd";
    return `${index + 1}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <AdminPageHeader
        title="Referral program"
        description="Configure invite rewards, review referral activity, and track top referrers."
        icon={Share2}
        section="money"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProcessConfirm(true)}
              disabled={isPending}
              className="gap-2 h-9 transition-all duration-150"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Process pending
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.refresh()}
              className="h-9"
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          {
            label: "Total invites",
            value: stats.totalReferrals.toLocaleString(),
            icon: Users,
            sub: "All-time tracked",
            color: "text-foreground",
          },
          {
            label: "Pending",
            value: stats.totalPending.toLocaleString(),
            icon: Clock,
            sub: "Awaiting verification",
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Rewarded",
            value: stats.totalRewarded.toLocaleString(),
            icon: CheckCircle2,
            sub: "Successfully credited",
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Capped",
            value: stats.totalCapped.toLocaleString(),
            icon: ShieldAlert,
            sub: "Exceeded max cap",
            color: "text-foreground",
          },
          {
            label: "ZED distributed",
            value: stats.totalZedPaid.toLocaleString(),
            icon: Coins,
            sub: "Total reward tokens",
            color: "text-amber-500",
          },
        ].map(({ label, value, icon: Icon, sub, color }) => (
          <div
            key={label}
            className="rounded-lg border border-border/70 bg-card shadow-2xs p-4 col-span-1 last:col-span-2 md:last:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn("mt-2 text-2xl font-bold tracking-tight font-sans tabular-nums", color)}>
              {value}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Settings + Top Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program Settings */}
        <div className="rounded-lg border border-border/70 bg-card shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Program settings
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure status and reward amounts
                </p>
              </div>
            </div>

            <form id="referral-settings-form" onSubmit={(e) => { e.preventDefault(); setShowSaveSettingsConfirm(true); }} className="space-y-4">
              {/* Program Enabled Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="referral-enabled-toggle"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Program status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable or pause rewards on user verifications
                  </p>
                </div>
                <button
                  id="referral-enabled-toggle"
                  type="button"
                  role="switch"
                  aria-checked={settingsForm.enabled}
                  onClick={() =>
                    setSettingsForm((prev: AdminReferralSettingsInput) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }))
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    settingsForm.enabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                      settingsForm.enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Referrer Reward */}
              <div className="space-y-1.5">
                <Label htmlFor="referrer_reward" className="text-xs font-medium">
                  Referrer reward (ZED)
                </Label>
                <div className="relative">
                  <Input
                    id="referrer_reward"
                    type="number"
                    min={0}
                    step={1}
                    value={settingsForm.referrer_reward_zed}
                    onChange={(e) =>
                      setSettingsForm((prev: AdminReferralSettingsInput) => ({
                        ...prev,
                        referrer_reward_zed: Number(e.target.value),
                      }))
                    }
                    className="pr-12"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    ZED
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Paid to inviter upon verified referee
                </p>
              </div>

              {/* Referee Reward */}
              <div className="space-y-1.5">
                <Label htmlFor="referee_reward" className="text-xs font-medium">
                  New user welcome reward (ZED)
                </Label>
                <div className="relative">
                  <Input
                    id="referee_reward"
                    type="number"
                    min={0}
                    step={1}
                    value={settingsForm.referee_reward_zed}
                    onChange={(e) =>
                      setSettingsForm((prev: AdminReferralSettingsInput) => ({
                        ...prev,
                        referee_reward_zed: Number(e.target.value),
                      }))
                    }
                    className="pr-12"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    ZED
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Paid to newly verified user
                </p>
              </div>

              {/* Max cap */}
              <div className="space-y-1.5">
                <Label htmlFor="max_cap" className="text-xs font-medium">
                  Max rewarded referrals / referrer
                </Label>
                <Input
                  id="max_cap"
                  type="number"
                  min={0}
                  step={1}
                  value={settingsForm.max_rewarded_per_referrer}
                  onChange={(e) =>
                    setSettingsForm((prev: AdminReferralSettingsInput) => ({
                      ...prev,
                      max_rewarded_per_referrer: Number(e.target.value),
                    }))
                  }
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Subsequent verifications are marked capped with no reward
                </p>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button
              type="submit"
              form="referral-settings-form"
              disabled={isPending}
              className="w-full gap-2 transition-all duration-150"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save settings
            </Button>
          </div>
        </div>

        {/* Top Referrers Leaderboard */}
        <div className="lg:col-span-2 rounded-lg border border-border/70 bg-card shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Top referrers
                </h2>
                <p className="text-xs text-muted-foreground">
                  Users with highest rewarded invites
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-sans tabular-nums">
              {topReferrers.length} referrers
            </span>
          </div>

          {topReferrers.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No referral payouts yet"
              description="Leaderboard updates when users complete account verification."
              compact
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
              <table className="w-full text-left text-sm" role="table">
                <thead>
                  <tr className="border-b border-border/70 bg-secondary/30 text-muted-foreground text-xs font-medium">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3 text-right">Invited</th>
                    <th className="py-2.5 px-3 text-right">Rewarded</th>
                    <th className="py-2.5 px-3 text-right">Total ZED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {topReferrers.map((r: TopReferrerEntry, index: number) => (
                    <tr
                      key={r.userId}
                      className="hover:bg-muted/30 transition-all duration-150"
                    >
                      <td className="py-2.5 px-3 font-semibold text-xs text-muted-foreground">
                        {rankLabel(index)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {r.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {r.code}
                        </code>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground text-xs font-medium font-sans tabular-nums">
                        {r.totalInvites}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 text-xs font-sans tabular-nums">
                        {r.rewardedCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-500 text-xs font-sans tabular-nums">
                        {r.totalEarnedZed.toLocaleString()} ZED
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Referral Ledger */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Referral ledger
            </h2>
            <p className="text-xs text-muted-foreground">
              Complete history of user invitations and payout statuses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              options={statusTabs}
              value={statusFilter as "all" | "pending" | "rewarded" | "capped" | "rejected"}
              onChange={(v) => setStatusFilter(v)}
              size="sm"
              ariaLabel="Filter referrals by status"
            />

            {/* Search with '/' shortcut */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                placeholder="Search user or code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 pr-9"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-sans bg-muted/60 px-1 py-0.5 rounded border border-border/60 leading-none pointer-events-none hidden sm:flex items-center">
                /
              </kbd>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead>
                <tr className="border-b border-border/70 bg-secondary/30 text-muted-foreground text-xs font-medium">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Referrer</th>
                  <th className="py-2.5 px-3">Referred user</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Referrer reward</th>
                  <th className="py-2.5 px-3 text-right">Referee reward</th>
                  <th className="py-2.5 px-3 text-right">Rewarded at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-0">
                      <EmptyState
                        title="No referrals found"
                        description="No referrals match your current search or filter."
                        compact
                        className="border-0 rounded-none"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((item: AdminReferralRecord) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/20 transition-all duration-150"
                    >
                      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-xs font-medium text-foreground">
                          {item.referrer_name}
                        </div>
                        <code className="text-[10px] text-muted-foreground">
                          {item.referrer_code}
                        </code>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-medium text-foreground whitespace-nowrap">
                        {item.referred_name}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusPill
                          variant={statusToPill[item.status] ?? "neutral"}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-sans tabular-nums font-medium text-foreground whitespace-nowrap">
                        {item.referrer_reward_zed != null
                          ? `${item.referrer_reward_zed} ZED`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-sans tabular-nums font-medium text-foreground whitespace-nowrap">
                        {item.referee_reward_zed != null
                          ? `${item.referee_reward_zed} ZED`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs text-muted-foreground whitespace-nowrap font-sans tabular-nums">
                        {item.rewarded_at
                          ? new Date(item.rewarded_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm: Process Pending */}
      <Dialog open={showProcessConfirm} onOpenChange={setShowProcessConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process pending referrals?</DialogTitle>
            <DialogDescription>
              Process {data.stats.totalPending} pending referrals now? This will
              credit ZED to qualifying users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcessConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                setShowProcessConfirm(false);
                handleProcessPending();
              }}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm &amp; process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: Save Settings */}
      <Dialog
        open={showSaveSettingsConfirm}
        onOpenChange={setShowSaveSettingsConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save referral settings?</DialogTitle>
            <DialogDescription asChild>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>
                  Referrer reward:{" "}
                  <span className="font-sans tabular-nums font-semibold text-foreground">
                    {settingsForm.referrer_reward_zed} ZED
                  </span>
                </li>
                <li>
                  Referee welcome reward:{" "}
                  <span className="font-sans tabular-nums font-semibold text-foreground">
                    {settingsForm.referee_reward_zed} ZED
                  </span>
                </li>
                <li>
                  Max per referrer:{" "}
                  <span className="font-sans tabular-nums font-semibold text-foreground">
                    {settingsForm.max_rewarded_per_referrer}
                  </span>
                </li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveSettingsConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                setShowSaveSettingsConfirm(false);
                // Trigger the form submit handler directly
                const fakeEvent = {
                  preventDefault: () => {},
                } as React.FormEvent;
                handleSaveSettings(fakeEvent);
              }}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
