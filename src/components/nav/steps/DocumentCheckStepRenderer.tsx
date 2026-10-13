"use client";

import { useRef } from "react";
import type { DocumentCheckStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Paperclip } from "lucide-react";

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
    <div className="space-y-5">
      <p className="type-small text-muted-foreground">
        Mark each document as &ldquo;I have this&rdquo;. You can optionally attach a
        local file preview — files are never uploaded.
      </p>

      <ul className="space-y-2.5">
        {step.documents.map((doc) => {
          const confirmed = confirmedIds.includes(doc.id);
          return (
            <li key={doc.id}>
              <div
                className={cn(
                  "rounded-lg border-hairline p-3.5 space-y-2.5 transition-colors",
                  confirmed
                    ? "bg-accent/30 border-primary/30"
                    : "bg-card"
                )}
              >
                {/* Row: icon + label + required badge */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggle(doc.id)}
                    className="mt-0.5 shrink-0"
                    aria-label={
                      confirmed
                        ? `Unconfirm: ${doc.label}`
                        : `Confirm I have: ${doc.label}`
                    }
                  >
                    {confirmed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "type-small leading-snug",
                          confirmed
                            ? "text-foreground/70"
                            : "text-foreground"
                        )}
                      >
                        {doc.label}
                      </span>
                      {!doc.required && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-border text-muted-foreground px-1.5 py-0"
                        >
                          Optional
                        </Badge>
                      )}
                    </div>
                    {doc.acceptedFormats && doc.acceptedFormats.length > 0 && (
                      <p className="type-caption text-muted-foreground normal-case tracking-normal">
                        Accepted: {doc.acceptedFormats.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* File preview (local only, never uploaded) */}
                <div className="pl-8">
                  <button
                    onClick={() => fileRefs.current[doc.id]?.click()}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Attach local preview for ${doc.label}`}
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="type-caption normal-case tracking-normal text-xs">
                      Attach local preview (optional)
                    </span>
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

      <p className="type-caption text-muted-foreground normal-case tracking-normal">
        {requiredDocs.filter((d) => confirmedIds.includes(d.id)).length} of{" "}
        {requiredDocs.length} required documents confirmed
      </p>

      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onNext} disabled={!allRequiredConfirmed} size="sm">
          {isLast ? "Complete" : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
