"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Pickaxe,
  EyeOff,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  Crown,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getLeaderboardAction,
  setLeaderboardHiddenAction,
} from "@/lib/leaderboard/actions";
import {
  formatLeaderboardLevel,
  formatLeaderboardValue,
  getAvatarInitials,
  getBoardValueLabel,
  getLeaderboardAvatarSrc,
  type LeaderboardBoard,
  type LeaderboardData,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "@/lib/leaderboard/format";
import { cn } from "@/lib/utils";

interface LeaderboardClientProps {
  initialData: LeaderboardData | null;
  initialError?: string | null;
}

type PodiumSlot = 1 | 2 | 3;

const PODIUM_STYLES: Record<
  PodiumSlot,
  {
    ringClass: string;
    blockClass: string;
    blockHeightClass: string;
    avatarSizeClass: string;
    delayStyle: string;
  }
> = {
  1: {
    ringClass:
      "ring-2 ring-[var(--data-flows)] ring-offset-2 ring-offset-background",
    blockClass:
      "border-[var(--data-flows-border)] bg-[var(--data-flows-subtle)] text-[var(--data-flows-ink)]",
    blockHeightClass: "h-24 sm:h-28",
    avatarSizeClass: "h-14 w-14 sm:h-20 sm:w-20",
    delayStyle: "0ms",
  },
  2: {
    ringClass:
      "ring-2 ring-[var(--data-users)] ring-offset-2 ring-offset-background",
    blockClass:
      "border-[var(--data-users-border)] bg-[var(--data-users-subtle)] text-[var(--data-users-ink)]",
    blockHeightClass: "h-16 sm:h-20",
    avatarSizeClass: "h-11 w-11 sm:h-16 sm:w-16",
    delayStyle: "70ms",
  },
  3: {
    ringClass:
      "ring-2 ring-[var(--data-signups)] ring-offset-2 ring-offset-background",
    blockClass:
      "border-[var(--data-signups-border)] bg-[var(--data-signups-subtle)] text-[var(--data-signups-ink)]",
    blockHeightClass: "h-12 sm:h-16",
    avatarSizeClass: "h-11 w-11 sm:h-16 sm:w-16",
    delayStyle: "140ms",
  },
};

function PodiumColumn({
  slot,
  entry,
  board,
}: {
  slot: PodiumSlot;
  entry: LeaderboardEntry | undefined;
  board: LeaderboardBoard;
}) {
  const styles = PODIUM_STYLES[slot];
  const valueLabel = getBoardValueLabel(board);

  if (!entry) {
    return (
      <div
        className="flex flex-col items-center justify-end gap-2 min-w-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-reduce:animate-none"
        style={{ animationDelay: styles.delayStyle, animationFillMode: "both" }}
      >
        {slot === 1 && (
          <Crown
            className="h-4 w-4 text-muted-foreground/40 shrink-0"
            aria-hidden="true"
          />
        )}
        <div
          className={cn(
            "rounded-full border border-dashed border-border/80 bg-muted/40 flex items-center justify-center text-xs text-muted-foreground shrink-0",
            styles.avatarSizeClass
          )}
          aria-hidden="true"
        >
          —
        </div>
        <div className="w-full text-center space-y-1 px-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Open spot
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Waiting for rank {slot}
          </p>
        </div>
        <div
          className={cn(
            "w-full rounded-t-lg border border-b-0 border-border/60 bg-muted/30 flex items-center justify-center text-lg sm:text-xl font-semibold text-muted-foreground/60 tabular-nums",
            styles.blockHeightClass
          )}
          aria-label={`Open rank ${slot} spot`}
        >
          {slot}
        </div>
      </div>
    );
  }

  const avatarSrc = getLeaderboardAvatarSrc(entry.avatar_path, entry.avatar_url);
  const initials = getAvatarInitials(entry.name);
  const levelInfo = formatLeaderboardLevel(entry.level);

  return (
    <div
      className="flex flex-col items-center justify-end gap-2 min-w-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-250 motion-reduce:animate-none"
      style={{ animationDelay: styles.delayStyle, animationFillMode: "both" }}
    >
      {slot === 1 && (
        <Crown
          className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--data-flows)] shrink-0"
          aria-label="First place"
        />
      )}

      <Avatar
        className={cn(
          "shrink-0 bg-card",
          styles.avatarSizeClass,
          styles.ringClass
        )}
      >
        {avatarSrc && <AvatarImage src={avatarSrc} alt={entry.name} />}
        <AvatarFallback className="text-xs sm:text-sm font-semibold bg-secondary text-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="w-full text-center space-y-1 px-1 min-w-0">
        <div className="flex items-center justify-center gap-1 min-w-0">
          <p
            className={cn(
              "text-xs sm:text-sm truncate",
              entry.is_me
                ? "font-semibold text-foreground"
                : "font-medium text-foreground"
            )}
            title={entry.name}
          >
            {entry.name}
          </p>
          {entry.is_me && (
            <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary shrink-0">
              You
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1">
          <span
            title={levelInfo.title}
            className="inline-flex items-center rounded-md border border-border/70 bg-secondary/60 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-muted-foreground"
          >
            {levelInfo.badge}
          </span>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">
          {formatLeaderboardValue(entry.value)}{" "}
          <span className="text-[11px] font-normal text-muted-foreground">
            {valueLabel}
          </span>
        </p>
      </div>

      <div
        className={cn(
          "w-full rounded-t-lg border border-b-0 flex items-center justify-center text-lg sm:text-2xl font-semibold tabular-nums",
          styles.blockClass,
          styles.blockHeightClass,
          entry.is_me && "ring-1 ring-inset ring-primary/40"
        )}
        aria-label={`Rank ${entry.rank}`}
      >
        {entry.rank}
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  board,
  topValue,
  index,
}: {
  entry: LeaderboardEntry;
  board: LeaderboardBoard;
  topValue: number;
  index: number;
}) {
  const avatarSrc = getLeaderboardAvatarSrc(entry.avatar_path, entry.avatar_url);
  const initials = getAvatarInitials(entry.name);
  const levelInfo = formatLeaderboardLevel(entry.level);
  const valueLabel = getBoardValueLabel(board);
  const pct =
    topValue > 0 ? Math.max(2, Math.min(100, Math.round((entry.value / topValue) * 100))) : 0;

  return (
    <li
      className={cn(
        "px-3 sm:px-4 py-3 transition-colors duration-150 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none motion-reduce:transition-none",
        entry.is_me
          ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/35"
          : "hover:bg-secondary/30"
      )}
      style={{ animationDelay: `${Math.min(index * 20, 200)}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <span
          className="inline-flex h-6 min-w-6 px-1 items-center justify-center rounded-md border border-border/60 bg-secondary/50 text-xs font-medium text-muted-foreground tabular-nums shrink-0"
          aria-label={`Rank ${entry.rank}`}
        >
          {entry.rank}
        </span>

        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0 border border-border/60">
          {avatarSrc && <AvatarImage src={avatarSrc} alt={entry.name} />}
          <AvatarFallback className="text-xs font-medium bg-secondary text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Name + Level + Progress bar */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "text-sm truncate",
                  entry.is_me
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground/90"
                )}
              >
                {entry.name}
              </span>
              {entry.is_me && (
                <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary shrink-0">
                  You
                </span>
              )}
              <span
                title={levelInfo.title}
                className="inline-flex items-center rounded-md border border-border/70 bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0"
              >
                {levelInfo.badge}
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {formatLeaderboardValue(entry.value)}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                {valueLabel}
              </span>
            </div>
          </div>

          {/* Thin progress bar relative to first place */}
          <div
            className="h-1 w-full rounded-full bg-secondary overflow-hidden"
            aria-hidden="true"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300 motion-reduce:transition-none",
                entry.is_me ? "bg-primary" : "bg-foreground/25"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

export function LeaderboardClient({
  initialData,
  initialError = null,
}: LeaderboardClientProps) {
  const [board, setBoard] = useState<LeaderboardBoard>(
    initialData?.board ?? "learners"
  );
  const [period, setPeriod] = useState<LeaderboardPeriod>(
    initialData?.period ?? "week"
  );
  const [data, setData] = useState<LeaderboardData | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState<boolean>(!initialData && !initialError);
  const [isUpdatingVisibility, startVisibilityTransition] = useTransition();

  const fetchBoard = useCallback(
    async (
      targetBoard: LeaderboardBoard,
      targetPeriod: LeaderboardPeriod,
      showSkeleton = true
    ) => {
      if (showSkeleton) {
        setLoading(true);
      }
      setError(null);
      const res = await getLeaderboardAction(targetBoard, targetPeriod, 20);
      if (res.ok) {
        setData(res.data);
      } else {
        setError(res.error);
      }
      setLoading(false);
    },
    []
  );

  const handleBoardChange = (nextBoard: string) => {
    if (nextBoard !== "learners" && nextBoard !== "consistency") return;
    setBoard(nextBoard);
    void fetchBoard(nextBoard, period, true);
  };

  const handlePeriodChange = (nextPeriod: LeaderboardPeriod) => {
    if (nextPeriod === period) return;
    setPeriod(nextPeriod);
    void fetchBoard(board, nextPeriod, true);
  };

  // Refetch on window focus
  useEffect(() => {
    const onFocus = () => {
      void fetchBoard(board, period, false);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [board, period, fetchBoard]);

  const handleShowMe = () => {
    startVisibilityTransition(async () => {
      const res = await setLeaderboardHiddenAction(false);
      if (res.ok) {
        toast.success("You are now visible on leaderboards");
        await fetchBoard(board, period, false);
      } else {
        toast.error(res.error || "Failed to update visibility");
      }
    });
  };

  const entries = data?.entries ?? [];
  const me = data?.me ?? null;
  const isMeInTop20 = entries.some((e) => e.is_me);
  const showPinnedMyRank = Boolean(
    me && !me.hidden && !isMeInTop20 && me.rank !== null && me.value > 0
  );
  const showNoActivityHint = Boolean(
    !loading &&
      !error &&
      data &&
      !me?.hidden &&
      !isMeInTop20 &&
      (!me || me.rank === null || me.value <= 0)
  );

  const topThree = entries.slice(0, 3);
  const restEntries = entries.slice(3);
  const topValue = topThree[0]?.value ?? 0;
  const valueLabel = getBoardValueLabel(board);

  // Compute distance to next rank if user is immediately after the visible list (e.g. rank 21 with 20 entries)
  const lastVisible = entries[entries.length - 1];
  const pointsToNextRank =
    showPinnedMyRank &&
    me &&
    me.rank !== null &&
    lastVisible &&
    me.rank === entries.length + 1 &&
    lastVisible.value >= me.value
      ? Math.max(1, lastVisible.value - me.value)
      : null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3
              className="h-5 w-5 text-primary shrink-0 stroke-[1.75]"
              aria-hidden="true"
            />
            <h1 className="text-2xl sm:text-[28px] sm:leading-[36px] font-semibold text-foreground tracking-tight">
              Leaderboard
            </h1>
          </div>

          {period === "week" && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Resets Monday 00:00 (Lagos)</span>
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground">
          Top 20 community members by skill points earned and daily mining consistency.
        </p>

        {/* Quiet notice under header when user has no activity */}
        {showNoActivityHint && (
          <p className="text-xs text-muted-foreground pt-0.5">
            {board === "learners" ? (
              <>
                No points recorded yet.{" "}
                <Link
                  href="/skill"
                  className="text-primary font-medium hover:underline"
                >
                  Finish a lesson in Zed Skill
                </Link>{" "}
                to get on the board.
              </>
            ) : (
              <>
                No mining days recorded yet.{" "}
                <Link
                  href="/mining"
                  className="text-primary font-medium hover:underline"
                >
                  Claim daily mining
                </Link>{" "}
                to get on the board.
              </>
            )}
          </p>
        )}
      </header>

      {/* Controls: Board tabs + Period switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs
          value={board}
          onValueChange={handleBoardChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
            <TabsTrigger value="learners" className="gap-1.5 cursor-pointer">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Learners</span>
            </TabsTrigger>
            <TabsTrigger value="consistency" className="gap-1.5 cursor-pointer">
              <Pickaxe className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Consistency</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          role="group"
          aria-label="Time period"
          className="inline-flex w-full sm:w-auto items-center rounded-lg border border-border/70 bg-muted p-1 gap-1"
        >
          <button
            type="button"
            onClick={() => handlePeriodChange("week")}
            aria-pressed={period === "week"}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 motion-reduce:transition-none cursor-pointer",
              period === "week"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange("all")}
            aria-pressed={period === "all"}
            className={cn(
              "flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 motion-reduce:transition-none cursor-pointer",
              period === "all"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All time
          </button>
        </div>
      </div>

      {/* Hidden notice */}
      {!loading && !error && me?.hidden && (
        <section
          aria-label="Leaderboard visibility notice"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-4 py-3"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground">
            <EyeOff
              className="h-4 w-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
            <span>You are hidden from the leaderboard.</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleShowMe}
            disabled={isUpdatingVisibility}
            className="h-8 px-3 text-xs font-medium gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            {isUpdatingVisibility ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>Show me</span>
          </Button>
        </section>
      )}

      {/* Main Content */}
      {loading ? (
        <div aria-busy="true" aria-label="Loading leaderboard" className="space-y-6">
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 pt-4">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-11 w-11 sm:h-16 sm:w-16 rounded-full" />
              <Skeleton className="h-3.5 w-16 sm:w-24 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-16 sm:h-20 w-full rounded-t-lg rounded-b-none" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-full" />
              <Skeleton className="h-4 w-20 sm:w-28 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-24 sm:h-28 w-full rounded-t-lg rounded-b-none" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-11 w-11 sm:h-16 sm:w-16 rounded-full" />
              <Skeleton className="h-3.5 w-16 sm:w-24 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-12 sm:h-16 w-full rounded-t-lg rounded-b-none" />
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-1.5 w-full max-w-xs rounded-full" />
                </div>
                <Skeleton className="h-4 w-16 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <section
          aria-label="Leaderboard error"
          className="rounded-lg border border-border/70 bg-card p-8 text-center space-y-3"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Could not load leaderboard
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {error}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchBoard(board, period, true)}
            className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        </section>
      ) : entries.length === 0 ? (
        <section
          aria-label="Empty leaderboard"
          className="rounded-lg border border-border/70 bg-card p-8 text-center space-y-2"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            No rankings yet
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {board === "learners"
              ? "Complete a lesson in Zed Skill to earn points and appear on this board."
              : "Claim your daily mining reward to start a streak and appear on this board."}
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium: 2nd (left), 1st (center, tallest), 3rd (right) */}
          <section
            aria-label="Top 3 podium"
            className="rounded-lg border border-border/70 bg-card px-3 sm:px-6 pt-6 pb-0 overflow-hidden"
          >
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 max-w-3xl mx-auto">
              <PodiumColumn slot={2} entry={topThree[1]} board={board} />
              <PodiumColumn slot={1} entry={topThree[0]} board={board} />
              <PodiumColumn slot={3} entry={topThree[2]} board={board} />
            </div>
          </section>

          {/* Ranks 4 to 20 */}
          {restEntries.length > 0 && (
            <section
              aria-label={
                board === "learners"
                  ? "Learners rankings 4 to 20"
                  : "Consistency rankings 4 to 20"
              }
              className="rounded-lg border border-border/70 bg-card overflow-hidden"
            >
              <ol className="divide-y divide-border/60">
                {restEntries.map((entry, idx) => (
                  <LeaderboardRow
                    key={`${entry.rank}-${entry.name}-${entry.is_me ? "me" : idx}`}
                    entry={entry}
                    board={board}
                    topValue={topValue}
                    index={idx}
                  />
                ))}
              </ol>
            </section>
          )}

          {/* Pinned Your rank row when outside top 20 */}
          {showPinnedMyRank && me && me.rank !== null && (
            <section
              aria-label="Your rank"
              className="rounded-lg border border-primary/35 bg-primary/[0.05] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-7 min-w-7 px-1.5 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-xs font-semibold text-primary tabular-nums shrink-0">
                  {me.rank}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    Your rank
                  </p>
                  {pointsToNextRank !== null && (
                    <p className="text-xs text-muted-foreground">
                      {formatLeaderboardValue(pointsToNextRank)} {valueLabel} to reach the next rank
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatLeaderboardValue(me.value)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {valueLabel}
                </span>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
