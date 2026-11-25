"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Check,
  Loader2,
  User,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NIGERIAN_BANKS } from "@/lib/verification/banks";
import { submitBankVerificationAction } from "@/lib/verification/actions";
import { cn } from "@/lib/utils";

export interface UserVerificationSummary {
  id: string;
  bank_code: string;
  bank_name: string;
  last4: string;
  account_name: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface VerifyBankClientProps {
  profileName: string;
  isUserVerified: boolean;
  initialVerification: UserVerificationSummary | null;
}

function formatVerifyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function StatusProgressLine({ status }: { status: "pending" | "approved" }) {
  const steps = [
    { key: "submitted", label: "Submitted", done: true, active: false },
    {
      key: "review",
      label: "In review",
      done: status === "approved",
      active: status === "pending",
    },
    {
      key: "verified",
      label: "Verified",
      done: status === "approved",
      active: false,
    },
  ];

  return (
    <ol
      aria-label="Verification progress"
      className="flex items-center justify-between gap-2 py-2"
    >
      {steps.map((step, idx) => (
        <li key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-medium motion-safe:transition-colors duration-200",
                step.done
                  ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                  : step.active
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-border/70 bg-secondary/50 text-muted-foreground"
              )}
            >
              {step.done ? (
                <Check className="h-3 w-3 stroke-[2.25]" />
              ) : (
                <span className="tabular-nums">{idx + 1}</span>
              )}
            </span>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                step.done
                  ? "text-foreground"
                  : step.active
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "h-px flex-1 mx-2 sm:mx-3",
                step.done && (steps[idx + 1].done || steps[idx + 1].active)
                  ? status === "approved"
                    ? "bg-[var(--data-verified-border)]"
                    : "bg-amber-500/30"
                  : "bg-border/60"
              )}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

export function VerifyBankClient({
  profileName,
  isUserVerified: _isUserVerified,
  initialVerification,
}: VerifyBankClientProps) {
  const router = useRouter();
  const [verification, setVerification] = useState<UserVerificationSummary | null>(
    initialVerification
  );
  const [bankCode, setBankCode] = useState(initialVerification?.bank_code ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const status = verification?.status ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const nextErrors: {
      bankCode?: string;
      accountNumber?: string;
      accountName?: string;
    } = {};

    if (!bankCode) {
      nextErrors.bankCode = "Please select your bank.";
    }
    const cleanNumber = accountNumber.trim();
    if (!/^[0-9]{10}$/.test(cleanNumber)) {
      nextErrors.accountNumber = "Account number must be exactly 10 digits.";
    }
    const cleanName = accountName.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      nextErrors.accountName = "Account name must be between 2 and 100 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(
        nextErrors.bankCode ||
          nextErrors.accountNumber ||
          nextErrors.accountName ||
          null
      );
      return;
    }

    startTransition(async () => {
      const res = await submitBankVerificationAction({
        bank_code: bankCode,
        account_number: cleanNumber,
        account_name: cleanName,
      });

      if (!res.ok) {
        setFormError(res.error);
        toast.error(res.error);
        return;
      }

      toast.success("Bank verification submitted successfully!");
      const selectedBank = NIGERIAN_BANKS.find((b) => b.code === bankCode);
      setVerification({
        id: verification?.id ?? "temp-id",
        bank_code: bankCode,
        bank_name: selectedBank?.name ?? "Nigerian Bank",
        last4: cleanNumber.slice(-4),
        account_name: cleanName,
        status: "pending",
        reject_reason: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
      });
      setAccountNumber("");
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ── Left Column: Status / Form ──────────────────────────────── */}
      <div className="lg:col-span-7 space-y-6">
        {/* ── Status: Approved ──────────────────────────────────────── */}
        {verification && status === "approved" && (
          <section
            aria-label="Approved bank verification"
            className="relative overflow-hidden rounded-lg border border-[var(--data-verified-border)] bg-card p-5 sm:p-6 space-y-5 motion-safe:transition-colors duration-200"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-[var(--data-verified)]" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]">
                  <CheckCircle2 className="h-5 w-5 stroke-[1.75]" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      Account verified
                    </h2>
                    <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your bank account is confirmed. You can now request ZED withdrawals.
                  </p>
                </div>
              </div>
            </div>

            <StatusProgressLine status="approved" />

            <dl className="divide-y divide-border/50 border-t border-border/50">
              <div className="py-3 flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="font-medium text-foreground text-right">
                  {verification.bank_name}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Account number</dt>
                <dd className="font-medium text-foreground tabular-nums text-right">
                  •••• •••• {verification.last4}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Account name</dt>
                <dd className="font-medium text-foreground text-right">
                  {verification.account_name}
                </dd>
              </div>
              {verification.reviewed_at && (
                <div className="py-3 pb-0 flex items-center justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">Verified on</dt>
                  <dd className="font-medium text-foreground tabular-nums text-right">
                    {formatVerifyDate(verification.reviewed_at)}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* ── Status: Pending ───────────────────────────────────────── */}
        {verification && status === "pending" && (
          <section
            aria-label="Pending bank verification"
            className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-card p-5 sm:p-6 space-y-5 motion-safe:transition-colors duration-200"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-amber-500" />
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <Clock className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    Verification in review
                  </h2>
                  <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    In review
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Submissions are reviewed manually. This page updates once a decision is made.
                </p>
              </div>
            </div>

            <StatusProgressLine status="pending" />

            <dl className="divide-y divide-border/50 border-t border-border/50">
              <div className="py-3 flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="font-medium text-foreground text-right">
                  {verification.bank_name}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Account number</dt>
                <dd className="font-medium text-foreground tabular-nums text-right">
                  •••• •••• {verification.last4}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Account name</dt>
                <dd className="font-medium text-foreground text-right">
                  {verification.account_name}
                </dd>
              </div>
              <div className="py-3 pb-0 flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium text-foreground tabular-nums text-right">
                  {formatVerifyDate(verification.created_at)}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* ── Status: Rejected ──────────────────────────────────────── */}
        {verification && status === "rejected" && (
          <section
            aria-label="Rejected bank verification"
            className="relative overflow-hidden rounded-lg border border-rose-500/30 bg-card p-5 space-y-2.5"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-rose-500" />
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Verification not approved
                  </h2>
                  <span className="inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                    Rejected
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {verification.reject_reason ||
                    "The submitted bank account could not be verified."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Review your details below and submit again.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Submission / Resubmission Form ────────────────────────── */}
        {(status === null || status === "rejected") && (
          <section
            aria-label="Submit bank verification"
            className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-5"
          >
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                {status === "rejected"
                  ? "Resubmit bank details"
                  : "Submit bank details"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Confirming a bank account is required before withdrawing ZED. The account name must match your Zed profile name.
              </p>
            </div>

            {profileName && (
              <div className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground">
                <User className="h-4 w-4 text-foreground/70 shrink-0 stroke-[1.5]" />
                <span>
                  Your Zed profile name:{" "}
                  <strong className="font-medium text-foreground">
                    {profileName}
                  </strong>
                </span>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="bankSelect" className="text-xs font-medium text-foreground">
                  Bank or financial institution
                </Label>
                <select
                  id="bankSelect"
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    if (fieldErrors.bankCode) {
                      setFieldErrors((prev) => ({ ...prev, bankCode: undefined }));
                    }
                  }}
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.bankCode)}
                  className={cn(
                    "w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm text-foreground motion-safe:transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    fieldErrors.bankCode ? "border-rose-500/60" : "border-input"
                  )}
                  required
                >
                  <option value="">Select your bank</option>
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.bankCode && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {fieldErrors.bankCode}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accountNumber" className="text-xs font-medium text-foreground">
                  Account number
                </Label>
                <Input
                  id="accountNumber"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setAccountNumber(onlyNums);
                    if (fieldErrors.accountNumber) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        accountNumber: undefined,
                      }));
                    }
                  }}
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.accountNumber)}
                  className={cn(
                    "h-10 rounded-lg text-sm tabular-nums",
                    fieldErrors.accountNumber && "border-rose-500/60"
                  )}
                  required
                />
                {fieldErrors.accountNumber ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {fieldErrors.accountNumber}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enter your 10-digit Nigerian NIBSS bank account number.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accountName" className="text-xs font-medium text-foreground">
                  Account name
                </Label>
                <Input
                  id="accountName"
                  type="text"
                  placeholder="As registered with your bank"
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    if (fieldErrors.accountName) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        accountName: undefined,
                      }));
                    }
                  }}
                  disabled={isPending}
                  maxLength={100}
                  aria-invalid={Boolean(fieldErrors.accountName)}
                  className={cn(
                    "h-10 rounded-lg text-sm",
                    fieldErrors.accountName && "border-rose-500/60"
                  )}
                  required
                />
                {fieldErrors.accountName ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {fieldErrors.accountName}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Must match the full legal name associated with your bank account.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 rounded-lg font-medium motion-safe:transition-colors duration-200"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                    <span>Submitting verification...</span>
                  </>
                ) : status === "rejected" ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4 stroke-[1.5]" />
                    <span>Resubmit bank verification</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4 stroke-[1.5]" />
                    <span>Submit for verification</span>
                  </>
                )}
              </Button>
            </form>
          </section>
        )}
      </div>

      {/* ── Right Column: What verification unlocks ─────────────────── */}
      <aside
        aria-label="What verification unlocks"
        className="lg:col-span-5 rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-foreground">
          What verification unlocks
        </h2>
        <ul className="divide-y divide-border/50 text-sm">
          <li className="py-3 first:pt-0 space-y-0.5">
            <p className="font-medium text-foreground">Bank withdrawals</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Required before you can withdraw ZED to a Nigerian bank account (alongside Level 2).
            </p>
          </li>
          <li className="py-3 space-y-0.5">
            <p className="font-medium text-foreground">Higher Zed Market limits</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Increases your limit from 3 to 10 active listings and from 2 to 5 new listings per 24 hours.
            </p>
          </li>
          <li className="py-3 last:pb-0 space-y-0.5">
            <p className="font-medium text-foreground">Locked legal name</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Locks your full legal name on your profile to match your confirmed bank account.
            </p>
          </li>
        </ul>
      </aside>
    </div>
  );
}
