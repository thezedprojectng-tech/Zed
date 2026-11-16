"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ParsedCallUpResult,
  type FieldConfidence,
} from "@/lib/callup/parser";
import {
  callUpReviewSchema,
  type CallUpReviewValues,
} from "@/lib/callup/schema";

interface CallUpReviewProps {
  initialParsed: ParsedCallUpResult;
  onConfirm: (values: CallUpReviewValues) => void;
  onBack: () => void;
}

export function CallUpReview({
  initialParsed,
  onConfirm,
  onBack,
}: CallUpReviewProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CallUpReviewValues>({
    resolver: zodResolver(callUpReviewSchema),
    defaultValues: {
      fullName: initialParsed.fullName.value,
      stateCode: initialParsed.stateCode.value,
      callUpNumber: initialParsed.callUpNumber.value,
      campState: initialParsed.campState.value,
      campName: initialParsed.campName.value,
      reportingDate: initialParsed.reportingDate.value,
      batch: initialParsed.batch.value,
      stream: initialParsed.stream.value,
    },
  });

  const renderConfidenceBadge = (confidence: FieldConfidence) => {
    if (confidence === "found") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--data-verified-ink)]">
          <CheckCircle2 className="h-3 w-3 stroke-[2]" />
          <span>Detected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <AlertCircle className="h-3 w-3 stroke-[1.5]" />
        <span>Not detected</span>
      </span>
    );
  };

  return (
    <section className="space-y-6 max-w-4xl" aria-labelledby="review-heading">
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6">
        <header className="space-y-1.5 border-b border-border/60 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2
                id="review-heading"
                className="text-base font-semibold text-foreground tracking-tight"
              >
                Review and correct details
              </h2>
              <p className="text-xs text-muted-foreground">
                Nothing is verified automatically. Please double-check all extracted fields against your official Call-up Letter before confirming.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-xs h-9"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1 stroke-[1.5]" />
              Re-paste text
            </Button>
          </div>
        </header>

        <form onSubmit={handleSubmit(onConfirm)} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullName" className="text-xs font-medium text-foreground">
                  Full name
                </Label>
                {renderConfidenceBadge(initialParsed.fullName.confidence)}
              </div>
              <Input
                id="fullName"
                placeholder="e.g. Adeniran Babajide Samuel"
                className="h-10 text-sm"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* State Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="stateCode" className="text-xs font-medium text-foreground">
                  State code
                </Label>
                {renderConfidenceBadge(initialParsed.stateCode.confidence)}
              </div>
              <Input
                id="stateCode"
                placeholder="e.g. LA/26A/4912"
                className="h-10 text-sm font-mono"
                {...register("stateCode")}
              />
              {errors.stateCode && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.stateCode.message}
                </p>
              )}
            </div>

            {/* Call-up Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="callUpNumber" className="text-xs font-medium text-foreground">
                  Call-up number
                </Label>
                {renderConfidenceBadge(initialParsed.callUpNumber.confidence)}
              </div>
              <Input
                id="callUpNumber"
                placeholder="e.g. NYSC/ABU/2026/142981"
                className="h-10 text-sm font-mono"
                {...register("callUpNumber")}
              />
              {errors.callUpNumber && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.callUpNumber.message}
                </p>
              )}
            </div>

            {/* Deployed Camp State */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="campState" className="text-xs font-medium text-foreground">
                  State of deployment
                </Label>
                {renderConfidenceBadge(initialParsed.campState.confidence)}
              </div>
              <Input
                id="campState"
                placeholder="e.g. Lagos"
                className="h-10 text-sm"
                {...register("campState")}
              />
              {errors.campState && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.campState.message}
                </p>
              )}
            </div>

            {/* Orientation Camp Venue */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="campName" className="text-xs font-medium text-foreground">
                  Orientation camp venue / address
                </Label>
                {renderConfidenceBadge(initialParsed.campName.confidence)}
              </div>
              <Input
                id="campName"
                placeholder="e.g. NYSC Permanent Orientation Camp, Iyana-Ipaja, Lagos State"
                className="h-10 text-sm"
                {...register("campName")}
              />
              {errors.campName && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.campName.message}
                </p>
              )}
            </div>

            {/* Reporting Date */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="reportingDate" className="text-xs font-medium text-foreground">
                  Reporting date
                </Label>
                {renderConfidenceBadge(initialParsed.reportingDate.confidence)}
              </div>
              <Input
                id="reportingDate"
                type="date"
                className="h-10 text-sm"
                {...register("reportingDate")}
              />
              {errors.reportingDate && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.reportingDate.message}
                </p>
              )}
            </div>

            {/* Batch & Stream */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch" className="text-xs font-medium text-foreground">
                    Batch
                  </Label>
                  {renderConfidenceBadge(initialParsed.batch.confidence)}
                </div>
                <Input
                  id="batch"
                  placeholder="e.g. 2026 Batch A"
                  className="h-10 text-sm"
                  {...register("batch")}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stream" className="text-xs font-medium text-foreground">
                    Stream
                  </Label>
                  {renderConfidenceBadge(initialParsed.stream.confidence)}
                </div>
                <Input
                  id="stream"
                  placeholder="e.g. Stream 1"
                  className="h-10 text-sm"
                  {...register("stream")}
                />
              </div>
            </div>
          </div>

          {/* Local storage note */}
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
            <Info className="h-4 w-4 text-primary shrink-0 stroke-[1.5]" />
            <span>
              Saving will store these confirmed details in your browser&apos;s local storage so you can track your reporting countdown and pre-camp packing list.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs h-9 px-4 font-medium gap-1.5">
              <Save className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>Save details &amp; view checklist</span>
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
