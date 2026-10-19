"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Gift,
  Settings,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Coins,
  Trophy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    max_rewarded_per_referrer: initialData?.settings.max_rewarded_per_referrer ?? 50,
  });

  // Table filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (loadError || !data) {
    return (
      <Card className="p-8 border-destructive/20 bg-destructive/5 text-center">
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
      </Card>
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
        `Processed pending referrals (${res.processedCount} user${res.processedCount === 1 ? "" : "s"} rewarded).`
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

  const getStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case "rewarded":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15 font-medium">
            Rewarded
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 font-medium">
            Pending
          </Badge>
        );
      case "capped":
        return (
          <Badge variant="secondary" className="text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-border font-medium">
            Capped
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-medium">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Referral Program Management
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "font-semibold text-xs",
                settings.enabled
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              )}
            >
              {settings.enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure invite rewards, review verified referral payouts, and track top referrers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessPending}
            disabled={isPending}
            className="gap-2 h-9"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 text-primary" />
            )}
            Process Pending
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.refresh()}
            className="h-9"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Invites</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {stats.totalReferrals.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">All-time tracked</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.totalPending.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting user verification</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Rewarded</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.totalRewarded.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Successfully credited</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Capped</span>
            <ShieldAlert className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {stats.totalCapped.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Exceeded max referrer cap</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">ZED Distributed</span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-500">
            {stats.totalZedPaid.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total reward tokens paid</p>
        </Card>
      </div>

      {/* Main Grid: Settings & Top Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Card */}
        <Card className="p-5 bg-card/60 backdrop-blur-sm border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Program Settings</h2>
                <p className="text-xs text-muted-foreground">Configure program status and reward amounts</p>
              </div>
            </div>

            <form id="referral-settings-form" onSubmit={handleSaveSettings} className="space-y-4">
              {/* Program Enabled Switch (Accessible semantic toggle) */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                <div className="space-y-0.5">
                  <Label htmlFor="referral-enabled-toggle" className="text-sm font-medium cursor-pointer">
                    Program Status
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
                  Referrer Reward (ZED)
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
                <p className="text-[11px] text-muted-foreground">Paid to inviter upon verified referee</p>
              </div>

              {/* Referee Reward */}
              <div className="space-y-1.5">
                <Label htmlFor="referee_reward" className="text-xs font-medium">
                  New User Welcome Reward (ZED)
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
                <p className="text-[11px] text-muted-foreground">Paid to newly verified user</p>
              </div>

              {/* Max rewarded cap */}
              <div className="space-y-1.5">
                <Label htmlFor="max_cap" className="text-xs font-medium">
                  Max Rewarded Referrals / Referrer
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
              className="w-full gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </Card>

        {/* Top Referrers Leaderboard */}
        <Card className="lg:col-span-2 p-5 bg-card/60 backdrop-blur-sm border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Top Referrers</h2>
                <p className="text-xs text-muted-foreground">Users with highest rewarded invites</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {topReferrers.length} Leading Referrers
            </Badge>
          </div>

          {topReferrers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <Gift className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">No referral payouts yet</p>
              <p className="text-xs">Leaderboard will update when users complete account verification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" role="table">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3 text-right">Invited</th>
                    <th className="py-2.5 px-3 text-right">Rewarded</th>
                    <th className="py-2.5 px-3 text-right">Total ZED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topReferrers.map((r: TopReferrerEntry, index: number) => (
                    <tr key={r.userId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-xs text-muted-foreground">
                        {index === 0 ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : `${index + 1}`}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {r.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {r.code}
                        </code>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground text-xs font-medium">
                        {r.totalInvites}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                        {r.rewardedCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-500 text-xs">
                        {r.totalEarnedZed.toLocaleString()} ZED
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Referrals Activity Ledger */}
      <Card className="p-5 bg-card/60 backdrop-blur-sm border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Referral Ledger</h2>
            <p className="text-xs text-muted-foreground">
              Complete history of user invitations and payout statuses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-background/60 p-1 rounded-lg border border-border">
              {["all", "pending", "rewarded", "capped", "rejected"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md capitalize font-medium transition-colors",
                    statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search user or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg border-border">
          <table className="w-full text-left text-sm" role="table">
            <thead className="bg-muted/40">
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Referrer</th>
                <th className="py-2.5 px-3">Referred User</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Referrer Reward</th>
                <th className="py-2.5 px-3 text-right">Referee Reward</th>
                <th className="py-2.5 px-3 text-right">Rewarded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                    No referrals match your current search or filter.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((item: AdminReferralRecord) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-foreground">{item.referrer_name}</div>
                      <code className="text-[10px] text-muted-foreground">{item.referrer_code}</code>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-medium text-foreground whitespace-nowrap">
                      {item.referred_name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-medium text-foreground whitespace-nowrap">
                      {item.referrer_reward_zed != null ? `${item.referrer_reward_zed} ZED` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-medium text-foreground whitespace-nowrap">
                      {item.referee_reward_zed != null ? `${item.referee_reward_zed} ZED` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {item.rewarded_at
                        ? new Date(item.rewarded_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
