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
import { Badge } from "@/components/ui/badge";
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
        <Badge
          variant="outline"
          className="h-5 px-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 font-normal"
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          Detected
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="h-5 px-1.5 text-[10px] font-mono text-muted-foreground border-border bg-muted/30 gap-1 font-normal"
      >
        <AlertCircle className="h-2.5 w-2.5" />
        Not detected
      </Badge>
    );
  };

  return (
    <section className="space-y-6" aria-labelledby="review-heading">
      <div className="rounded-xl border border-hairline bg-card p-4 sm:p-6 space-y-6">
        <header className="space-y-1.5 border-hairline-b pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2
                id="review-heading"
                className="text-base font-semibold text-foreground"
              >
                Review and correct the details
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
              className="text-xs h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Re-paste Text
            </Button>
          </div>
        </header>

        <form onSubmit={handleSubmit(onConfirm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullName" className="text-xs font-medium">
                  Full Name
                </Label>
                {renderConfidenceBadge(initialParsed.fullName.confidence)}
              </div>
              <Input
                id="fullName"
                placeholder="e.g. ADENIRAN BABAJIDE SAMUEL"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-[11px] text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* State Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="stateCode" className="text-xs font-medium">
                  State Code
                </Label>
                {renderConfidenceBadge(initialParsed.stateCode.confidence)}
              </div>
              <Input
                id="stateCode"
                placeholder="e.g. LA/26A/4912"
                className="font-mono"
                {...register("stateCode")}
              />
              {errors.stateCode && (
                <p className="text-[11px] text-destructive">
                  {errors.stateCode.message}
                </p>
              )}
            </div>

            {/* Call-up Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="callUpNumber" className="text-xs font-medium">
                  Call-up Number
                </Label>
                {renderConfidenceBadge(initialParsed.callUpNumber.confidence)}
              </div>
              <Input
                id="callUpNumber"
                placeholder="e.g. NYSC/ABU/2026/142981"
                className="font-mono"
                {...register("callUpNumber")}
              />
              {errors.callUpNumber && (
                <p className="text-[11px] text-destructive">
                  {errors.callUpNumber.message}
                </p>
              )}
            </div>

            {/* Deployed Camp State */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="campState" className="text-xs font-medium">
                  State of Deployment
                </Label>
                {renderConfidenceBadge(initialParsed.campState.confidence)}
              </div>
              <Input
                id="campState"
                placeholder="e.g. Lagos"
                {...register("campState")}
              />
              {errors.campState && (
                <p className="text-[11px] text-destructive">
                  {errors.campState.message}
                </p>
              )}
            </div>

            {/* Orientation Camp Venue */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="campName" className="text-xs font-medium">
                  Orientation Camp Venue / Address
                </Label>
                {renderConfidenceBadge(initialParsed.campName.confidence)}
              </div>
              <Input
                id="campName"
                placeholder="e.g. NYSC Permanent Orientation Camp, Iyana-Ipaja, Lagos State"
                {...register("campName")}
              />
              {errors.campName && (
                <p className="text-[11px] text-destructive">
                  {errors.campName.message}
                </p>
              )}
            </div>

            {/* Reporting Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reportingDate" className="text-xs font-medium">
                  Reporting Date (YYYY-MM-DD)
                </Label>
                {renderConfidenceBadge(initialParsed.reportingDate.confidence)}
              </div>
              <Input
                id="reportingDate"
                type="date"
                {...register("reportingDate")}
              />
              {errors.reportingDate && (
                <p className="text-[11px] text-destructive">
                  {errors.reportingDate.message}
                </p>
              )}
            </div>

            {/* Batch & Stream */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch" className="text-xs font-medium">
                    Batch
                  </Label>
                  {renderConfidenceBadge(initialParsed.batch.confidence)}
                </div>
                <Input
                  id="batch"
                  placeholder="e.g. 2026 Batch A"
                  {...register("batch")}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stream" className="text-xs font-medium">
                    Stream
                  </Label>
                  {renderConfidenceBadge(initialParsed.stream.confidence)}
                </div>
                <Input
                  id="stream"
                  placeholder="e.g. Stream 1"
                  {...register("stream")}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-hairline bg-muted/20 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
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
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-medium">
              <Save className="h-4 w-4 mr-1.5" />
              Save Details & View Checklist
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
