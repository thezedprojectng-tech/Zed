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
      <>
        <Header
          title="Call-up Letter Parser"
          subtitle="Extract state code, deployed state, and reporting date on your device."
        />
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 space-y-6">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </>
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
    <>
      <Header
        title="Call-up Letter Parser"
        subtitle="Extract your NYSC state code, deployed state, and reporting countdown entirely on your device."
      />

      <div className=" px-4 py-6 md:px-8">
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
              // Convert saved details into parsedData shape to re-open review
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
    </>
  );
}
