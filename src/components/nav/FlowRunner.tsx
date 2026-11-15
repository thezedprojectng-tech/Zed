"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
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

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMounted } from "@/lib/hooks";
import { Check, RotateCcw, AlertTriangle, ArrowRight } from "lucide-react";

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

  const currentStepIndex = useMemo(() => {
    const idx = flow.steps.findIndex((s) => s.id === currentStep.id);
    return idx >= 0 ? idx : 0;
  }, [flow.steps, currentStep.id]);

  // Determine if the current step is the last in the array
  const isLast = useMemo(() => {
    return currentStepIndex === flow.steps.length - 1;
  }, [flow.steps, currentStepIndex]);

  // Determine if back is possible
  const canGoBack = useMemo(() => {
    return currentStepIndex > 0;
  }, [currentStepIndex]);

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
      <div className="space-y-5 animate-pulse max-w-3xl" aria-busy="true">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  // ── Completion Screen ──────────────────────────────────────────────────────

  if (completed) {
    const incompleteEarlier = getIncompleteEarlierSteps(flow, progress);
    return (
      <div className="rounded-lg border border-border/70 bg-card p-6 sm:p-10 text-center max-w-2xl mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--data-verified-subtle)] border border-[var(--data-verified-border)] text-[var(--data-verified-ink)]">
            <Check className="h-7 w-7 stroke-[2]" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Guide complete
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            You have completed all steps for <strong className="text-foreground">{flow.title}</strong>. Keep your documents and statutory reference numbers safe.
          </p>
        </div>

        {incompleteEarlier.length > 0 && (
          <div className="rounded-r-lg border-l-4 border-l-amber-500 bg-amber-500/10 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Note: Completed with {incompleteEarlier.length} uncompleted earlier step{incompleteEarlier.length > 1 ? "s" : ""}:
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
                className="text-xs h-8 border-border/70"
                onClick={() => handleJumpToStep(incompleteEarlier[0].id)}
              >
                Review {incompleteEarlier[0].title}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild size="default" className="w-full sm:w-auto h-10 px-5 text-xs font-medium">
            <Link href="/nav">
              <span>All civic guides</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5 stroke-[1.5]" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={handleReset}
            className="w-full sm:w-auto h-10 px-4 text-xs font-medium border-border/70"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
            <span>Start over</span>
          </Button>
        </div>
      </div>
    );
  }

  // ── Active Step Screen ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Clear Step Header with "Step X of Y" and Progress Bar ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground font-sans tabular-nums">
              Step {currentStepIndex + 1} of {flow.steps.length}
            </span>
            <span>·</span>
            <span className="capitalize">{currentStep.type.replace(/-/g, " ")}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Subtle saved feedback */}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <Check className="h-3 w-3 text-[var(--data-verified)] stroke-[2]" />
              <span>Saved</span>
            </span>

            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Reset guide progress"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div
          className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percent}% complete`}
        >
          <div
            className="h-full bg-[var(--data-verified)] rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Earlier incomplete steps banner on the final step */}
      {isLast && incompleteEarlierSteps.length > 0 && (
        <aside
          aria-label="Incomplete earlier steps notice"
          className="rounded-r-lg border-l-4 border-l-amber-500 bg-amber-500/10 p-4 space-y-2 text-left"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Earlier required steps were not completed
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You reached the final step, but some earlier steps in this guide were skipped:
              </p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pt-1">
                {incompleteEarlierSteps.map((s) => (
                  <li key={s.id}>
                    <span className="text-foreground font-medium">{s.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-amber-500/30 hover:bg-amber-500/20 text-foreground"
              onClick={() => handleJumpToStep(incompleteEarlierSteps[0].id)}
            >
              Jump to {incompleteEarlierSteps[0].title}
            </Button>
          </div>
        </aside>
      )}

      {/* Step Title in readable column */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
          {currentStep.title}
        </h2>
      </div>

      {/* Step Renderers in readable column */}
      <div className="space-y-5">
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
    </div>
  );
}
