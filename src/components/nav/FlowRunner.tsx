"use client";

import { useEffect, useMemo } from "react";
import type { NavFlow, DecisionStep } from "@/types/nav";
import { useNavProgressStore } from "@/store/useNavProgressStore";
import {
  initProgress,
  getCurrentStep,
  advance,
  goBack,
  getProgress,
  resolveBranch,
  toggleChecklistItem,
  isChecklistComplete,
  toggleDocumentItem,
  isDocumentCheckComplete,
  isFlowComplete,
} from "@/lib/nav/engine";

import { InfoStepRenderer } from "./steps/InfoStepRenderer";
import { ChecklistStepRenderer } from "./steps/ChecklistStepRenderer";
import { LinkStepRenderer } from "./steps/LinkStepRenderer";
import { DecisionStepRenderer } from "./steps/DecisionStepRenderer";
import { DocumentCheckStepRenderer } from "./steps/DocumentCheckStepRenderer";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMounted } from "@/lib/hooks";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface FlowRunnerProps {
  flow: NavFlow;
}

export function FlowRunner({ flow }: FlowRunnerProps) {
  const isMounted = useIsMounted();
  const { setProgress, getProgress: storeGet, clearProgress } = useNavProgressStore();

  // Initialise or rehydrate progress from store
  const rawProgress = storeGet(flow.id);
  const isStale =
    rawProgress != null &&
    !flow.steps.some((s) => s.id === rawProgress.current_step);
  const progress = rawProgress && !isStale ? rawProgress : initProgress(flow);

  // Persist initial state on first mount or reset if stale
  useEffect(() => {
    if (isMounted && (!rawProgress || isStale)) {
      setProgress(flow.id, initProgress(flow));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.id, isStale, isMounted]);

  const currentStep = getCurrentStep(flow, progress);
  const percent = getProgress(flow, progress);
  const completed = isFlowComplete(flow, progress);

  // Determine if the current step is the last in the array
  const isLast = useMemo(() => {
    const idx = flow.steps.findIndex((s) => s.id === currentStep.id);
    return idx === flow.steps.length - 1;
  }, [flow.steps, currentStep.id]);

  // Determine if back is possible
  const canGoBack = useMemo(() => {
    const idx = flow.steps.findIndex((s) => s.id === currentStep.id);
    return idx > 0;
  }, [flow.steps, currentStep.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleAdvance() {
    const next = advance(flow, progress);
    if (next) {
      // If we are now on the last step after advancing, mark it complete too
      const advancedToLastStep =
        flow.steps.findIndex((s) => s.id === next.current_step) ===
        flow.steps.length - 1;
      if (advancedToLastStep) {
        const finalCompleted = Array.from(
          new Set([...next.completed_steps, next.current_step])
        );
        setProgress(flow.id, { ...next, completed_steps: finalCompleted });
      } else {
        setProgress(flow.id, next);
      }
    } else {
      // Terminal step: mark current as complete
      const finalCompleted = Array.from(
        new Set([...progress.completed_steps, currentStep.id])
      );
      setProgress(flow.id, {
        ...progress,
        completed_steps: finalCompleted,
        updated_at: new Date().toISOString(),
      });
    }
  }

  function handleBack() {
    const prev = goBack(flow, progress);
    if (prev) setProgress(flow.id, prev);
  }

  function handleDecision(label: string) {
    if (currentStep.type !== "decision") return;
    const next = resolveBranch(flow, progress, currentStep as DecisionStep, label);
    setProgress(flow.id, next);
  }

  function handleChecklistToggle(itemId: string) {
    const next = toggleChecklistItem(progress, currentStep.id, itemId);
    setProgress(flow.id, next);
  }

  function handleDocumentToggle(docId: string) {
    const next = toggleDocumentItem(progress, currentStep.id, docId);
    setProgress(flow.id, next);
  }

  function handleReset() {
    clearProgress(flow.id);
    setProgress(flow.id, initProgress(flow));
  }

  // ── Loading skeleton during SSR/hydration to prevent localStorage mismatch ──
  if (!isMounted) {
    return (
      <div className="space-y-5 animate-pulse" aria-busy="true">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // ── Completion Screen ──────────────────────────────────────────────────────

  if (completed) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50 border-hairline border-primary/30">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="type-h2 text-foreground">Guide Complete</h3>
          <p className="type-body text-muted-foreground max-w-sm mx-auto">
            You have completed all steps for <strong>{flow.title}</strong>.
            Keep your documents and reference numbers safe.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Start Over
        </Button>
      </div>
    );
  }

  // ── Progress Bar ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-wide border-border text-muted-foreground"
            >
              {currentStep.type}
            </Badge>
            <span
              className="font-mono text-[11px] text-muted-foreground"
              suppressHydrationWarning
            >
              {progress.completed_steps.length}/{flow.steps.length} done
            </span>
          </div>
          <button
            onClick={handleReset}
            className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Reset flow progress"
          >
            Reset
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="h-1 w-full rounded-full bg-secondary overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percent}% complete`}
        >
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Step title */}
      <h2 className="type-h2 text-foreground">{currentStep.title}</h2>

      {/* Step renderer */}
      {currentStep.type === "info" && (
        <InfoStepRenderer
          step={currentStep}
          onNext={handleAdvance}
          onBack={canGoBack ? handleBack : null}
          isLast={isLast}
        />
      )}

      {currentStep.type === "checklist" && (
        <ChecklistStepRenderer
          step={currentStep}
          checkedIds={progress.checklist_state[currentStep.id] ?? []}
          onToggle={handleChecklistToggle}
          onNext={handleAdvance}
          onBack={canGoBack ? handleBack : null}
          isLast={isLast}
        />
      )}

      {currentStep.type === "link" && (
        <LinkStepRenderer
          step={currentStep}
          onNext={handleAdvance}
          onBack={canGoBack ? handleBack : null}
          isLast={isLast}
        />
      )}

      {currentStep.type === "decision" && (
        <DecisionStepRenderer
          step={currentStep}
          onChoose={handleDecision}
          onBack={canGoBack ? handleBack : null}
        />
      )}

      {currentStep.type === "document-check" && (
        <DocumentCheckStepRenderer
          step={currentStep}
          confirmedIds={progress.document_state[currentStep.id] ?? []}
          onToggle={handleDocumentToggle}
          onNext={handleAdvance}
          onBack={canGoBack ? handleBack : null}
          isLast={isLast}
        />
      )}
    </div>
  );
}
