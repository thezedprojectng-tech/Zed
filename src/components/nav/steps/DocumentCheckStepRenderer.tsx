"use client";

import { useRef } from "react";
import type { DocumentCheckStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Circle, Paperclip, ArrowRight, ArrowLeft } from "lucide-react";

interface DocumentCheckStepRendererProps {
  step: DocumentCheckStep;
  confirmedIds: string[];
  onToggle: (docId: string) => void;
  onNext: () => void;
  onBack: (() => void) | null;
  isLast: boolean;
}

export function DocumentCheckStepRenderer({
  step,
  confirmedIds,
  onToggle,
  onNext,
  onBack,
  isLast,
}: DocumentCheckStepRendererProps) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requiredDocs = step.documents.filter((d) => d.required);
  const allRequiredConfirmed = requiredDocs.every((d) =>
    confirmedIds.includes(d.id)
  );

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Mark each document as &ldquo;I have this&rdquo;. You can optionally attach a local file preview — files remain entirely on your device.
      </p>

      <ul className="space-y-2.5">
        {step.documents.map((doc) => {
          const confirmed = confirmedIds.includes(doc.id);
          return (
            <li key={doc.id}>
              <div
                className={cn(
                  "rounded-lg border p-3.5 min-h-[44px] space-y-2.5 transition-colors",
                  confirmed
                    ? "bg-[var(--data-verified-subtle)] border-[var(--data-verified-border)] text-foreground"
                    : "bg-card border-border/70 text-foreground"
                )}
              >
                {/* Row: check icon + label + optional tag */}
                <div
                  className="flex items-start gap-3 cursor-pointer select-none"
                  onClick={() => onToggle(doc.id)}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      confirmed
                        ? "bg-[var(--data-verified)] border-[var(--data-verified)] text-white"
                        : "border-border/80 bg-secondary/50 text-transparent"
                    )}
                    aria-label={confirmed ? `Unconfirm ${doc.label}` : `Confirm ${doc.label}`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-sm font-medium leading-snug",
                          confirmed
                            ? "text-muted-foreground line-through decoration-muted-foreground/60"
                            : "text-foreground"
                        )}
                      >
                        {doc.label}
                      </span>
                      {!doc.required && (
                        <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/50 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </div>
                    {doc.acceptedFormats && doc.acceptedFormats.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Accepted: {doc.acceptedFormats.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Local file preview attachment (zero server upload) */}
                <div className="pl-8 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileRefs.current[doc.id]?.click()}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Attach local preview for ${doc.label}`}
                  >
                    <Paperclip className="h-3 w-3 stroke-[1.5]" />
                    <span>Attach local file preview (optional)</span>
                  </button>
                  <input
                    ref={(el) => {
                      fileRefs.current[doc.id] = el;
                    }}
                    type="file"
                    accept={
                      doc.acceptedFormats
                        ? doc.acceptedFormats
                            .map((f) => `.${f.toLowerCase()}`)
                            .join(",")
                        : undefined
                    }
                    className="sr-only"
                    aria-label={`File input for ${doc.label}`}
                    id={`file-input-${doc.id}`}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground font-sans tabular-nums">
        {requiredDocs.filter((d) => confirmedIds.includes(d.id)).length} of{" "}
        {requiredDocs.length} required documents confirmed
      </p>

      {/* Primary Next / secondary Back in sticky bottom bar on phones */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:static bg-card/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-border/80 sm:border-0 p-4 sm:p-0 flex items-center justify-between gap-3 shadow-lg sm:shadow-none">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onBack}
            className="h-10 px-4 text-xs font-medium border-border/70 hover:bg-secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
            <span>Back</span>
          </Button>
        ) : (
          <span />
        )}

        <Button
          type="button"
          onClick={onNext}
          disabled={!allRequiredConfirmed}
          size="default"
          className="h-10 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>{isLast ? "Complete guide" : "Next step"}</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1.5 stroke-[1.5]" />
        </Button>
      </div>
    </div>
  );
}
