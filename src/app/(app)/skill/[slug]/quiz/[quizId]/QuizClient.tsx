"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  submitQuizAction,
  type LearnerQuizData,
  type QuizSubmitResult,
} from "@/lib/skill/actions";
import {
  areAllQuestionsAnswered,
  buildQuizAnswersPayload,
} from "@/lib/skill/learner-helpers";
import { cn, pluralize } from "@/lib/utils";

interface QuizClientProps {
  track: {
    id: string;
    slug: string;
    title: string;
  };
  quiz: LearnerQuizData;
}

export function QuizClient({ track, quiz }: QuizClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Record<string, number | undefined>>(
    {}
  );
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(quiz.attempts_left);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backHref = quiz.lesson_id
    ? `/skill/${track.slug}/${quiz.lesson_id}`
    : `/skill/${track.slug}`;
  const backLabel = quiz.lesson_id
    ? "Back to lesson"
    : `Back to ${track.title}`;

  const allAnswered = areAllQuestionsAnswered(quiz.questions, selected);
  const resultMap = new Map(
    (result?.results ?? []).map((r) => [r.question_id, r.correct])
  );

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result || attemptsLeft <= 0 || isPending) return;
    setSelected((prev) => ({ ...prev, [questionId]: optionIndex }));
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!allAnswered) {
      setErrorMessage("Please answer every question before submitting.");
      return;
    }

    const payload = buildQuizAnswersPayload(quiz.questions, selected);

    startTransition(async () => {
      const res = await submitQuizAction(quiz.id, payload, track.slug);
      if (!res.ok) {
        setErrorMessage(res.error);
        toast.error(res.error);
        return;
      }

      setResult(res.data);
      setAttemptsLeft(res.data.attempts_left);
      if (res.data.passed) {
        toast.success(`Quiz passed with ${res.data.score_pct}%`);
      } else {
        toast.error(`Scored ${res.data.score_pct}% (pass mark ${res.data.pass_mark}%)`);
      }
      router.refresh();
    });
  };

  const handleRetry = () => {
    setResult(null);
    setSelected({});
    setErrorMessage(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl space-y-6 pb-16">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground motion-safe:transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Quiz Header */}
      <header className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            {quiz.title}
          </h1>
          {quiz.passed && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
              <Check className="h-3 w-3 stroke-[2]" />
              <span>Passed</span>
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          Pass mark: {quiz.pass_mark}% · {attemptsLeft}{" "}
          {pluralize(attemptsLeft, "attempt", "attempts")} remaining
          {quiz.best_score_pct !== null
            ? ` · Best score: ${quiz.best_score_pct}%`
            : ""}
        </p>
      </header>

      {/* Submission Result Summary */}
      {result && (
        <section
          aria-label="Quiz result"
          className={cn(
            "rounded-lg border bg-card p-5 space-y-3",
            result.passed
              ? "border-[var(--data-verified-border)]"
              : "border-rose-500/30"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground tabular-nums">
                  Your score: {result.score_pct}%
                </h2>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                    result.passed
                      ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  )}
                >
                  {result.passed ? "Passed" : "Not passed"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                Pass mark is {result.pass_mark}%.{" "}
                {result.attempts_left > 0
                  ? `${result.attempts_left} ${pluralize(
                      result.attempts_left,
                      "attempt",
                      "attempts"
                    )} left.`
                  : "No attempts remaining."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!result.passed && result.attempts_left > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRetry}
                  className="h-9 px-4 text-xs rounded-lg gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Try again</span>
                </Button>
              )}
              <Button
                asChild
                variant={result.passed ? "default" : "outline"}
                size="sm"
                className="h-9 px-4 text-xs rounded-lg border-border/70"
              >
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* No attempts left (before submitting) */}
      {!result && attemptsLeft <= 0 && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
          <span>
            You have no attempts remaining for this quiz.
          </span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {quiz.questions.map((q, idx) => {
          const isCorrect = result ? resultMap.get(q.id) : undefined;
          const chosen = selected[q.id];

          return (
            <fieldset
              key={q.id}
              className={cn(
                "rounded-lg border bg-card p-5 space-y-3",
                isCorrect === true
                  ? "border-[var(--data-verified-border)]"
                  : isCorrect === false
                  ? "border-rose-500/30"
                  : "border-border/70"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <legend className="text-sm font-medium text-foreground leading-relaxed">
                  <span className="text-muted-foreground tabular-nums mr-1.5">
                    {idx + 1}.
                  </span>
                  {q.prompt}
                </legend>
                {isCorrect !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium shrink-0",
                      isCorrect
                        ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    )}
                  >
                    {isCorrect ? (
                      <>
                        <Check className="h-3 w-3 stroke-[2]" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 stroke-[2]" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = chosen === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={Boolean(result) || attemptsLeft <= 0 || isPending}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      aria-pressed={isSelected}
                      className={cn(
                        "w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-lg border text-sm flex items-center gap-3 motion-safe:transition-colors duration-150",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-medium"
                          : "border-border/70 bg-background text-foreground hover:bg-secondary/40",
                        (Boolean(result) || attemptsLeft <= 0) &&
                          "cursor-default opacity-80 hover:bg-background"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40"
                        )}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        {!result && attemptsLeft > 0 && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={!allAnswered || isPending}
              className="h-10 px-6 rounded-lg text-sm font-medium gap-2 motion-safe:transition-colors duration-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit answers</span>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
