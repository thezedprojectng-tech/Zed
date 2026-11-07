"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  User,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NIGERIAN_BANKS } from "@/lib/verification/banks";
import { submitBankVerificationAction } from "@/lib/verification/actions";

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

export function VerifyBankClient({
  profileName,
  isUserVerified,
  initialVerification,
}: VerifyBankClientProps) {
  const router = useRouter();
  const [verification, setVerification] = useState<UserVerificationSummary | null>(
    initialVerification
  );
  const [bankCode, setBankCode] = useState(initialVerification?.bank_code ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const status = verification?.status ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!bankCode) {
      setFormError("Please select your bank.");
      return;
    }
    const cleanNumber = accountNumber.trim();
    if (!/^[0-9]{10}$/.test(cleanNumber)) {
      setFormError("Account number must be exactly 10 digits.");
      return;
    }
    const cleanName = accountName.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      setFormError("Account name must be between 2 and 100 characters.");
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
    <div className="space-y-6">
      {/* ── Status: Approved ────────────────────────────────────────── */}
      {verification && status === "approved" && (
        <Card className="p-6 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Account Verified</h2>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Approved
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your bank account has been confirmed and verified for civic identity and future payouts.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium text-foreground">{verification.bank_name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-mono font-medium text-foreground">
                •••• •••• {verification.last4}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-medium text-foreground">{verification.account_name}</span>
            </div>
            {verification.reviewed_at && (
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Verified On</span>
                <span>{new Date(verification.reviewed_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Status: Pending ─────────────────────────────────────────── */}
      {verification && status === "pending" && (
        <Card className="p-6 border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Verification Under Review</h2>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Pending Review
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submissions are reviewed manually. This page updates when a decision is made.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium text-foreground">{verification.bank_name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-mono font-medium text-foreground">
                •••• •••• {verification.last4}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-medium text-foreground">{verification.account_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Submitted</span>
              <span>{new Date(verification.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      )}

      {/* ── Status: Rejected (Alert + Form to resubmit) ──────────────── */}
      {verification && status === "rejected" && (
        <Card className="p-5 border-destructive/30 bg-destructive/5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                Verification Request Not Approved
              </h2>
              <p className="text-xs text-muted-foreground">
                {verification.reject_reason || "The submitted bank account could not be verified."}
              </p>
              <p className="text-xs font-medium text-foreground/80 pt-1">
                Please check your bank details below and resubmit.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Submission / Resubmission Form ──────────────────────────── */}
      {(status === null || status === "rejected") && (
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                {status === "rejected" ? "Resubmit Bank Details" : "Submit Bank Details"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use this to confirm you are a real person and for future payouts. The account name
              must match your Zed profile name.
            </p>
          </div>

          {/* Profile Name Reminder */}
          {profileName && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3.5 py-2.5 text-xs text-muted-foreground border border-border">
              <User className="h-4 w-4 text-foreground/70 shrink-0" />
              <span>
                Your Zed profile name: <strong className="text-foreground">{profileName}</strong>
              </span>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankSelect" className="text-xs font-medium">
                Bank or Financial Institution
              </Label>
              <select
                id="bankSelect"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select your bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-xs font-medium">
                10-Digit Account Number
              </Label>
              <div className="relative">
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
                  }}
                  disabled={isPending}
                  className="font-mono text-sm tracking-wider"
                  required
                />
                <CreditCard className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Enter your 10-digit Nigerian NIBSS bank account number.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName" className="text-xs font-medium">
                Account Name (as registered with your bank)
              </Label>
              <Input
                id="accountName"
                type="text"
                placeholder="e.g. John Chukwuemeka Doe"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isPending}
                maxLength={100}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Must match the full legal name associated with your bank account.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting verification...
                </>
              ) : status === "rejected" ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resubmit Bank Verification
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

