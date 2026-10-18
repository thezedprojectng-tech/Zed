"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Coins,
  DollarSign,
  History,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [history, setHistory] = useState<PriceHistoryEntry[]>(initialHistory);
  const [isPending, startTransition] = useTransition();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numericPrice < 0) {
      toast.error("Token price cannot be negative.");
      return;
    }
    if (numericMin < 0 || numericMax < 0) {
      toast.error("Withdrawal limits cannot be negative.");
      return;
    }
    if (numericMax < numericMin) {
      toast.error("Maximum withdrawal must be greater than or equal to minimum withdrawal.");
      return;
    }
    if (numericLevel < 1 || numericLevel > 10) {
      toast.error("Minimum level must be between 1 and 10.");
      return;
    }

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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          ZED Token & Withdrawal Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure the Naira redemption rate per 1 ZED, payout limits, and toggle community withdrawals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Form (2 cols) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border bg-card shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token Price Setting */}
              <div className="space-y-2">
                <Label htmlFor="token-price" className="text-xs font-semibold flex items-center justify-between">
                  <span>Token Price (Naira per 1 ZED)</span>
                  <span className="font-mono text-[11px] text-amber-500 font-bold">
                    Current: ₦{settings.token_price_ngn.toFixed(4)}
                  </span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-sm font-bold text-foreground">
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
                    className="pl-8 font-mono text-base font-bold"
                    disabled={isPending}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Updating this price will immediately apply to all new citizen withdrawal requests and will be logged in the immutable price history ledger.
                </p>
              </div>

              {/* Withdrawals Switch */}
              <div className="rounded-lg border border-border p-4 bg-secondary/20 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="withdrawals-enabled-toggle" className="text-xs font-semibold text-foreground cursor-pointer">
                    Enable Community Withdrawals
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    When active, eligible verified citizens can submit bank payout requests.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="withdrawals-enabled-toggle"
                    type="checkbox"
                    checked={withdrawalsEnabled}
                    onChange={(e) => setWithdrawalsEnabled(e.target.checked)}
                    disabled={isPending}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Limits grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="min-withdraw" className="text-xs font-semibold">
                    Minimum Withdrawal ($ZED)
                  </Label>
                  <Input
                    id="min-withdraw"
                    type="number"
                    step="1"
                    min="0"
                    value={minWithdrawInput}
                    onChange={(e) => setMinWithdrawInput(e.target.value)}
                    className="font-mono text-xs"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="max-withdraw" className="text-xs font-semibold">
                    Maximum Withdrawal ($ZED)
                  </Label>
                  <Input
                    id="max-withdraw"
                    type="number"
                    step="1"
                    min="0"
                    value={maxWithdrawInput}
                    onChange={(e) => setMaxWithdrawInput(e.target.value)}
                    className="font-mono text-xs"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Minimum Level */}
              <div className="space-y-1.5">
                <Label htmlFor="min-level" className="text-xs font-semibold">
                  Minimum Eligible Mining Level
                </Label>
                <select
                  id="min-level"
                  value={minLevelInput}
                  onChange={(e) => setMinLevelInput(e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                >
                  <option value="1">Level 1 — Rookie (All verified citizens)</option>
                  <option value="2">Level 2 — Explorer</option>
                  <option value="3">Level 3 — Builder</option>
                  <option value="4">Level 4 — Pro</option>
                  <option value="5">Level 5 — Zed Legend</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Miners below this tier will be asked to upgrade before requesting payouts.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save & Apply Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* ── Price Audit History ────────────────────────────────────────── */}
          <Card className="p-6 border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">
                  Price Change Audit Log
                </h2>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {history.length} records
              </Badge>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono py-4 text-center">
                No price updates recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[10px] font-mono uppercase">
                      <th className="text-left py-2">Rate (NGN / ZED)</th>
                      <th className="text-left py-2">Updated By</th>
                      <th className="text-right py-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-foreground">
                          ₦{h.price_ngn.toFixed(4)}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {h.setter_name || (h.set_by ? h.set_by.slice(0, 8) : "Admin")}
                        </td>
                        <td className="py-2.5 text-right font-mono text-muted-foreground">
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
          </Card>
        </div>

        {/* ── Preview & Quick Calculator (1 col) ─────────────────────────── */}
        <div className="space-y-6">
          <Card className="p-5 border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Live Conversion Preview
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Calculated at the proposed rate of{" "}
              <span className="font-mono font-bold text-foreground">
                ₦{numericPrice.toFixed(4)}
              </span>{" "}
              per 1 ZED:
            </p>

            <div className="space-y-2 pt-1 font-mono text-xs">
              {[100, 1000, 5000, 10000, 50000].map((zed) => (
                <div
                  key={zed}
                  className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border"
                >
                  <span className="text-muted-foreground">
                    {zed.toLocaleString()} ZED
                  </span>
                  <span className="font-bold text-foreground">
                    ₦{(zed * numericPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-border bg-card shadow-xs space-y-2 text-xs">
            <h3 className="font-bold text-foreground font-mono text-[11px] uppercase tracking-wider">
              Governance & Safety
            </h3>
            <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
              <li>Price updates take effect instantly for new submissions.</li>
              <li>Pending requests retain their snapshot rate.</li>
              <li>Rejected withdrawals automatically refund held ZED.</li>
              <li>All admin updates are logged in the admin audit trail.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
