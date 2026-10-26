"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Wallet,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  calculateNairaAmount,
  maskAccountNumber,
} from "@/lib/withdraw/helpers";
import { isVerifiedBadgeEnabled } from "@/lib/verification/flags";
import {
  requestWithdrawalAction,
  cancelWithdrawalAction,
} from "@/lib/withdraw/actions";
import type { UserWithdrawalOverview, WithdrawalStatus } from "@/lib/withdraw/types";
import { cn } from "@/lib/utils";

interface WithdrawClientProps {
  overview: UserWithdrawalOverview;
}

const COMMON_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint Microfinance Bank",
  "Opay",
  "Optimus Bank",
  "Palmpay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Taj Bank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
];

export function WithdrawClient({ overview }: WithdrawClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { settings, balanceZed, userLevel, isVerified, pendingRequest, requests } =
    overview;

  // Form state
  const [amountInput, setAmountInput] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");

  const numericAmount = parseFloat(amountInput) || 0;
  const tokenPrice = settings.token_price_ngn;
  const nairaPreview = calculateNairaAmount(numericAmount, tokenPrice);

  const isLevelEligible = userLevel >= settings.min_level;
  const isEnabled = settings.withdrawals_enabled;
  const hasPending = Boolean(pendingRequest);

  // Quick amount filler
  const handleSetMax = () => {
    const maxPossible = Math.min(balanceZed, settings.max_withdraw_zed);
    if (maxPossible > 0) {
      setAmountInput(String(maxPossible));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEnabled) {
      toast.error("Withdrawals are currently closed.");
      return;
    }

    if (!isVerified) {
      toast.error("Please verify your NIN before requesting a withdrawal.");
      return;
    }

    if (!isLevelEligible) {
      toast.error(`Minimum level required to withdraw is Level ${settings.min_level}.`);
      return;
    }

    if (hasPending) {
      toast.error("You already have a pending withdrawal request in review.");
      return;
    }

    if (numericAmount < settings.min_withdraw_zed) {
      toast.error(`Minimum withdrawal is ${settings.min_withdraw_zed.toLocaleString()} ZED.`);
      return;
    }

    if (numericAmount > settings.max_withdraw_zed) {
      toast.error(`Maximum withdrawal is ${settings.max_withdraw_zed.toLocaleString()} ZED.`);
      return;
    }

    if (numericAmount > balanceZed) {
      toast.error("Insufficient ZED balance.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber.trim())) {
      toast.error("Account number must be exactly 10 digits.");
      return;
    }

    if (bankName.trim().length < 2) {
      toast.error("Please provide a valid bank name.");
      return;
    }

    if (accountName.trim().length < 2) {
      toast.error("Please provide the account holder's name.");
      return;
    }

    startTransition(async () => {
      const res = await requestWithdrawalAction({
        amount_zed: numericAmount,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(
        `Withdrawal request submitted! ₦${res.data.amount_ngn.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })} will be credited once approved.`
      );
      setAmountInput("");
      setAccountNumber("");
      setAccountName("");
      router.refresh();
    });
  };

  const handleCancel = (requestId: string) => {
    setCancellingId(requestId);
    startTransition(async () => {
      const res = await cancelWithdrawalAction(requestId);
      setCancellingId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Withdrawal cancelled. Your ZED has been refunded to your wallet.");
      router.refresh();
    });
  };

  const renderStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px] uppercase font-semibold"
          >
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-mono text-[10px] uppercase font-semibold"
          >
            Approved
          </Badge>
        );
      case "paid":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-[10px] uppercase font-semibold"
          >
            Paid
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
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="border-muted bg-muted/20 text-muted-foreground font-mono text-[10px] uppercase font-semibold"
          >
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 space-y-8">
      {/* ── Breadcrumb / Header ────────────────────────────────────────────── */}
      <section className="space-y-2 border-hairline-b pb-6">
        <Link
          href="/mining"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Mining</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="type-display text-foreground">Withdraw ZED</h1>
            <p className="type-body text-muted-foreground mt-1">
              Convert your mined $ZED tokens to Nigerian Naira directly into your bank account.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Card className="px-3 py-2 border-border bg-card shadow-xs">
              <p className="font-mono text-[10px] text-muted-foreground uppercase">Available Balance</p>
              <p className="font-mono text-sm font-bold text-foreground">
                {balanceZed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZED
              </p>
            </Card>
            <Card className="px-3 py-2 border-border bg-card shadow-xs">
              <p className="font-mono text-[10px] text-muted-foreground uppercase">Token Rate</p>
              <p className="font-mono text-sm font-bold text-amber-500">
                ₦{tokenPrice.toFixed(2)} / ZED
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Notice when withdrawals are disabled ────────────────────────────── */}
      {!isEnabled ? (
        <Card className="p-8 border-border bg-card text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Withdrawals open soon</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The community redemption window is currently closed while the initial liquidity and token rate are being configured. Keep mining to grow your balance!
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/mining">Continue Mining</Link>
            </Button>
          </div>
        </Card>
      ) : (
        /* ── Active Withdrawal Form ────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Eligibility warnings if applicable */}
          {!isVerified && (
            <Card className="p-4 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                {isVerifiedBadgeEnabled() ? (
                  <>
                    <p className="font-semibold text-foreground">NIN verification required</p>
                    <p className="text-muted-foreground">
                      You must verify your identity before you can make bank withdrawals.{" "}
                      <Link href="/nin" className="text-primary underline font-medium">
                        Verify NIN now
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">Withdrawals are not open yet.</p>
                    <p className="text-muted-foreground">
                      Bank withdrawals will be enabled in a future phase. Keep mining and accumulating your $ZED.
                    </p>
                  </>
                )}
              </div>
            </Card>
          )}

          {isVerified && !isLevelEligible && (
            <Card className="p-4 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-foreground">Level {settings.min_level} Required</p>
                <p className="text-muted-foreground">
                  Withdrawals are currently open to miners at Level {settings.min_level} and above. Your current tier is Level {userLevel}.
                </p>
              </div>
            </Card>
          )}

          {hasPending && (
            <Card className="p-4 border-border bg-secondary/30 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">Pending Withdrawal In Review</p>
                  <p className="text-muted-foreground">
                    You have a request of{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {pendingRequest?.amount_zed.toLocaleString()} ZED
                    </span>{" "}
                    (≈ ₦{pendingRequest?.amount_ngn.toLocaleString()}) to{" "}
                    <span className="font-medium text-foreground">{pendingRequest?.bank_name}</span>{" "}
                    ({maskAccountNumber(pendingRequest?.account_number || "")}).
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                disabled={isPending && cancellingId === pendingRequest?.id}
                onClick={() => pendingRequest && handleCancel(pendingRequest.id)}
              >
                {isPending && cancellingId === pendingRequest?.id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Cancel
              </Button>
            </Card>
          )}

          {/* Withdrawal Form Card */}
          <Card className="p-6 border-border bg-card shadow-xs space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount input & live conversion preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount-input" className="text-xs font-semibold">
                    Amount to withdraw ($ZED)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Min: {settings.min_withdraw_zed.toLocaleString()} · Max: {settings.max_withdraw_zed.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={handleSetMax}
                      className="text-[11px] font-mono font-bold text-primary hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    id="amount-input"
                    type="number"
                    step="any"
                    placeholder={`e.g. ${settings.min_withdraw_zed}`}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    disabled={hasPending || !isVerified || !isLevelEligible || isPending}
                    className="font-mono text-base pr-16"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs font-mono text-muted-foreground">
                    ZED
                  </div>
                </div>

                {/* Live Naira conversion preview */}
                <div className="flex items-center justify-between text-xs font-mono rounded-md bg-secondary/40 border border-border p-3">
                  <span className="text-muted-foreground">Estimated Payout</span>
                  <span className="font-bold text-foreground text-sm">
                    ≈ ₦
                    {nairaPreview.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      (at ₦{tokenPrice.toFixed(2)}/ZED)
                    </span>
                  </span>
                </div>
              </div>

              {/* Destination selector tabs */}
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-semibold">Payout Destination</Label>
                <Tabs defaultValue="bank" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bank" className="flex items-center gap-2 text-xs">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Bank Account</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="wallet"
                      disabled
                      className="flex items-center gap-2 text-xs opacity-60 cursor-not-allowed"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Crypto Wallet</span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1 border-border font-mono">
                        Coming soon
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bank" className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="bank-name" className="text-xs">
                        Bank Name
                      </Label>
                      <input
                        list="banks-list"
                        id="bank-name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Select or enter your bank"
                        disabled={hasPending || !isVerified || !isLevelEligible || isPending}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <datalist id="banks-list">
                        {COMMON_BANKS.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="account-number" className="text-xs">
                        Account Number (10 digits)
                      </Label>
                      <Input
                        id="account-number"
                        type="text"
                        maxLength={10}
                        placeholder="0123456789"
                        value={accountNumber}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, "");
                          setAccountNumber(digitsOnly);
                        }}
                        disabled={hasPending || !isVerified || !isLevelEligible || isPending}
                        className="font-mono text-sm tracking-wider"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="account-name" className="text-xs">
                        Account Holder Name
                      </Label>
                      <Input
                        id="account-name"
                        type="text"
                        placeholder="Must match your verified NIN name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        disabled={hasPending || !isVerified || !isLevelEligible || isPending}
                        className="text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Summary notice */}
              <div className="rounded-lg border border-border bg-secondary/30 p-3.5 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your ZED is held until an admin reviews the request. The naira value is fixed at the rate when you submit. Payouts are manually approved and credited to your bank account.
                </p>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  hasPending ||
                  !isVerified ||
                  !isLevelEligible ||
                  isPending ||
                  numericAmount < settings.min_withdraw_zed ||
                  numericAmount > balanceZed ||
                  accountNumber.length !== 10 ||
                  !bankName ||
                  !accountName
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting Request...
                  </>
                ) : hasPending ? (
                  "Pending Request in Review"
                ) : (
                  "Submit Withdrawal Request"
                )}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Withdrawal History ────────────────────────────────────────────── */}
      <section aria-label="Withdrawal history" className="space-y-3 pt-4">
        <h2 className="type-caption text-muted-foreground font-semibold uppercase tracking-wider font-mono">
          Withdrawal Requests
        </h2>

        {requests.length === 0 ? (
          <Card className="p-8 border-border bg-card text-center">
            <Coins className="h-6 w-6 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-muted-foreground font-mono">
              No withdrawal requests yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card
                key={req.id}
                className="p-4 border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {req.amount_zed.toLocaleString()} ZED
                    </span>
                    <span className="text-muted-foreground text-xs">→</span>
                    <span className="font-mono text-sm font-bold text-emerald-500">
                      ₦{req.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {renderStatusBadge(req.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{req.bank_name}</span>
                    <span>·</span>
                    <span className="font-mono">{maskAccountNumber(req.account_number)}</span>
                    <span>·</span>
                    <span>{req.account_name}</span>
                    <span>·</span>
                    <span>
                      {new Date(req.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {req.reject_reason && (
                    <p className="text-xs text-rose-500 font-mono pt-1">
                      Reason: {req.reject_reason}
                    </p>
                  )}
                </div>

                {req.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                    disabled={isPending && cancellingId === req.id}
                    onClick={() => handleCancel(req.id)}
                  >
                    {isPending && cancellingId === req.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Cancel
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
