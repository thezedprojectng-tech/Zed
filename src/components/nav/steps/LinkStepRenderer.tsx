"use client";

import { useState } from "react";
import type { LinkStep } from "@/types/nav";
import { Button } from "@/components/ui/button";
import { ExternalLink, Check, ArrowRight, ArrowLeft } from "lucide-react";

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
    <div className="space-y-6">
      <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line max-w-[70ch]">
        {step.body}
      </p>

      {/* External link CTA */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between rounded-lg border border-border/70 bg-card hover:bg-secondary/40 px-4 py-3.5 min-h-[44px] transition-colors group text-left"
        aria-label={`Open external link: ${step.linkLabel}`}
      >
        <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">
          {step.linkLabel}
        </span>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 stroke-[1.5]" />
      </button>

      {opened && (
        <aside
          aria-label="Link opened status"
          className="rounded-r-lg border-l-4 border-l-[var(--data-verified)] bg-[var(--data-verified-subtle)] p-3.5 flex items-center gap-2.5 text-xs text-[var(--data-verified-ink)]"
        >
          <Check className="h-4 w-4 shrink-0 stroke-[2]" />
          <span>
            Link opened in a new tab. Tap &ldquo;Next step&rdquo; when you have finished.
          </span>
        </aside>
      )}

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
          size="default"
          disabled={!opened}
          className="h-10 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>{isLast ? "Complete guide" : "Next step"}</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1.5 stroke-[1.5]" />
        </Button>
      </div>
    </div>
  );
}
