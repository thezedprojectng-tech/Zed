import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSkillOverview } from "@/lib/skill/actions";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ArrowRight,
  Check,
  BookOpen,
  Info,
  Award,
} from "lucide-react";
import { pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Zed Skill — Practical Career Playbooks",
  description:
    "Data-light career and digital skills tracks for Nigerian youth. Complete lessons to earn skill points.",
};

export default async function SkillPage() {
  const data = await getSkillOverview();

  if (!data) {
    redirect("/login");
  }

  const { tracks, totalSkillPoints, progressSummary } = data;

  // Find active in-progress track for continue card
  const activeTrack = tracks.find(
    (t) => t.completedLessons > 0 && t.completedLessons < t.totalLessons
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <header className="space-y-1.5 pb-2">
        <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
          Practical skills
        </h1>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Fluff-free career playbooks covering workplace readiness, CV drafting, and essential digital tools.
        </p>
      </header>

      {/* ── 2. Points & Level Progression Header ──────────────────── */}
      <section
        aria-label="Skill points and level progression"
        className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start"
      >
        {/* Total Points Card */}
        <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-flows)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Earned skill points
              </span>
              <BookOpen className="h-4 w-4 stroke-[1.5] text-[var(--data-flows)]" />
            </div>

            <div>
              <p className="text-[32px] leading-[36px] font-semibold font-sans tabular-nums text-foreground tracking-tight">
                {totalSkillPoints.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Points accumulated across completed lessons
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <GraduationCap className="h-4 w-4 stroke-[1.5] text-[var(--data-flows)] shrink-0" />
            <span>
              Eligible level: <strong className="font-semibold text-foreground">Level {progressSummary.currentEligibleLevel}</strong> ({progressSummary.currentEligibleLevelName})
            </span>
          </div>
        </div>

        {/* Level Progression Card */}
        <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-signups)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Level progression
              </span>
              <span className="inline-flex items-center rounded-md border border-[var(--data-signups-border)] bg-[var(--data-signups-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-signups-ink)]">
                Level {progressSummary.currentEligibleLevel} Active
              </span>
            </div>

            <div>
              <p className="text-base font-semibold text-foreground">
                {progressSummary.nextLevel ? (
                  <>
                    <span className="font-sans tabular-nums font-semibold text-[var(--data-signups-ink)]">
                      {progressSummary.pointsNeeded}
                    </span>{" "}
                    points to Level {progressSummary.nextLevel} ({progressSummary.nextLevelName})
                  </>
                ) : (
                  "Top civic learning tier achieved"
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reach the points target to become eligible for civic promotion.
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-sans tabular-nums font-medium text-foreground">
                {progressSummary.progressPercent}%
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressSummary.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[var(--data-signups)] transition-all duration-300 rounded-full"
                style={{ width: `${progressSummary.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Continue Where You Left Off (if data exists) ───────── */}
      {activeTrack && (
        <section aria-label="Resume learning" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Continue learning
            </h2>
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-[var(--data-flows)]">
            <div className="space-y-2 flex-1 min-w-0 pl-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-[var(--data-flows-border)] bg-[var(--data-flows-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-flows-ink)]">
                  In progress
                </span>
                <span className="text-xs text-muted-foreground font-sans tabular-nums">
                  {activeTrack.completedLessons} of {activeTrack.totalLessons} {pluralize(activeTrack.totalLessons, "lesson", "lessons")} completed
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground truncate">
                {activeTrack.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {activeTrack.description}
              </p>
              <div className="h-1.5 w-full max-w-md bg-secondary/80 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[var(--data-flows)] rounded-full transition-all duration-300"
                  style={{ width: `${activeTrack.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="shrink-0 pt-2 md:pt-0">
              <Button asChild size="default" className="h-10 px-5 text-sm font-medium">
                <Link href={`/skill/${activeTrack.slug}`}>
                  <span>Resume track</span>
                  <ArrowRight className="h-4 w-4 ml-2 stroke-[1.5]" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Tracks List ────────────────────────────────────────── */}
      <section aria-label="Available skill tracks" className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Learning tracks
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete practical lessons at your own pace to earn skill credentials.
          </p>
        </div>

        {tracks.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card p-8 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">No tracks available yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Check back soon as new practical career modules are published by the editorial team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => {
              const isCompleted = track.completedLessons === track.totalLessons && track.totalLessons > 0;
              const isInProgress = track.completedLessons > 0 && !isCompleted;

              return (
                <div
                  key={track.id}
                  className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs hover:border-border transition-all flex flex-col justify-between gap-5 relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                          <Check className="h-3 w-3 stroke-[1.5]" />
                          Completed
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center rounded-md border border-[var(--data-flows-border)] bg-[var(--data-flows-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-flows-ink)]">
                          In progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Not started
                        </span>
                      )}

                      <span className="text-xs font-medium text-[var(--data-flows-ink)] font-sans tabular-nums">
                        +{track.totalPoints} pts
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-foreground">
                      {track.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {track.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/50">
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-sans tabular-nums">
                        <span>
                          {track.completedLessons} of {track.totalLessons} {pluralize(track.totalLessons, "lesson", "lessons")} completed
                        </span>
                        <span>{track.progressPercent}%</span>
                      </div>
                      <div
                        className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={track.progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? "bg-[var(--data-verified)]" : "bg-[var(--data-flows)]"
                          }`}
                          style={{ width: `${track.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground font-sans tabular-nums">
                        {track.earnedPoints} / {track.totalPoints} pts earned
                      </span>

                      <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs font-medium border-border/70 hover:bg-secondary">
                        <Link href={`/skill/${track.slug}`}>
                          <span>
                            {isCompleted ? "Review" : isInProgress ? "Continue" : "Start"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5 stroke-[1.5]" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
