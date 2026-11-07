import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense, cache } from "react";
import {
  ArrowRight,
  ShieldAlert,
  Pickaxe,
  Users,
  GraduationCap,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/data/modules";
import { MINING_LEVEL_MAP } from "@/data/levels";
import { getLevelName } from "@/types";
import { isVerifiedBadgeEnabled } from "@/lib/verification/flags";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Home – Zed",
  description:
    "Your Zed dashboard. Track your ZED balance, mining streak, referrals, skill progress and active civic guides.",
};

const REQUIREMENT_UNITS: Record<string, { label: string; unit: string }> = {
  total_mined: { label: "Total mined", unit: "ZED" },
  mining_days: { label: "Mining days", unit: "days" },
  verified_referrals: { label: "Verified referrals", unit: "friends" },
  completed_courses: { label: "Skill courses", unit: "courses" },
};

interface LevelProgressRequirement {
  type: string;
  threshold: number;
  current: number;
  met: boolean;
}

interface LevelProgressData {
  current_level: number;
  next_level: number | null;
  next_open: boolean;
  requirements: LevelProgressRequirement[];
}

function getTimeGreeting(): string {
  const hour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  ).getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date());
}

// ── Per-request cached profile fetch ─────────────────────────────────────────
// React.cache() deduplicates calls with the same userId within one render tree.
// Both HomePage (for the greeting/badges) and OverviewCards (for level/verified)
// call this; Supabase is only hit once per request.
const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("full_name, level_id, is_verified")
    .eq("id", userId)
    .single();
  return data;
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      aria-hidden="true"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border-hairline bg-card/60 p-5 h-32 animate-pulse"
        />
      ))}
    </div>
  );
}

// ── Overview cards ────────────────────────────────────────────────────────────
// Runs inside <Suspense>. Shares the users row with HomePage via getProfile().
async function OverviewCards({ userId }: { userId: string }) {
  const supabase = await createClient();

  // All five independent data fetches run in one Promise.all.
  // getProfile() is deduped by React.cache() — no second DB hit.
  const [
    profile,
    walletRes,
    miningCountRes,
    referralCountRes,
    totalLessonsRes,
    completedLessonsRes,
    levelProgressRes,
  ] = await Promise.all([
    // 1. users — served from React.cache(); no extra DB round-trip
    getProfile(userId),
    // 2. token_wallets: balance, streak, last mined
    supabase
      .from("token_wallets")
      .select("balance_zed, streak_days, last_mined_at")
      .eq("user_id", userId)
      .maybeSingle(),
    // 3. mining_logs: total days claimed (head-only count)
    supabase
      .from("mining_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    // 4. referrals: count where I am the referrer (head-only count)
    supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId),
    // 5. skill_lessons: total lessons in published tracks (head-only count).
    //    RLS policy "skill_lessons: authenticated select published" already
    //    restricts rows to lessons whose track has is_published = true,
    //    so no extra filter is needed here.
    supabase
      .from("skill_lessons")
      .select("id", { count: "exact", head: true }),
    // 6. skill_progress: completed lessons in published tracks (head-only count).
    //    Inner-join to skill_lessons ensures only lessons in published tracks
    //    are counted (RLS on skill_lessons filters out unpublished tracks).
    //    RLS on skill_progress restricts to auth.uid() so no .eq() needed,
    //    but we add it explicitly for clarity and defence in depth.
    supabase
      .from("skill_progress")
      .select("lesson_id, skill_lessons!inner(id)", { count: "exact", head: true })
      .eq("user_id", userId),
    // 7. level progress: computed via get_my_level_progress RPC (safe fallback if error)
    supabase.rpc("get_my_level_progress"),
  ]);

  const wallet = walletRes.data;
  const miningDays = miningCountRes.count ?? 0;
  const referralCount = referralCountRes.count ?? 0;
  const totalLessons = totalLessonsRes.count ?? 0;
  const completedLessons = completedLessonsRes.count ?? 0;

  let levelProgress: LevelProgressData | null = null;
  if (levelProgressRes && !levelProgressRes.error && levelProgressRes.data) {
    levelProgress = levelProgressRes.data as unknown as LevelProgressData;
  }

  const levelId = (profile?.level_id ?? 1) as 1 | 2 | 3 | 4 | 5;
  const levelData = MINING_LEVEL_MAP[levelId] ?? MINING_LEVEL_MAP[1];
  const balanceZed = wallet?.balance_zed ?? 0;
  const streakDays = wallet?.streak_days ?? 0;
  const lastMinedAt = wallet?.last_mined_at;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* ZED Balance */}
      <Card className="p-5 border-hairline bg-card flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              ZED Balance
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-primary/10 text-primary border-primary/20">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-3xl font-bold font-mono text-foreground leading-none">
            {balanceZed.toLocaleString()}
          </p>
          <p className="type-small text-muted-foreground mt-1">$ZED</p>
        </div>
        <Button
          asChild
          size="sm"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs"
        >
          <Link href="/mining">
            <Pickaxe className="h-3.5 w-3.5 mr-1.5" />
            Mine today
          </Link>
        </Button>
      </Card>

      {/* Level */}
      <Card className="p-5 border-hairline bg-card flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Level
            </span>
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-primary/30 bg-primary/5 text-primary px-1.5 py-0"
            >
              Level {levelId} · {levelData.name}
            </Badge>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground leading-none">
            ×{levelData.multiplier}
          </p>
          <p className="type-small text-muted-foreground mt-1">
            {levelData.dailyCap.toLocaleString()} ZED / day
          </p>
        </div>
        {/* Level progress footer */}
        {levelId >= 5 ? (
          <p className="type-small text-muted-foreground/70 font-mono">Top level</p>
        ) : levelProgress?.next_open && levelProgress.requirements.length > 0 ? (
          <div className="space-y-2 pt-1">
            <p className="font-mono text-[10px] text-muted-foreground">
              Next: Level {levelProgress.next_level} ·{" "}
              {MINING_LEVEL_MAP[levelProgress.next_level as 1 | 2 | 3 | 4 | 5]?.name}
            </p>
            <div className="space-y-1.5">
              {levelProgress.requirements.map((req) => {
                const meta = REQUIREMENT_UNITS[req.type];
                const pct =
                  req.threshold > 0
                    ? Math.min(Math.round((req.current / req.threshold) * 100), 100)
                    : 0;
                const unitLabel = meta?.unit ? ` ${meta.unit}` : "";
                return (
                  <div key={req.type} className="space-y-0.5">
                    <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span className="truncate">{meta?.label ?? req.type}</span>
                      <span className="shrink-0 ml-2">
                        {req.current} / {req.threshold}
                        {unitLabel}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-1 bg-secondary"
                      aria-label={`${meta?.label ?? req.type} progress: ${req.current} of ${req.threshold}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="type-small text-muted-foreground/70 font-mono">
            Next level opens soon
          </p>
        )}
      </Card>

      {/* Mining */}
      <Card className="p-5 border-hairline bg-card flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Mining
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary text-muted-foreground">
              <Pickaxe className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground leading-none">
            {streakDays}
          </p>
          <p className="type-small text-muted-foreground mt-1">
            day streak · {miningDays} total claims
          </p>
        </div>
        {lastMinedAt && (
          <p className="font-mono text-[11px] text-muted-foreground/70">
            Last:{" "}
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              timeZone: "Africa/Lagos",
            }).format(new Date(lastMinedAt))}
          </p>
        )}
      </Card>

      {/* Referrals */}
      <Card className="p-5 border-hairline bg-card flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Referrals
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground leading-none">
            {referralCount}
          </p>
          <p className="type-small text-muted-foreground mt-1">
            friend{referralCount !== 1 ? "s" : ""} invited
          </p>
        </div>
        <Link
          href="/referrals"
          className="type-small text-primary hover:underline inline-flex items-center gap-1 font-mono"
        >
          View referrals <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>

      {/* Skill */}
      <Card className="p-5 border-hairline bg-card flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Skill
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground leading-none">
            {completedLessons}
            <span className="text-sm font-normal text-muted-foreground">
              /{totalLessons}
            </span>
          </p>
          <p className="type-small text-muted-foreground mt-1">lessons complete</p>
        </div>
        <Link
          href="/skill"
          className="type-small text-primary hover:underline inline-flex items-center gap-1 font-mono"
        >
          View tracks <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>
    </div>
  );
}

// ── Active guide card ─────────────────────────────────────────────────────────
async function ActiveGuideCard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: progressRows } = await supabase
    .from("nav_progress")
    .select("flow_id, state, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const active = (progressRows ?? []).find((row) => !row.state?.completed);

  if (!active) return null;

  const flowId = active.flow_id as string;
  const state = active.state as {
    current_step?: string;
    completed_steps?: string[];
    completed?: boolean;
  } | null;

  const completedSteps: string[] = state?.completed_steps ?? [];

  const FLOW_META: Record<string, { href: string; label: string; ref: string }> = {
    passport: { href: "/nav/passport", label: "Nigerian Passport", ref: "NIS-01" },
    nysc: { href: "/nav/nysc", label: "NYSC Mobilisation", ref: "NYSC-02" },
    "nin-bvn": { href: "/nav/nin-bvn", label: "NIN & BVN Harmonisation", ref: "NIMC-03" },
    cac: { href: "/nav/cac", label: "CAC Business Registration", ref: "CAC-04" },
  };

  const meta = FLOW_META[flowId];
  if (!meta) return null;

  return (
    <section aria-label="In-progress civil flow">
      <div className="flex items-center justify-between mb-3">
        <h2 className="type-caption text-muted-foreground font-semibold">
          ACTIVE ZED NAV GUIDE
        </h2>
        <span className="type-caption text-primary">IN PROGRESS</span>
      </div>

      <Card className="p-0 border-hairline bg-card hover:border-border transition-colors">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="type-caption text-muted-foreground">
                {meta.ref}
              </span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-primary/30 bg-primary/10 text-primary px-1.5 py-0"
              >
                IN PROGRESS
              </Badge>
            </div>

            <h3 className="type-h2 text-foreground">{meta.label}</h3>

            {completedSteps.length > 0 && (
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 max-w-xs">
                  <Progress
                    value={Math.min(completedSteps.length * 10, 100)}
                    className="h-1.5 bg-secondary"
                  />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {completedSteps.length} step{completedSteps.length !== 1 ? "s" : ""} completed
                </span>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <Button
              asChild
              variant="outline"
              className="border-hairline hover:bg-secondary hover:text-foreground text-foreground px-5 font-medium"
            >
              <Link href={meta.href}>
                Resume Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile once. getProfile() is wrapped in React.cache(),
  // so the identical call inside OverviewCards is served from the same
  // per-request cache with no second database round-trip.
  const profile = await getProfile(user.id);

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    "";
  const firstName = fullName.trim().split(" ")[0] || "there";
  const isVerified = Boolean(profile?.is_verified);
  const civicLevel = profile?.level_id ?? 1;
  const greeting = getTimeGreeting();
  const dateString = getFormattedDate();
  const showGetVerified = isVerifiedBadgeEnabled() && !isVerified;

  return (
    <div className="mx-auto max-w-8xl px-4 md:px-8 py-8 md:py-10 space-y-10">

      {/* ── 1. Greeting row ──────────────────────────────────────────────── */}
      <section className="space-y-2 border-hairline-b pb-8">
        <p className="type-caption text-muted-foreground">{dateString}</p>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h1 className="type-display text-foreground">
            {greeting}, {firstName}.
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-border text-muted-foreground px-2 py-0.5"
            >
              {getLevelName(civicLevel).toUpperCase()}
            </Badge>
            {isVerifiedBadgeEnabled() && (
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px] px-2 py-0.5",
                  isVerified
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {isVerified ? "VERIFIED" : "UNVERIFIED"}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Get verified prompt (flag-gated) ──────────────────────────── */}
      {showGetVerified && (
        <section aria-label="Get verified">
          <Card className="p-0 border-hairline bg-card relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-primary rounded-t-xl" />
            <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <span className="type-caption text-primary">IDENTITY VERIFICATION</span>
                </div>
                <h2 className="type-h2 text-foreground">Verify your account</h2>
                <p className="type-small text-muted-foreground">
                  Submit your bank account for a manual review by the Zed team.
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-5"
                >
                  <Link href="/verify">
                    Verify account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ── 3. Overview cards ─────────────────────────────────────────────── */}
      <section aria-label="Account overview">
        <div className="flex items-center justify-between mb-4">
          <h2 className="type-caption text-muted-foreground font-semibold">OVERVIEW</h2>
        </div>
        {/* OverviewCards and ActiveGuideCard are both wrapped in Suspense so
            they stream in independently. Their internal queries run in parallel
            with each other (React starts both Suspense boundaries together). */}
        <Suspense fallback={<OverviewSkeleton />}>
          <OverviewCards userId={user.id} />
        </Suspense>
      </section>

      {/* ── 4. Active guide (only if user has one in progress) ───────────── */}
      <Suspense fallback={null}>
        <ActiveGuideCard userId={user.id} />
      </Suspense>

      {/* ── 5. Platform Modules ───────────────────────────────────────────── */}
      <section aria-label="Platform modules" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-foreground">Zed Modules</h2>
            <p className="type-small text-muted-foreground mt-0.5">
              The full Zed platform. One module is live today; more are in development.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isLive = mod.status === "live";
            const href = isLive ? (mod.href ?? "/nav") : `/modules/${mod.slug}`;

            return (
              <Link
                key={mod.slug}
                href={href}
                className={cn(
                  "group rounded-xl border-hairline bg-card p-4 flex flex-col gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isLive
                    ? "hover:border-border hover:bg-card/90"
                    : "opacity-60 hover:opacity-80 cursor-default"
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border-hairline",
                      isLive
                        ? "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  {isLive ? (
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] border-primary/20 bg-primary/10 text-primary px-1.5 py-0"
                    >
                      Live
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] border-border text-muted-foreground/60 px-1.5 py-0"
                    >
                      Soon
                    </Badge>
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-xs font-semibold leading-tight",
                      isLive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {mod.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                    {mod.phase}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
