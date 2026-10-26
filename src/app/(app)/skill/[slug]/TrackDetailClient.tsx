"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { completeLessonAction, TrackDetailData } from "@/lib/skill/actions";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";

export function TrackDetailClient({ data }: { data: TrackDetailData }) {
  const router = useRouter();
  const { track, lessons: initialLessons, isVerified } = data;
  const [lessons, setLessons] = useState(initialLessons);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(
    initialLessons[0]?.id ?? null
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

  function toggleExpand(id: string) {
    setExpandedLessonId((current) => (current === id ? null : id));
  }

  function handleComplete(lessonId: string) {
    setCompletingId(lessonId);
    startTransition(async () => {
      try {
        const res = await completeLessonAction(lessonId, track.slug);

        if (res.ok) {
          // Immediately update local state optimistically: mark lesson completed,
          // update the track progress bar, and earned points.
          setLessons((prev) =>
            prev.map((l) =>
              l.id === lessonId
                ? { ...l, completed: true, completed_at: l.completed_at ?? new Date().toISOString() }
                : l
            )
          );

          if (res.already_completed) {
            toast.info("Already completed");
          } else {
            toast.success(`+${res.points_awarded} Skill Points earned!`, {
              description: `Total: ${res.total_skill_points} points`,
            });
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
    <div className="px-4 md:px-8 py-8 md:py-10 space-y-8">
      {/* ── Back Navigation ──────────────────────────────────────────── */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 gap-1.5 text-muted-foreground">
          <Link href="/skill">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to All Tracks</span>
          </Link>
        </Button>
      </div>

      {/* ── Track Header ─────────────────────────────────────────────── */}
      <section className="space-y-3 border-hairline-b pb-6">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] uppercase border-border text-muted-foreground"
          >
            Track Overview
          </Badge>
          <span className="font-mono text-xs text-primary font-semibold">
            {earnedPoints} / {totalPoints} pts earned
          </span>
        </div>

        <h1 className="type-display text-foreground">{track.title}</h1>
        <p className="type-body text-muted-foreground max-w-2xl leading-relaxed">
          {track.description}
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 max-w-md">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>
              {completedCount} of {totalCount} lessons completed
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-secondary overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Lessons List ─────────────────────────────────────────────── */}
      <section aria-label="Lessons" className="space-y-4">
        <h2 className="type-h3 text-foreground font-semibold">
          Lessons in this Track
        </h2>

        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const isExpanded = expandedLessonId === lesson.id;
            const isCurrentPending = isPending && completingId === lesson.id;

            return (
              <Card
                key={lesson.id}
                className={cn(
                  "border transition-colors overflow-hidden",
                  lesson.completed
                    ? "border-primary/20 bg-card"
                    : "border-border bg-card",
                  isExpanded && "ring-1 ring-primary/20"
                )}
              >
                {/* Header row */}
                <div
                  className="p-4 md:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-secondary/20 transition-colors select-none"
                  onClick={() => toggleExpand(lesson.id)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold mt-0.5",
                        lesson.completed
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground border border-border"
                      )}
                      aria-hidden="true"
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="type-h4 text-foreground font-semibold">
                          {lesson.title}
                        </h3>
                        {lesson.completed && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono border-primary/20 bg-primary/10 text-primary px-1.5 py-0"
                          >
                            Completed ✓
                          </Badge>
                        )}
                      </div>
                      <p className="type-small text-muted-foreground line-clamp-2">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-primary font-semibold">
                      +{lesson.skill_points} pts
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      aria-label={isExpanded ? "Collapse lesson" : "Expand lesson"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded lesson reader */}
                {isExpanded && (
                  <div className="px-4 pb-5 md:px-5 md:pb-6 pt-3 border-hairline-t space-y-6">
                    <LessonMarkdown content={lesson.content_md} />

                    {/* Completion Action */}
                    <div className="flex items-center justify-between pt-4 border-hairline-t flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <span>Award: {lesson.skill_points} skill points</span>
                      </div>

                      {lesson.completed ? (
                        <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Lesson Complete
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(lesson.id);
                          }}
                          disabled={isPending}
                          className="font-semibold gap-1.5"
                        >
                          {isCurrentPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <BookOpen className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>
                            {isCurrentPending ? "Marking complete…" : "Mark complete"}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
