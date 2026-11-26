"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, pluralize } from "@/lib/utils";
import type { TrackDetailData, SkillQuizSummary } from "@/lib/skill/actions";
import { CourseCertificateCard } from "@/components/skill/CourseCertificateCard";

export function TrackDetailClient({ data }: { data: TrackDetailData }) {
  const { track, lessons, quizzes, courseStatus, publicSettings, holderName } = data;

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const earnedPoints = lessons
    .filter((l) => l.completed)
    .reduce((sum, l) => sum + l.skill_points, 0);
  const totalPoints = lessons.reduce((sum, l) => sum + l.skill_points, 0);
  const isTrackCompleted = completedCount === totalCount && totalCount > 0;

  const quizByLessonId = new Map<string, SkillQuizSummary>();
  let finalExam: SkillQuizSummary | null = null;
  for (const q of quizzes) {
    if (q.lesson_id) {
      quizByLessonId.set(q.lesson_id, q);
    } else {
      finalExam = q;
    }
  }

  const firstIncompleteIndex = lessons.findIndex((l) => !l.completed);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-16">
      {/* ── 1. Back Navigation ─────────────────────────────────────── */}
      <div>
        <Link
          href="/skill"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground motion-safe:transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>All skill tracks</span>
        </Link>
      </div>

      {/* ── 2. Course Header & Progress ────────────────────────────── */}
      <section
        aria-label="Course overview"
        className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-flows)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isTrackCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                <Check className="h-3 w-3 stroke-[1.75]" />
                <span>Completed</span>
              </span>
            ) : completedCount > 0 ? (
              <span className="inline-flex items-center rounded-md border border-[var(--data-flows-border)] bg-[var(--data-flows-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-flows-ink)]">
                In progress
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Not started
              </span>
            )}
            <span className="text-xs text-muted-foreground font-sans tabular-nums">
              {totalCount} {pluralize(totalCount, "lesson", "lessons")}
            </span>
          </div>

          <span className="text-xs font-medium text-[var(--data-flows-ink)] font-sans tabular-nums">
            {earnedPoints} / {totalPoints} pts earned
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-[26px] leading-[34px] sm:text-[28px] sm:leading-[36px] font-semibold text-foreground tracking-tight">
            {track.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {track.description}
          </p>
        </div>

        <div className="space-y-1.5 pt-1 max-w-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-sans tabular-nums">
            <span>
              {completedCount} of {totalCount} completed
            </span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <div
            className="h-1.5 w-full rounded-lg bg-secondary/80 overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-lg motion-safe:transition-all duration-300",
                isTrackCompleted
                  ? "bg-[var(--data-verified)]"
                  : "bg-[var(--data-flows)]"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── 3. Lessons & Final Exam + Certificate Status Grid ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Lesson List & Final Exam */}
        <section
          aria-label="Lessons in course"
          className="lg:col-span-8 space-y-4"
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Course lessons
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete each lesson in order to unlock the next.
            </p>
          </div>

          {lessons.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-card p-8 text-center space-y-2">
              <BookOpen className="h-7 w-7 text-muted-foreground mx-auto stroke-[1.5]" />
              <p className="text-sm font-medium text-foreground">
                No lessons published yet
              </p>
              <p className="text-xs text-muted-foreground">
                Check back soon for new lessons in this course.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
              {lessons.map((lesson, idx) => {
                const isLocked =
                  idx > 0 && !lessons[idx - 1].completed && !lesson.completed;
                const isCurrent =
                  !isLocked &&
                  !lesson.completed &&
                  idx === firstIncompleteIndex;
                const lessonQuiz = quizByLessonId.get(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      "p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 motion-safe:transition-colors duration-150",
                      isLocked
                        ? "bg-secondary/20 opacity-75"
                        : "hover:bg-secondary/20"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold mt-0.5 font-sans tabular-nums border",
                          lesson.completed
                            ? "bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)] border-[var(--data-verified-border)]"
                            : isLocked
                            ? "bg-secondary/60 text-muted-foreground border-border/70"
                            : isCurrent
                            ? "bg-[var(--data-flows-subtle)] text-[var(--data-flows-ink)] border-[var(--data-flows-border)]"
                            : "bg-secondary text-muted-foreground border-border/70"
                        )}
                        aria-hidden="true"
                      >
                        {lesson.completed ? (
                          <Check className="h-4 w-4 stroke-[2]" />
                        ) : isLocked ? (
                          <Lock className="h-3.5 w-3.5 stroke-[1.5]" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isLocked ? (
                            <span className="text-sm font-semibold text-muted-foreground">
                              {lesson.title}
                            </span>
                          ) : (
                            <Link
                              href={`/skill/${track.slug}/${lesson.id}`}
                              className="text-sm font-semibold text-foreground hover:text-primary motion-safe:transition-colors duration-150"
                            >
                              {lesson.title}
                            </Link>
                          )}

                          {lesson.completed && (
                            <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--data-verified-ink)]">
                              Done
                            </span>
                          )}

                          {isLocked && (
                            <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              Locked
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {lesson.summary}
                        </p>

                        {lessonQuiz && (
                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <HelpCircle className="h-3 w-3 stroke-[1.5]" />
                                <span>Quiz</span>
                              </span>
                            ) : (
                              <Link
                                href={`/skill/${track.slug}/quiz/${lessonQuiz.id}`}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums motion-safe:transition-colors duration-150",
                                  lessonQuiz.passed
                                    ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:opacity-90"
                                )}
                              >
                                <HelpCircle className="h-3 w-3 stroke-[1.5]" />
                                <span>
                                  {lessonQuiz.passed
                                    ? `Quiz passed · ${lessonQuiz.best_score_pct ?? 0}%`
                                    : lessonQuiz.best_score_pct !== null
                                    ? `Quiz: ${lessonQuiz.best_score_pct}% · ${lessonQuiz.attempts_left} left`
                                    : `Quiz · ${lessonQuiz.attempts_left} ${pluralize(
                                        lessonQuiz.attempts_left,
                                        "attempt",
                                        "attempts"
                                      )} left`}
                                </span>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                      <span className="text-xs font-medium text-[var(--data-flows-ink)] font-sans tabular-nums">
                        +{lesson.skill_points} pts
                      </span>
                      {!isLocked && (
                        <Button
                          asChild
                          size="sm"
                          variant={lesson.completed ? "outline" : "default"}
                          className="h-8 px-3 text-xs rounded-lg gap-1.5"
                        >
                          <Link href={`/skill/${track.slug}/${lesson.id}`}>
                            <span>{lesson.completed ? "Review" : "Open"}</span>
                            <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Final exam row */}
              {finalExam && (
                <div
                  className={cn(
                    "p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/20",
                    !isTrackCompleted && "opacity-75"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border mt-0.5",
                        finalExam.passed
                          ? "bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)] border-[var(--data-verified-border)]"
                          : isTrackCompleted
                          ? "bg-primary/10 text-primary border-primary/25"
                          : "bg-secondary/60 text-muted-foreground border-border/70"
                      )}
                    >
                      {finalExam.passed ? (
                        <Check className="h-4 w-4 stroke-[2]" />
                      ) : !isTrackCompleted ? (
                        <Lock className="h-3.5 w-3.5 stroke-[1.5]" />
                      ) : (
                        <HelpCircle className="h-4 w-4 stroke-[1.5]" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {finalExam.title || "Final exam"}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums",
                            finalExam.passed
                              ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                              : !isTrackCompleted
                              ? "border-border/70 bg-secondary/50 text-muted-foreground"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {finalExam.passed
                            ? `Passed · ${finalExam.best_score_pct ?? 0}%`
                            : !isTrackCompleted
                            ? "Locked"
                            : finalExam.best_score_pct !== null
                            ? `Best: ${finalExam.best_score_pct}% · ${finalExam.attempts_left} left`
                            : `${finalExam.attempts_left} ${pluralize(
                                finalExam.attempts_left,
                                "attempt",
                                "attempts"
                              )} left`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isTrackCompleted
                          ? `Pass mark: ${finalExam.pass_mark}%`
                          : "Complete all lessons to unlock the final exam."}
                      </p>
                    </div>
                  </div>

                  {isTrackCompleted && (
                    <div className="pl-11 sm:pl-0 shrink-0">
                      <Button
                        asChild
                        size="sm"
                        variant={finalExam.passed ? "outline" : "default"}
                        className="h-8 px-3 text-xs rounded-lg gap-1.5"
                      >
                        <Link href={`/skill/${track.slug}/quiz/${finalExam.id}`}>
                          <span>
                            {finalExam.passed ? "Review exam" : "Take final exam"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: Certificate Status Card */}
        <CourseCertificateCard
          track={track}
          courseStatus={courseStatus}
          publicSettings={publicSettings}
          holderName={holderName}
          completedCount={completedCount}
          totalCount={totalCount}
          earnedPoints={earnedPoints}
          quizzes={quizzes}
        />
      </div>
    </div>
  );
}
