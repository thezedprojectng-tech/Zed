"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMounted } from "@/lib/hooks";
import { useCallUpStore } from "@/store/useCallUpStore";
import { type ParsedCallUpResult } from "@/lib/callup/parser";
import { type CallUpReviewValues } from "@/lib/callup/schema";
import { CallUpInput } from "./CallUpInput";
import { CallUpReview } from "./CallUpReview";
import { CallUpSummary } from "./CallUpSummary";
import { toast } from "sonner";

export function CallUpClient() {
  const isMounted = useIsMounted();
  const { details, saveDetails } = useCallUpStore();

  const [step, setStep] = useState<"input" | "review" | "summary">("input");
  const [parsedData, setParsedData] = useState<ParsedCallUpResult | null>(null);

  // If not mounted yet (hydration check), render loading skeleton
  if (!isMounted) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <Header
          backHref="/nav"
          backLabel="Back to Zed Nav"
          title="Call-up letter parser"
          subtitle="Extract state code, deployed state, and reporting date on your device."
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-9 w-72 rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Active step resolution: if user has saved details and hasn't started a new flow, show summary
  const effectiveStep =
    step === "input" && details ? "summary" : step;

  const handleParsed = (result: ParsedCallUpResult) => {
    setParsedData(result);
    setStep("review");
  };

  const handleConfirm = (values: CallUpReviewValues) => {
    saveDetails({
      fullName: values.fullName,
      stateCode: values.stateCode,
      callUpNumber: values.callUpNumber,
      campState: values.campState,
      campName: values.campName,
      reportingDate: values.reportingDate,
      batch: values.batch,
      stream: values.stream,
    });
    setStep("summary");
    toast.success("Call-up details saved locally");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <Header
        backHref="/nav"
        backLabel="Back to Zed Nav"
        title="Call-up letter parser"
        subtitle="Extract your NYSC state code, deployed state, and reporting countdown entirely on your device."
      />

      <div>
        {effectiveStep === "input" && (
          <CallUpInput
            onParsed={handleParsed}
            hasSavedDetails={Boolean(details)}
            onViewSaved={() => setStep("summary")}
          />
        )}

        {effectiveStep === "review" && parsedData && (
          <CallUpReview
            initialParsed={parsedData}
            onConfirm={handleConfirm}
            onBack={() => setStep("input")}
          />
        )}

        {effectiveStep === "summary" && details && (
          <CallUpSummary
            details={details}
            onEdit={() => {
              setParsedData({
                fullName: { value: details.fullName, confidence: "found" },
                stateCode: { value: details.stateCode, confidence: "found" },
                callUpNumber: { value: details.callUpNumber, confidence: "found" },
                campState: { value: details.campState, confidence: "found" },
                campName: { value: details.campName, confidence: "found" },
                reportingDate: { value: details.reportingDate, confidence: "found" },
                batch: { value: details.batch, confidence: "found" },
                stream: { value: details.stream, confidence: "found" },
              });
              setStep("review");
            }}
            onNewParse={() => {
              setParsedData(null);
              setStep("input");
            }}
          />
        )}
      </div>
    </div>
  );
}
