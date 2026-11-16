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
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
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

const DESTINATION_OPTIONS = [
  { value: "bank", label: "Bank account" },
  { value: "wallet", label: "Crypto wallet (Coming soon)" },
];

export function WithdrawClient({ overview }: WithdrawClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { settings, balanceZed, userLevel, isVerified, pendingRequest, requests } =
    overview;

  // Form state
  const [amountInput, setAmountInput] = useState<string>("");
  const [destination, setDestination] = useState<string>("bank");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");

  const numericAmount = parseFloat(amountInput) || 0;
  const tokenPrice = settings.token_price_ngn;
  const nairaPreview = calculateNairaAmount(numericAmount, tokenPrice);

  const isLevelEligible = userLevel >= settings.min_level;
  const isEnabled = settings.withdrawals_enabled;
  const hasPending = Boolean(pendingRequest);
  const isFormBlocked = hasPending || !isVerified || !isLevelEligible || !isEnabled;

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
      toast.error("Please verify your account before requesting a withdrawal.");
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

  const renderStatusPill = (status: WithdrawalStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            Pending review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
            Approved
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Paid
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            Rejected
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── 1. Page Header with Back Link & Stat Blocks ─────────────── */}
      <section className="space-y-1.5 pb-2">
        <div>
          <Link
            href="/mining"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Back to mining</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
              Withdraw ZED
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Convert your mined $ZED tokens to Nigerian Naira directly into your bank account.
            </p>
          </div>

          {/* Plain Stat Blocks on the Right (figures in app font, tabular-nums; rate not orange) */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="rounded-lg border border-border/70 bg-card p-3 sm:px-4 shadow-2xs space-y-0.5">
              <p className="text-xs text-muted-foreground">Available balance</p>
              <p className="text-base sm:text-lg font-semibold text-foreground font-sans tabular-nums">
                {balanceZed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZED
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-3 sm:px-4 shadow-2xs space-y-0.5">
              <p className="text-xs text-muted-foreground">Token rate</p>
              <p className="text-base sm:text-lg font-semibold text-foreground font-sans tabular-nums">
                ₦{tokenPrice.toFixed(2)} / ZED
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Gate Callouts at the Top ──────────────────────────────── */}
      {!isEnabled && (
        <div className="rounded-lg border border-border/70 border-l-2 border-l-amber-500 bg-secondary/30 p-4 text-xs flex items-start gap-3">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 stroke-[1.5]" />
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">Withdrawals open soon</p>
            <p className="text-muted-foreground leading-relaxed">
              The community redemption window is currently closed while the initial liquidity and token rate are being configured. Keep mining to grow your balance!
            </p>
          </div>
        </div>
      )}

      {isEnabled && !isVerified && (
        <div className="rounded-lg border border-border/70 border-l-2 border-l-amber-500 bg-secondary/30 p-4 text-xs flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 stroke-[1.5]" />
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">Account verification required</p>
            <p className="text-muted-foreground leading-relaxed">
              You must verify your identity before you can make bank withdrawals.{" "}
              <Link href="/verify" className="text-primary underline font-medium">
                Verify account now
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Level 2 Gate Callout */}
      {isEnabled && isVerified && !isLevelEligible && (
        <div className="rounded-lg border border-border/70 border-l-2 border-l-amber-500 bg-secondary/30 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">
                Level {settings.min_level} Required
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Withdrawals are currently open to miners at Level {settings.min_level} and above. Your current tier is Level {userLevel}.
              </p>
            </div>
          </div>
          <Link
            href="/mining"
            className="text-xs font-medium text-primary hover:underline shrink-0 pl-7 sm:pl-0"
          >
            See level requirements
          </Link>
        </div>
      )}

      {/* Pending request in review notice */}
      {hasPending && (
        <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">Pending withdrawal in review</p>
              <p className="text-muted-foreground leading-relaxed">
                You have a request of{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {pendingRequest?.amount_zed.toLocaleString()} ZED
                </span>{" "}
                (≈ ₦{pendingRequest?.amount_ngn.toLocaleString()}) to{" "}
                <span className="font-medium text-foreground">{pendingRequest?.bank_name}</span>{" "}
                ({maskAccountNumber(pendingRequest?.account_number || "")}).
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 h-8 shrink-0 self-start sm:self-auto"
            disabled={isPending && cancellingId === pendingRequest?.id}
            onClick={() => pendingRequest && handleCancel(pendingRequest.id)}
          >
            {isPending && cancellingId === pendingRequest?.id && (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            )}
            <span>Cancel request</span>
          </Button>
        </div>
      )}

      {/* ── 3. Withdrawal Form as Flat Sections ──────────────────────── */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Section 1: Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount-input" className="text-xs font-medium text-foreground">
                Amount to withdraw ($ZED)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-sans tabular-nums">
                  Min: {settings.min_withdraw_zed.toLocaleString()} · Max: {settings.max_withdraw_zed.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  disabled={isFormBlocked || isPending}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:pointer-events-none"
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
                disabled={isFormBlocked || isPending}
                className="h-10 text-sm font-sans tabular-nums pr-14"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs text-muted-foreground">
                ZED
              </div>
            </div>

            {/* Estimated payout as plain line under field */}
            <p className="text-xs text-muted-foreground leading-relaxed font-sans tabular-nums">
              Estimated payout:{" "}
              <strong className="text-foreground font-semibold">
                ₦
                {nairaPreview.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>{" "}
              <span>(at ₦{tokenPrice.toFixed(2)}/ZED)</span>
            </p>
          </div>

          <div className="h-px bg-border/60" />

          {/* Section 2: Payout Destination */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">
              Payout destination
            </Label>
            <div className="w-full">
              <SegmentedControl
                options={DESTINATION_OPTIONS}
                value={destination}
                onChange={(val) => {
                  if (val === "bank") setDestination(val);
                }}
                size="sm"
                ariaLabel="Payout destination"
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Section 3: Bank Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-foreground">
              Bank details
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="bank-name" className="text-xs font-medium text-foreground">
                Bank name
              </Label>
              <input
                list="banks-list"
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Select or enter your bank"
                disabled={isFormBlocked || isPending}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
              <datalist id="banks-list">
                {COMMON_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-number" className="text-xs font-medium text-foreground">
                Account number
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
                disabled={isFormBlocked || isPending}
                className="h-10 text-sm font-mono tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-name" className="text-xs font-medium text-foreground">
                Account holder name
              </Label>
              <Input
                id="account-name"
                type="text"
                placeholder="Must match your verified account name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isFormBlocked || isPending}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Explanatory note as a muted paragraph with an info icon (not a bordered box) */}
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground pt-1">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground stroke-[1.5]" />
            <p className="leading-relaxed">
              Your ZED is held until an admin reviews the request. The naira value is fixed at the rate when you submit. Payouts are manually approved and credited to your bank account.
            </p>
          </div>

          {/* Submit Action */}
          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              className="w-full h-10 sm:h-11 font-medium text-sm"
              disabled={
                isFormBlocked ||
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
                  <span>Submitting request...</span>
                </>
              ) : hasPending ? (
                "Pending request in review"
              ) : (
                "Submit withdrawal request"
              )}
            </Button>

            {/* Muted reason text when Level 2 gate blocks */}
            {!isLevelEligible && (
              <p className="text-xs text-center text-muted-foreground">
                Withdrawals open at Level 2
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ── 4. Withdrawal History Flat Rows with Dividers ───────────── */}
      <section aria-label="Withdrawal history" className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Withdrawal requests
        </h2>

        {requests.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card p-10 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Coins className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No withdrawal requests yet
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Submitted withdrawal requests and their payout statuses will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
            {requests.map((req) => {
              const isInactive = req.status === "cancelled" || req.status === "rejected";
              return (
                <article
                  key={req.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors"
                >
                  <div className="space-y-1.5 text-xs">
                    {/* Amount line + status pill */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground font-sans tabular-nums text-sm">
                        {req.amount_zed.toLocaleString()} ZED
                      </span>
                      <span className="text-muted-foreground">→</span>
                      {/* Neutral colour for cancelled and rejected rows */}
                      <span
                        className={`font-sans tabular-nums text-sm ${
                          isInactive
                            ? "text-muted-foreground font-normal"
                            : "font-semibold text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        ₦{req.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {renderStatusPill(req.status)}
                    </div>

                    {/* Destination & Date details */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                      <span className="font-medium text-foreground">{req.bank_name}</span>
                      <span>·</span>
                      <span className="font-mono text-xs">{maskAccountNumber(req.account_number)}</span>
                      <span>·</span>
                      <span>{req.account_name}</span>
                      <span>·</span>
                      <span className="font-sans tabular-nums">
                        {new Date(req.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Rejection reason */}
                    {req.reject_reason && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 pt-0.5">
                        Reason: {req.reject_reason}
                      </p>
                    )}
                  </div>

                  {/* Cancel button if pending */}
                  {req.status === "pending" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start sm:self-auto text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 h-8"
                      disabled={isPending && cancellingId === req.id}
                      onClick={() => handleCancel(req.id)}
                    >
                      {isPending && cancellingId === req.id && (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      )}
                      <span>Cancel</span>
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
