"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  HelpCircle,
  Lock,
  Loader2,
  AlertCircle,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";
import {
  completeLessonAction,
  lessonHeartbeatAction,
  type SkillLessonItem,
  type SkillQuizSummary,
} from "@/lib/skill/actions";
import {
  formatCountdownMmSs,
  parseVideoEmbed,
} from "@/lib/skill/learner-helpers";
import { cn } from "@/lib/utils";

interface LessonPlayerClientProps {
  track: {
    id: string;
    slug: string;
    title: string;
  };
  lesson: SkillLessonItem;
  lessonIndex: number;
  totalLessons: number;
  isLocked: boolean;
  lessonQuiz: SkillQuizSummary | null;
  nextLessonId: string | null;
}

export function LessonPlayerClient({
  track,
  lesson,
  lessonIndex,
  totalLessons,
  isLocked,
  lessonQuiz,
  nextLessonId,
}: LessonPlayerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(lesson.completed);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    lesson.completed ? 0 : 0
  );
  const [timerInitialized, setTimerInitialized] = useState<boolean>(
    lesson.completed
  );
  const [inlineError, setInlineError] = useState<string | null>(null);

  const video = parseVideoEmbed(lesson.content_url);

  // Heartbeat loop: p_reset=true on mount and visibility regain; 30s interval when visible & focused
  useEffect(() => {
    if (isLocked || completed) {
      setTimerInitialized(true);
      setRemainingSeconds(0);
      return;
    }

    let cancelled = false;

    const sendHeartbeat = async (reset: boolean) => {
      const res = await lessonHeartbeatAction(lesson.id, reset);
      if (!cancelled && res.ok) {
        setRemainingSeconds(res.data.remaining_seconds);
        setTimerInitialized(true);
      } else if (!cancelled && !res.ok) {
        setTimerInitialized(true);
      }
    };

    void sendHeartbeat(true);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    const heartbeatInterval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        document.hasFocus()
      ) {
        void sendHeartbeat(false);
      }
    }, 30_000);

    const countdownInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(heartbeatInterval);
      window.clearInterval(countdownInterval);
    };
  }, [lesson.id, isLocked, completed]);

  const quizBlocked = Boolean(lessonQuiz && !lessonQuiz.passed);
  const timeBlocked = !completed && (!timerInitialized || remainingSeconds > 0);
  const canContinue = completed || (!timeBlocked && !quizBlocked);

  const navigateNext = () => {
    if (nextLessonId) {
      router.push(`/skill/${track.slug}/${nextLessonId}`);
    } else {
      router.push(`/skill/${track.slug}`);
    }
  };

  const handleContinue = () => {
    setInlineError(null);
    if (completed) {
      navigateNext();
      return;
    }

    startTransition(async () => {
      const res = await completeLessonAction(lesson.id, track.slug);
      if (!res.ok) {
        setInlineError(res.error);
        return;
      }

      setCompleted(true);
      if (res.already_completed) {
        toast.info("Lesson already completed");
      } else {
        toast.success(`+${res.points_awarded} skill points earned`);
      }

      navigateNext();
      router.refresh();
    });
  };

  if (isLocked) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl space-y-6">
        <Link
          href={`/skill/${track.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground motion-safe:transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>Back to {track.title}</span>
        </Link>

        <div className="rounded-lg border border-border/70 bg-card p-6 sm:p-8 text-center space-y-4">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-muted-foreground">
            <Lock className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">
              Lesson locked
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Complete the previous lesson in {track.title} before starting{" "}
              {lesson.title}.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-lg">
            <Link href={`/skill/${track.slug}`}>Return to course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl space-y-6 pb-16">
      {/* Back link */}
      <div>
        <Link
          href={`/skill/${track.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground motion-safe:transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>Back to {track.title}</span>
        </Link>
      </div>

      {/* Header */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            Lesson {lessonIndex + 1} of {totalLessons}
          </span>
          {completed && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
              <Check className="h-3 w-3 stroke-[2]" />
              <span>Completed</span>
            </span>
          )}
        </div>
        <h1 className="text-[24px] leading-[32px] sm:text-[28px] sm:leading-[36px] font-semibold text-foreground tracking-tight">
          {lesson.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lesson.summary}
        </p>
      </header>

      {/* Video Embed or External Video Link (no preload for data-saving) */}
      {(video.kind === "youtube" || video.kind === "vimeo") && (
        <div className="aspect-video w-full rounded-lg border border-border/70 bg-secondary/40 overflow-hidden">
          <iframe
            src={video.embedUrl}
            title={lesson.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}

      {video.kind === "link" && (
        <div className="rounded-lg border border-border/70 bg-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-foreground">
              <Video className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Lesson video</p>
              <p className="text-xs text-muted-foreground truncate">
                Opens in a new tab
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-lg gap-1.5 border-border/70 shrink-0"
          >
            <a href={video.href} target="_blank" rel="noopener noreferrer">
              <span>Open video</span>
              <ExternalLink className="h-3.5 w-3.5 stroke-[1.5]" />
            </a>
          </Button>
        </div>
      )}

      {/* Markdown Content */}
      <article className="rounded-lg border border-border/70 bg-card p-5 sm:p-6">
        <div className="max-w-[70ch]">
          <LessonMarkdown content={lesson.content_md} />
        </div>
      </article>

      {/* Lesson Quiz Callout (if lesson has a quiz) */}
      {lessonQuiz && (
        <section
          aria-label="Lesson quiz"
          className={cn(
            "rounded-lg border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            lessonQuiz.passed
              ? "border-[var(--data-verified-border)]"
              : "border-amber-500/30"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                lessonQuiz.passed
                  ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              )}
            >
              {lessonQuiz.passed ? (
                <Check className="h-4 w-4 stroke-[2]" />
              ) : (
                <HelpCircle className="h-4 w-4 stroke-[1.5]" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {lessonQuiz.title}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {lessonQuiz.passed
                  ? `Passed with ${lessonQuiz.best_score_pct ?? 0}% (pass mark ${lessonQuiz.pass_mark}%).`
                  : `Pass mark: ${lessonQuiz.pass_mark}% · ${lessonQuiz.attempts_left} attempts left.`}
              </p>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            variant={lessonQuiz.passed ? "outline" : "default"}
            className="h-9 px-4 text-xs rounded-lg gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Link href={`/skill/${track.slug}/quiz/${lessonQuiz.id}`}>
              <span>
                {lessonQuiz.passed ? "Review quiz" : "Take lesson quiz"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </Link>
          </Button>
        </section>
      )}

      {/* Inline Error from complete_lesson */}
      {inlineError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 stroke-[1.5]" />
          <span className="leading-relaxed">{inlineError}</span>
        </div>
      )}

      {/* Footer: Countdown & Continue */}
      <footer className="rounded-lg border border-border/70 bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          {!completed && timeBlocked ? (
            <>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 stroke-[1.5]" />
              <span>
                Continue unlocks in{" "}
                <strong className="font-semibold text-foreground">
                  {formatCountdownMmSs(remainingSeconds)}
                </strong>
              </span>
            </>
          ) : !completed && quizBlocked ? (
            <>
              <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 stroke-[1.5]" />
              <span>Pass the lesson quiz above to continue.</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-[var(--data-verified)] shrink-0 stroke-[2]" />
              <span>
                {completed
                  ? "Lesson completed"
                  : `Ready to continue (+${lesson.skill_points} pts)`}
              </span>
            </>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          disabled={!canContinue || isPending}
          onClick={handleContinue}
          className="h-10 px-5 rounded-lg text-xs font-medium gap-1.5 motion-safe:transition-colors duration-200"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              <span>Completing...</span>
            </>
          ) : (
            <>
              <span>
                {nextLessonId ? "Continue" : completed ? "Back to course" : "Finish course"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}
