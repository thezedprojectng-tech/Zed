"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Loader2,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, pluralize } from "@/lib/utils";
import { completeLessonAction, TrackDetailData } from "@/lib/skill/actions";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";

export function TrackDetailClient({ data }: { data: TrackDetailData }) {
  const router = useRouter();
  const { track, lessons: initialLessons } = data;
  const [lessons, setLessons] = useState(initialLessons);

  // Initialize expanded lesson with first incomplete lesson, or first lesson
  const firstIncompleteLesson = initialLessons.find((l) => !l.completed);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(
    firstIncompleteLesson?.id ?? initialLessons[0]?.id ?? null
  );

  const [isPending, startTransition] = useTransition();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const [prevDataLessons, setPrevDataLessons] = useState(initialLessons);
  if (data.lessons !== prevDataLessons) {
    setPrevDataLessons(data.lessons);
    setLessons(data.lessons);
  }

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const earnedPoints = lessons
    .filter((l) => l.completed)
    .reduce((sum, l) => sum + l.skill_points, 0);
  const totalPoints = lessons.reduce((sum, l) => sum + l.skill_points, 0);
  const isTrackCompleted = completedCount === totalCount && totalCount > 0;

  // Active lesson object
  const activeLesson = useMemo(() => {
    return lessons.find((l) => l.id === expandedLessonId) ?? null;
  }, [lessons, expandedLessonId]);

  const activeLessonIndex = useMemo(() => {
    return lessons.findIndex((l) => l.id === expandedLessonId);
  }, [lessons, expandedLessonId]);

  function toggleExpand(id: string) {
    setExpandedLessonId((current) => (current === id ? null : id));
  }

  function handleComplete(lessonId: string) {
    setCompletingId(lessonId);
    startTransition(async () => {
      try {
        const res = await completeLessonAction(lessonId, track.slug);

        if (res.ok) {
          setLessons((prev) =>
            prev.map((l) =>
              l.id === lessonId
                ? { ...l, completed: true, completed_at: l.completed_at ?? new Date().toISOString() }
                : l
            )
          );

          if (res.already_completed) {
            toast.info("Lesson already completed");
          } else {
            toast.success(`+${res.points_awarded} Skill points earned!`, {
              description: `Total: ${res.total_skill_points} points accumulated.`,
            });
          }

          // Automatically expand next lesson if available
          const currentIndex = lessons.findIndex((l) => l.id === lessonId);
          if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
            setExpandedLessonId(lessons[currentIndex + 1].id);
          }

          router.refresh();
        } else {
          toast.error(res.error);
        }
      } catch (err) {
        console.error("[TrackDetailClient handleComplete error]:", err);
        toast.error("Could not complete the lesson. Please try again.");
      } finally {
        setCompletingId(null);
      }
    });
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-24 sm:pb-8">
      {/* ── 1. Back Navigation ─────────────────────────────────────── */}
      <div>
        <Link
          href="/skill"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>All skill tracks</span>
        </Link>
      </div>

      {/* ── 2. Track Header ────────────────────────────────────────── */}
      <section
        aria-label="Track overview"
        className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-flows)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isTrackCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                <Check className="h-3 w-3 stroke-[1.5]" />
                Completed
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
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            {track.description}
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="space-y-1.5 pt-2 max-w-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-sans tabular-nums">
            <span>
              {completedCount} of {totalCount} completed
            </span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <div
            className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isTrackCompleted ? "bg-[var(--data-verified)]" : "bg-[var(--data-flows)]"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── 3. Lessons List ────────────────────────────────────────── */}
      <section aria-label="Lessons in track" className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Lessons in this track
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Read and review each lesson. Tap to expand and complete.
          </p>
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const isExpanded = expandedLessonId === lesson.id;
            const isCurrentPending = isPending && completingId === lesson.id;
            const isCurrentIncomplete = !lesson.completed && firstIncompleteLesson?.id === lesson.id;

            return (
              <div
                key={lesson.id}
                className={cn(
                  "rounded-lg border bg-card transition-all overflow-hidden",
                  lesson.completed
                    ? "border-border/70"
                    : isCurrentIncomplete
                    ? "border-[var(--data-flows-border)] shadow-xs"
                    : "border-border/60",
                  isExpanded && "border-border"
                )}
              >
                {/* Header row */}
                <div
                  className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-secondary/20 transition-colors select-none"
                  onClick={() => toggleExpand(lesson.id)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold mt-0.5 font-sans tabular-nums",
                        lesson.completed
                          ? "bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)] border border-[var(--data-verified-border)]"
                          : isCurrentIncomplete
                          ? "bg-[var(--data-flows-subtle)] text-[var(--data-flows-ink)] border border-[var(--data-flows-border)]"
                          : "bg-secondary text-muted-foreground border border-border/70"
                      )}
                      aria-hidden="true"
                    >
                      {lesson.completed ? (
                        <Check className="h-4 w-4 stroke-[2]" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">
                          {lesson.title}
                        </h3>
                        {lesson.completed && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-1.5 py-0.2 text-[11px] font-medium text-[var(--data-verified-ink)]">
                            <Check className="h-2.5 w-2.5 stroke-[2]" />
                            Completed
                          </span>
                        )}
                        {isCurrentIncomplete && (
                          <span className="inline-flex items-center rounded-md border border-[var(--data-flows-border)] bg-[var(--data-flows-subtle)] px-1.5 py-0.2 text-[11px] font-medium text-[var(--data-flows-ink)]">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium text-[var(--data-flows-ink)] font-sans tabular-nums">
                      +{lesson.skill_points} pts
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground p-1"
                      aria-label={isExpanded ? "Collapse lesson" : "Expand lesson"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 stroke-[1.5]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 stroke-[1.5]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded lesson reader */}
                {isExpanded && (
                  <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-border/50 space-y-6">
                    {/* Readable column (max ~70ch) */}
                    <div className="max-w-[70ch] space-y-4">
                      <LessonMarkdown content={lesson.content_md} />
                    </div>

                    {/* Lesson footer actions & navigation */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-border/50 gap-4">
                      {/* Previous / Next buttons */}
                      <div className="flex items-center gap-2">
                        {idx > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLessonId(lessons[idx - 1].id);
                            }}
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1 stroke-[1.5]" />
                            <span>Previous lesson</span>
                          </Button>
                        )}
                        {idx < lessons.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLessonId(lessons[idx + 1].id);
                            }}
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <span>Next lesson</span>
                            <ChevronRightIcon className="h-3.5 w-3.5 ml-1 stroke-[1.5]" />
                          </Button>
                        )}
                      </div>

                      {/* Complete status / action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-xs text-muted-foreground font-sans tabular-nums">
                          Award: +{lesson.skill_points} pts
                        </span>

                        {lesson.completed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--data-verified-ink)]">
                            <Check className="h-3.5 w-3.5 stroke-[2]" />
                            Lesson complete
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(lesson.id);
                            }}
                            disabled={isPending}
                            className="h-9 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {isCurrentPending ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                <span>Marking complete…</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
                                <span>Mark complete</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Mobile Sticky Bottom Action Bar ──────────────────────── */}
      <aside
        aria-label="Mobile lesson navigation"
        className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-card/95 backdrop-blur-md border-t border-border/80 px-4 py-3 shadow-lg"
      >
        {activeLesson ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground font-sans tabular-nums">
                Lesson {activeLessonIndex + 1} of {totalCount}
              </p>
              <p className="text-xs font-semibold text-foreground truncate">
                {activeLesson.title}
              </p>
            </div>

            <div className="shrink-0">
              {activeLesson.completed ? (
                activeLessonIndex < totalCount - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setExpandedLessonId(lessons[activeLessonIndex + 1].id)}
                    className="h-9 px-3 text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 border border-border/70"
                  >
                    <span>Next lesson</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1 stroke-[1.5]" />
                  </Button>
                ) : (
                  <span className="text-xs font-medium text-[var(--data-verified-ink)] flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 stroke-[2]" /> Done
                  </span>
                )
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleComplete(activeLesson.id)}
                  className="h-9 px-3 text-xs font-medium bg-primary text-primary-foreground"
                >
                  {isPending && completingId === activeLesson.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1 stroke-[2]" />
                  )}
                  <span>Mark complete</span>
                </Button>
              )}
            </div>
          </div>
        ) : firstIncompleteLesson ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {firstIncompleteLesson.title}
              </p>
              <p className="text-[11px] text-muted-foreground">Ready to start</p>
            </div>
            <Button
              size="sm"
              onClick={() => setExpandedLessonId(firstIncompleteLesson.id)}
              className="h-9 px-4 text-xs font-medium bg-primary text-primary-foreground"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1 stroke-[1.5]" />
            </Button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function ChevronRightIcon(props: React.ComponentProps<typeof ArrowRight>) {
  return <ArrowRight {...props} />;
}
