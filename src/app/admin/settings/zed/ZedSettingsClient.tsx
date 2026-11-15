"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Coins,
  History,
  Save,
  TrendingUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/primitives";
import { PanelSection, FieldList, FieldItem } from "@/components/admin/primitives/PanelSection";
import { adminUpdateZedSettingsAction } from "@/lib/withdraw/actions";
import type { PriceHistoryEntry, ZedSettings } from "@/lib/withdraw/types";

interface ZedSettingsClientProps {
  initialSettings: ZedSettings;
  initialHistory: PriceHistoryEntry[];
}

export function ZedSettingsClient({
  initialSettings,
  initialHistory,
}: ZedSettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<ZedSettings>(initialSettings);
  const [history] = useState<PriceHistoryEntry[]>(initialHistory);
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Form inputs
  const [tokenPriceInput, setTokenPriceInput] = useState<string>(
    String(settings.token_price_ngn)
  );
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState<boolean>(
    settings.withdrawals_enabled
  );
  const [minWithdrawInput, setMinWithdrawInput] = useState<string>(
    String(settings.min_withdraw_zed)
  );
  const [maxWithdrawInput, setMaxWithdrawInput] = useState<string>(
    String(settings.max_withdraw_zed)
  );
  const [minLevelInput, setMinLevelInput] = useState<string>(
    String(settings.min_level)
  );

  const numericPrice = parseFloat(tokenPriceInput) || 0;
  const numericMin = parseFloat(minWithdrawInput) || 0;
  const numericMax = parseFloat(maxWithdrawInput) || 0;
  const numericLevel = parseInt(minLevelInput, 10) || 1;

  // Dirty detection
  const isDirty =
    numericPrice !== settings.token_price_ngn ||
    withdrawalsEnabled !== settings.withdrawals_enabled ||
    numericMin !== settings.min_withdraw_zed ||
    numericMax !== settings.max_withdraw_zed ||
    numericLevel !== settings.min_level;

  const validateForm = (): boolean => {
    if (numericPrice < 0) {
      toast.error("Token price cannot be negative.");
      return false;
    }
    if (numericMin < 0 || numericMax < 0) {
      toast.error("Withdrawal limits cannot be negative.");
      return false;
    }
    if (numericMax < numericMin) {
      toast.error("Maximum withdrawal must be greater than or equal to minimum withdrawal.");
      return false;
    }
    if (numericLevel < 1 || numericLevel > 10) {
      toast.error("Minimum level must be between 1 and 10.");
      return false;
    }
    return true;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmedSave = () => {
    setIsConfirmOpen(false);
    startTransition(async () => {
      const res = await adminUpdateZedSettingsAction({
        token_price_ngn: numericPrice,
        withdrawals_enabled: withdrawalsEnabled,
        min_withdraw_zed: numericMin,
        max_withdraw_zed: numericMax,
        min_level: numericLevel,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("ZED token settings and price updated successfully!");
      setSettings((prev) => ({
        ...prev,
        token_price_ngn: numericPrice,
        withdrawals_enabled: withdrawalsEnabled,
        min_withdraw_zed: numericMin,
        max_withdraw_zed: numericMax,
        min_level: numericLevel,
        updated_at: new Date().toISOString(),
      }));
      router.refresh();
    });
  };

  const priceChanged = numericPrice !== settings.token_price_ngn;

  return (
    <>
      <div className="space-y-6 max-w-5xl">
        <AdminPageHeader
          title="ZED token settings"
          description="Configure the Naira redemption rate per 1 ZED, payout limits, and community withdrawal toggle."
          icon={Coins}
          section="money"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main Form (2 cols) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmitClick} className="space-y-0">
              <div className="rounded-lg border border-border/70 bg-card shadow-2xs divide-y divide-border/60">

                {/* Token Price */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="token-price" className="text-sm font-medium text-foreground">
                      Token price
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Current:{" "}
                      <span className="font-sans tabular-nums font-semibold text-foreground">
                        ₦{settings.token_price_ngn.toFixed(4)}
                      </span>
                    </span>
                  </div>

                  {/* Large price display */}
                  <div className="rounded-lg bg-secondary/40 border border-border/50 px-4 py-3 flex items-baseline gap-2">
                    <span className="text-muted-foreground text-sm">₦</span>
                    <span className="text-3xl font-bold font-sans tabular-nums text-foreground tracking-tight">
                      {settings.token_price_ngn.toFixed(4)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">per 1 ZED</span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-sm font-semibold text-muted-foreground">
                      ₦
                    </div>
                    <Input
                      id="token-price"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="e.g. 15.0000"
                      value={tokenPriceInput}
                      onChange={(e) => setTokenPriceInput(e.target.value)}
                      className="pl-8 font-sans tabular-nums"
                      disabled={isPending}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updating this price applies immediately to all new citizen withdrawal requests and is logged in the immutable price history ledger.
                  </p>
                </div>

                {/* Withdrawals toggle */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="withdrawals-enabled-toggle"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Community withdrawals
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When active, eligible verified citizens can submit bank payout requests.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      id="withdrawals-enabled-toggle"
                      type="checkbox"
                      checked={withdrawalsEnabled}
                      onChange={(e) => setWithdrawalsEnabled(e.target.checked)}
                      disabled={isPending}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                {/* Limits */}
                <div className="p-5 space-y-3">
                  <p className="text-sm font-medium text-foreground">Withdrawal limits</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="min-withdraw" className="text-xs text-muted-foreground">
                        Minimum ($ZED)
                      </Label>
                      <Input
                        id="min-withdraw"
                        type="number"
                        step="1"
                        min="0"
                        value={minWithdrawInput}
                        onChange={(e) => setMinWithdrawInput(e.target.value)}
                        className="font-sans tabular-nums"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="max-withdraw" className="text-xs text-muted-foreground">
                        Maximum ($ZED)
                      </Label>
                      <Input
                        id="max-withdraw"
                        type="number"
                        step="1"
                        min="0"
                        value={maxWithdrawInput}
                        onChange={(e) => setMaxWithdrawInput(e.target.value)}
                        className="font-sans tabular-nums"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>

                {/* Minimum level */}
                <div className="p-5 space-y-1.5">
                  <Label htmlFor="min-level" className="text-sm font-medium text-foreground">
                    Minimum eligible mining level
                  </Label>
                  <select
                    id="min-level"
                    value={minLevelInput}
                    onChange={(e) => setMinLevelInput(e.target.value)}
                    disabled={isPending}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="1">Level 1 — Rookie (all verified citizens)</option>
                    <option value="2">Level 2 — Explorer</option>
                    <option value="3">Level 3 — Builder</option>
                    <option value="4">Level 4 — Pro</option>
                    <option value="5">Level 5 — Zed Legend</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Miners below this tier will be prompted to upgrade before requesting payouts.
                  </p>
                </div>
              </div>

              {/* Sticky save bar */}
              <div
                className={`sticky bottom-0 z-10 mt-0 border border-border/70 rounded-b-lg bg-card/95 backdrop-blur-sm px-5 py-3.5 flex items-center justify-between gap-4 transition-opacity duration-150 ${
                  isDirty ? "opacity-100" : "opacity-60"
                }`}
              >
                <span className="text-xs text-muted-foreground">
                  {isDirty ? "You have unsaved changes." : "No unsaved changes."}
                </span>
                <Button
                  type="submit"
                  disabled={isPending || !isDirty}
                  size="sm"
                  className="motion-safe:transition-all motion-safe:duration-150"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>

            {/* ── Price Audit History ────────────────────────────── */}
            <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">
                    Price change history
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {history.length} record{history.length !== 1 ? "s" : ""}
                </span>
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  No price updates recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground">
                        <th className="text-left px-5 py-2.5 font-medium">Rate (NGN / ZED)</th>
                        <th className="text-left px-5 py-2.5 font-medium">Updated by</th>
                        <th className="text-right px-5 py-2.5 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-secondary/30 motion-safe:transition-colors motion-safe:duration-150">
                          <td className="px-5 py-3 font-sans tabular-nums font-semibold text-foreground">
                            ₦{h.price_ngn.toFixed(4)}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {h.setter_name || (h.set_by ? h.set_by.slice(0, 8) : "Admin")}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                            {new Date(h.set_at).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Live Conversion Preview */}
            <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border/60">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">Live conversion preview</h2>
              </div>
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs text-muted-foreground">
                  At the proposed rate of{" "}
                  <span className="font-sans tabular-nums font-semibold text-foreground">
                    ₦{numericPrice.toFixed(4)}
                  </span>{" "}
                  per 1 ZED:
                </p>
              </div>
              <div className="px-4 pb-4 pt-2 space-y-1.5">
                {[100, 1000, 5000, 10000, 50000].map((zed) => (
                  <div
                    key={zed}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30 border border-border/40"
                  >
                    <span className="text-xs text-muted-foreground font-sans tabular-nums">
                      {zed.toLocaleString()} ZED
                    </span>
                    <span className="text-xs font-semibold font-sans tabular-nums text-foreground">
                      ₦{(zed * numericPrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Governance & Safety */}
            <div className="rounded-lg border border-border/70 bg-card shadow-2xs p-4 space-y-2">
              <h3 className="text-sm font-medium text-foreground">Governance &amp; safety</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                <li>Price updates take effect instantly for new submissions.</li>
                <li>Pending requests retain their snapshot rate.</li>
                <li>Rejected withdrawals automatically refund held ZED.</li>
                <li>All admin updates are logged in the admin audit trail.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Update ZED token settings?
            </DialogTitle>
            <DialogDescription>
              Review the changes below before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {priceChanged && (
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Token price</p>
                <p className="font-sans tabular-nums text-foreground">
                  <span className="line-through text-muted-foreground mr-2">
                    ₦{settings.token_price_ngn.toFixed(4)}
                  </span>
                  → ₦{numericPrice.toFixed(4)}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Affects all new citizen withdrawal calculations immediately.
                </p>
              </div>
            )}
            {!priceChanged && (
              <p className="text-xs text-muted-foreground">Token price unchanged.</p>
            )}
            <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 space-y-1 text-xs text-muted-foreground">
              <p>Withdrawals: <span className="text-foreground font-medium">{withdrawalsEnabled ? "Enabled" : "Disabled"}</span></p>
              <p>Min withdrawal: <span className="text-foreground font-sans tabular-nums font-medium">{numericMin} ZED</span></p>
              <p>Max withdrawal: <span className="text-foreground font-sans tabular-nums font-medium">{numericMax} ZED</span></p>
              <p>Min level: <span className="text-foreground font-medium">{numericLevel}</span></p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmedSave}
              disabled={isPending}
              className="text-xs"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Confirm &amp; save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
