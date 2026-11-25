"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminSkillSettings } from "@/lib/skill/admin-actions";
import { adminUpdateSkillSettingsAction } from "@/lib/skill/admin-actions";
import {
  skillSettingsSchema,
  validateScoreBands,
  type ScoreBand,
} from "@/lib/skill/validation";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AdminSkillSettingsClientProps {
  initialSettings: AdminSkillSettings;
}

export function AdminSkillSettingsClient({
  initialSettings,
}: AdminSkillSettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [defaultPassMark, setDefaultPassMark] = useState(
    String(initialSettings.default_pass_mark)
  );
  const [defaultMaxAttempts, setDefaultMaxAttempts] = useState(
    String(initialSettings.default_max_attempts)
  );
  const [defaultMinTimePct, setDefaultMinTimePct] = useState(
    String(initialSettings.default_min_time_pct)
  );

  const [scoreBands, setScoreBands] = useState<ScoreBand[]>(
    initialSettings.score_bands
  );

  const [paymentMode] = useState<"manual" | "paystack">("manual");
  const [manualBankName, setManualBankName] = useState(
    initialSettings.manual_bank_name
  );
  const [manualAccountNumber, setManualAccountNumber] = useState(
    initialSettings.manual_account_number
  );
  const [manualAccountName, setManualAccountName] = useState(
    initialSettings.manual_account_name
  );
  const [manualInstructions, setManualInstructions] = useState(
    initialSettings.manual_instructions
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddBand = () => {
    const lastMin =
      scoreBands.length > 0 ? scoreBands[scoreBands.length - 1].min : 50;
    const nextMin = Math.max(0, lastMin - 15);
    setScoreBands((prev) => [...prev, { min: nextMin, label: "" }]);
    setErrorMessage(null);
  };

  const handleRemoveBand = (index: number) => {
    setScoreBands((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const handleBandChange = (
    index: number,
    field: "min" | "label",
    value: string
  ) => {
    setScoreBands((prev) =>
      prev.map((band, i) => {
        if (i !== index) return band;
        if (field === "min") {
          const parsed = value === "" ? 0 : Number(value);
          return { ...band, min: Number.isNaN(parsed) ? 0 : parsed };
        }
        return { ...band, label: value };
      })
    );
    setErrorMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedSettings = skillSettingsSchema.safeParse({
      default_pass_mark: Number(defaultPassMark),
      default_max_attempts: Number(defaultMaxAttempts),
      default_min_time_pct: Number(defaultMinTimePct),
      payment_mode: paymentMode,
      manual_bank_name: manualBankName,
      manual_account_number: manualAccountNumber,
      manual_account_name: manualAccountName,
      manual_instructions: manualInstructions,
    });

    if (!parsedSettings.success) {
      const msg =
        parsedSettings.error.issues[0]?.message ?? "Please check your inputs.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    const bandValidation = validateScoreBands(scoreBands);
    if (!bandValidation.ok) {
      setErrorMessage(bandValidation.error);
      toast.error(bandValidation.error);
      return;
    }

    startTransition(async () => {
      const res = await adminUpdateSkillSettingsAction({
        ...parsedSettings.data,
        score_bands: scoreBands,
      });

      if (!res.ok) {
        setErrorMessage(res.error);
        toast.error(res.error);
        return;
      }

      toast.success("Skill settings saved");
      router.refresh();
    });
  };

  return (
    <div className="max-w-[960px] mx-auto space-y-6 pb-16">
      <div className="space-y-3">
        <Link
          href="/admin/skill"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground motion-safe:transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>Back to skill content</span>
        </Link>

        <AdminPageHeader
          title="Skill settings"
          description="Set default pass marks, quiz attempt limits, certificate score bands, and manual payment details."
          icon={Settings}
          section="programs"
        />
      </div>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── 1. Course & Quiz Defaults ────────────────────────────── */}
        <section
          aria-labelledby="defaults-heading"
          className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4"
        >
          <div className="space-y-1">
            <h2
              id="defaults-heading"
              className="text-base font-semibold text-foreground"
            >
              Course and quiz defaults
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Used whenever a course or quiz leaves its own override blank.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="defaultPassMark"
                className="text-xs font-medium text-foreground"
              >
                Default pass mark (%)
              </Label>
              <Input
                id="defaultPassMark"
                type="number"
                min={1}
                max={100}
                value={defaultPassMark}
                onChange={(e) => setDefaultPassMark(e.target.value)}
                disabled={isPending}
                className="h-10 rounded-lg text-sm tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="defaultMaxAttempts"
                className="text-xs font-medium text-foreground"
              >
                Default quiz attempts
              </Label>
              <Input
                id="defaultMaxAttempts"
                type="number"
                min={1}
                max={20}
                value={defaultMaxAttempts}
                onChange={(e) => setDefaultMaxAttempts(e.target.value)}
                disabled={isPending}
                className="h-10 rounded-lg text-sm tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="defaultMinTimePct"
                className="text-xs font-medium text-foreground"
              >
                Default minimum lesson time (%)
              </Label>
              <Input
                id="defaultMinTimePct"
                type="number"
                min={0}
                max={100}
                value={defaultMinTimePct}
                onChange={(e) => setDefaultMinTimePct(e.target.value)}
                disabled={isPending}
                className="h-10 rounded-lg text-sm tabular-nums"
              />
            </div>
          </div>
        </section>

        {/* ── 2. Score Bands Editor ────────────────────────────────── */}
        <section
          aria-labelledby="score-bands-heading"
          className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2
                id="score-bands-heading"
                className="text-base font-semibold text-foreground"
              >
                Score bands
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Order bands from highest minimum score to lowest (for example: 85, 70, 50).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBand}
              disabled={isPending}
              className="h-8 text-xs rounded-lg gap-1.5 border-border/70 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add band</span>
            </Button>
          </div>

          {scoreBands.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 p-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                No score bands configured yet. Add at least one band.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50 border-t border-border/50">
              {scoreBands.map((band, idx) => (
                <div
                  key={idx}
                  className="py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="w-full sm:w-36 space-y-1">
                    <Label
                      htmlFor={`band-min-${idx}`}
                      className="text-xs text-muted-foreground"
                    >
                      Minimum score (%)
                    </Label>
                    <Input
                      id={`band-min-${idx}`}
                      type="number"
                      min={0}
                      max={100}
                      value={band.min}
                      onChange={(e) =>
                        handleBandChange(idx, "min", e.target.value)
                      }
                      disabled={isPending}
                      className="h-9 rounded-lg text-sm tabular-nums"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`band-label-${idx}`}
                      className="text-xs text-muted-foreground"
                    >
                      Band label
                    </Label>
                    <Input
                      id={`band-label-${idx}`}
                      type="text"
                      value={band.label}
                      placeholder="e.g. Distinction"
                      onChange={(e) =>
                        handleBandChange(idx, "label", e.target.value)
                      }
                      disabled={isPending}
                      maxLength={60}
                      className="h-9 rounded-lg text-sm"
                    />
                  </div>

                  <div className="sm:pt-5 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBand(idx)}
                      disabled={isPending || scoreBands.length <= 1}
                      aria-label={`Remove band ${idx + 1}`}
                      className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 3. Payment Mode & Manual Details ─────────────────────── */}
        <section
          aria-labelledby="payment-heading"
          className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-5"
        >
          <div className="space-y-1">
            <h2
              id="payment-heading"
              className="text-base font-semibold text-foreground"
            >
              Course payments
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose how learners pay for paid courses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className={cn(
                "rounded-lg border p-4 space-y-1 motion-safe:transition-colors duration-150",
                "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Manual bank transfer
                </span>
                <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Learners transfer to your bank account and upload proof for review.
              </p>
            </div>

            <div
              aria-disabled="true"
              className="rounded-lg border border-border/70 bg-secondary/30 p-4 space-y-1 opacity-60 cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Paystack
                </span>
                <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automated card and bank checkout is not enabled yet.
              </p>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4 space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Manual payment details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="manualBankName"
                  className="text-xs font-medium text-foreground"
                >
                  Bank name
                </Label>
                <Input
                  id="manualBankName"
                  type="text"
                  value={manualBankName}
                  onChange={(e) => setManualBankName(e.target.value)}
                  placeholder="e.g. GTBank"
                  disabled={isPending}
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="manualAccountNumber"
                  className="text-xs font-medium text-foreground"
                >
                  Account number
                </Label>
                <Input
                  id="manualAccountNumber"
                  type="text"
                  inputMode="numeric"
                  value={manualAccountNumber}
                  onChange={(e) => setManualAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  disabled={isPending}
                  className="h-10 rounded-lg text-sm tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="manualAccountName"
                  className="text-xs font-medium text-foreground"
                >
                  Account name
                </Label>
                <Input
                  id="manualAccountName"
                  type="text"
                  value={manualAccountName}
                  onChange={(e) => setManualAccountName(e.target.value)}
                  placeholder="e.g. Zed Digital Ltd"
                  disabled={isPending}
                  className="h-10 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="manualInstructions"
                className="text-xs font-medium text-foreground"
              >
                Payment instructions
              </Label>
              <Textarea
                id="manualInstructions"
                rows={3}
                value={manualInstructions}
                onChange={(e) => setManualInstructions(e.target.value)}
                placeholder="Include what reference to use and how long verification takes..."
                disabled={isPending}
                className="rounded-lg text-sm leading-relaxed"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 px-5 rounded-lg font-medium gap-2 motion-safe:transition-colors duration-200"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                <span>Saving settings...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 stroke-[1.5]" />
                <span>Save settings</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
