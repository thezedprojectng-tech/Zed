"use client";

import { useState } from "react";
import type { LinkStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2 } from "lucide-react";

interface LinkStepRendererProps {
  step: LinkStep;
  onNext: () => void;
  onBack: (() => void) | null;
  isLast: boolean;
}

export function LinkStepRenderer({
  step,
  onNext,
  onBack,
  isLast,
}: LinkStepRendererProps) {
  const [opened, setOpened] = useState(false);

  function handleOpen() {
    setOpened(true);
    window.open(step.href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-5">
      <p className="type-body text-foreground/90 leading-relaxed whitespace-pre-line">
        {step.body}
      </p>

      {/* External link CTA */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between rounded-lg border-hairline bg-secondary/60 hover:bg-secondary px-4 py-3.5 transition-colors group"
        aria-label={`Open: ${step.linkLabel}`}
      >
        <span className="type-small text-foreground font-medium group-hover:text-primary transition-colors">
          {step.linkLabel}
        </span>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      {opened && (
        <div className="flex items-center gap-2 text-accent-foreground">
          <CheckCircle2 className="h-4 w-4" />
          <span className="type-small">
            Link opened. Tap &ldquo;Done&rdquo; when you have finished.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={onNext} size="sm" disabled={!opened}>
          {isLast ? "Complete" : "Done →"}
        </Button>
      </div>
    </div>
  );
}
