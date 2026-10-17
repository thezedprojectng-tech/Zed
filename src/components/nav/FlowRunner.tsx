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
  getCompletedStepsCount,
  resolveBranch,
  toggleChecklistItem,
  toggleDocumentItem,
  isFlowComplete,
  reconcileProgress,
  completeFlow,
  getIncompleteEarlierSteps,
  getFlowVersion,
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
import { CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

interface FlowRunnerProps {
  flow: NavFlow;
}

export function FlowRunner({ flow }: FlowRunnerProps) {
  const isMounted = useIsMounted();
  const { setProgress, getProgress: storeGet, clearProgress } = useNavProgressStore();

  // Reconcile persisted progress against the current flow definition
  const rawProgress = storeGet(flow.id);
  const progress = useMemo(() => {
    return reconcileProgress(flow, rawProgress);
  }, [flow, rawProgress]);

  // Persist reconciled progress if state was missing or migrated
  useEffect(() => {
    if (!isMounted) return;
    const currentVersion = getFlowVersion(flow);
    const needsMigration =
      !rawProgress ||
      rawProgress.flow_version !== currentVersion ||
      progress.completed_steps.length !== (rawProgress.completed_steps ?? []).length ||
      progress.current_step !== rawProgress.current_step ||
      Boolean(progress.completed) !== Boolean(rawProgress.completed);

    if (needsMigration) {
      setProgress(flow.id, progress);
    }
  }, [flow, rawProgress, progress, isMounted, setProgress]);

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

  // Incomplete earlier steps along the path before the current step
  const incompleteEarlierSteps = useMemo(() => {
    return isLast ? getIncompleteEarlierSteps(flow, progress, currentStep.id) : [];
  }, [flow, progress, currentStep.id, isLast]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleAdvance() {
    const next = advance(flow, progress);
    if (next) {
      // If we are now on the last step after advancing, check if terminal
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
      // Terminal step: always finish the flow cleanly
      const nextProgress = completeFlow(flow, progress);
      setProgress(flow.id, nextProgress);
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

  function handleJumpToStep(stepId: string) {
    setProgress(flow.id, {
      ...progress,
      current_step: stepId,
      completed: false,
      updated_at: new Date().toISOString(),
    });
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
    const incompleteEarlier = getIncompleteEarlierSteps(flow, progress);
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

        {incompleteEarlier.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 max-w-md mx-auto text-left space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Note: Finished with {incompleteEarlier.length} uncompleted earlier step{incompleteEarlier.length > 1 ? "s" : ""}:
            </p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
              {incompleteEarlier.map((s) => (
                <li key={s.id}>{s.title}</li>
              ))}
            </ul>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleJumpToStep(incompleteEarlier[0].id)}
              >
                Review {incompleteEarlier[0].title}
              </Button>
            </div>
          </div>
        )}

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
              {getCompletedStepsCount(flow, progress)}/{flow.steps.length} done
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

      {/* Earlier incomplete steps banner on the final step */}
      {isLast && incompleteEarlierSteps.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-left">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="type-body font-semibold text-foreground text-xs">
                Earlier required steps were not completed
              </p>
              <p className="type-small text-muted-foreground text-xs leading-relaxed">
                You reached the final step, but some earlier steps in this guide were skipped or added recently:
              </p>
              <ul className="list-disc list-inside type-small text-muted-foreground space-y-0.5 pt-1">
                {incompleteEarlierSteps.map((s) => (
                  <li key={s.id} className="text-xs">
                    <span className="text-foreground font-medium">{s.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 border-amber-500/30 hover:bg-amber-500/20 text-foreground"
              onClick={() => handleJumpToStep(incompleteEarlierSteps[0].id)}
            >
              Jump to {incompleteEarlierSteps[0].title}
            </Button>
          </div>
        </div>
      )}

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
