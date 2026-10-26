import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSkillOverview } from "@/lib/skill/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Info,
} from "lucide-react";

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

  const { tracks, totalSkillPoints, progressSummary, user } = data;

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <section className="space-y-1 border-hairline-b pb-6">
        <p className="type-caption text-muted-foreground font-mono uppercase tracking-wider">
          ZED SKILL · CAREER PLAYBOOKS
        </p>
        <h1 className="type-display text-foreground">Practical Skills</h1>
        <p className="type-body text-muted-foreground max-w-xl">
          Structured, fluff-free playbooks covering modern workplace readiness,
          CV drafting, and essential digital tools.
        </p>
        <p className="type-small text-muted-foreground/70 mt-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Skill points track your verified learning progress.
        </p>
      </section>


      {/* ── Points & Level Progression Header ─────────────────────────── */}
      <section
        aria-label="Skill points and level progression"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Total Points Card */}
        <Card className="p-5 border-border bg-card shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <p className="type-caption text-muted-foreground font-mono uppercase tracking-wider">
              Earned Skill Points
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-foreground">
              {totalSkillPoints.toLocaleString()}
            </p>
            <p className="type-small text-muted-foreground mt-0.5">
              points accumulated across completed lessons
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1 border-hairline-t text-muted-foreground font-mono text-xs">
            <GraduationCap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>
              Eligible Level: {progressSummary.currentEligibleLevel} (
              {progressSummary.currentEligibleLevelName})
            </span>
          </div>
        </Card>

        {/* Level Progression Card */}
        <Card className="p-5 border-border bg-card shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="type-caption text-muted-foreground font-mono uppercase tracking-wider">
                Level Progression
              </p>
              <p className="text-lg font-bold text-foreground mt-1">
                {progressSummary.nextLevel ? (
                  <>
                    <span className="font-mono text-primary font-bold">
                      {progressSummary.pointsNeeded}
                    </span>{" "}
                    points to Level {progressSummary.nextLevel} (
                    {progressSummary.nextLevelName})
                  </>
                ) : (
                  "You reached the top level"
                )}
              </p>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-primary/20 bg-primary/10 text-primary px-1.5 py-0"
            >
              Level {progressSummary.currentEligibleLevel} Active
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Progress</span>
              <span>{progressSummary.progressPercent}%</span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-secondary overflow-hidden"
              role="progressbar"
              aria-valuenow={progressSummary.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressSummary.progressPercent}% to next level`}
            >
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressSummary.progressPercent}%` }}
              />
            </div>
          </div>

          <p className="type-caption text-muted-foreground">
            Reach the points target to become eligible. Level promotion is not live yet.
          </p>
        </Card>
      </section>

      {/* ── Tracks List ──────────────────────────────────────────────── */}
      <section aria-label="Available skill tracks" className="space-y-4">
        <div>
          <h2 className="type-h3 text-foreground font-semibold">
            Learning Tracks
          </h2>
          <p className="type-small text-muted-foreground">
            Complete practical lessons at your own pace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((track) => (
            <Card
              key={track.id}
              className="p-5 border-border bg-card shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] border-border text-muted-foreground uppercase"
                  >
                    {track.totalLessons} Lessons
                  </Badge>
                  <span className="font-mono text-xs font-semibold text-primary">
                    +{track.totalPoints} pts
                  </span>
                </div>

                <h3 className="type-h3 text-foreground font-semibold">
                  {track.title}
                </h3>
                <p className="type-small text-muted-foreground leading-relaxed line-clamp-3">
                  {track.description}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-hairline-t">
                {/* Progress bar for this track */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>
                      {track.completedLessons} of {track.totalLessons} completed
                    </span>
                    <span>{track.progressPercent}%</span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"
                    role="progressbar"
                    aria-valuenow={track.progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${track.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {track.completedLessons === track.totalLessons && track.totalLessons > 0 ? (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">
                      {track.earnedPoints} / {track.totalPoints} pts earned
                    </span>
                  )}

                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href={`/skill/${track.slug}`}>
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {track.completedLessons === track.totalLessons && track.totalLessons > 0
                          ? "Review"
                          : track.completedLessons > 0
                          ? "Continue"
                          : "Start"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
