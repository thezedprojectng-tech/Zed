import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Pickaxe,
  Users,
  GraduationCap,
  Coins,
  Check,
  Compass,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, pluralize } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/data/modules";
import { MINING_LEVEL_MAP } from "@/data/levels";
import { getLevelName } from "@/types";
import { isSameLagosDay } from "@/lib/mining/helpers";
import { isVerifiedBadgeEnabled } from "@/lib/verification/flags";
import { VerifyAccountBanner } from "@/components/verification/VerifyAccountBanner";
import { CountUp } from "@/components/home/CountUp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Dashboard – Zed",
  description:
    "Your Zed dashboard. Track your ZED balance, mining streak, referrals, skill progress and active civic guides.",
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

interface NewsPostItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: "news" | "update" | "announcement";
  published_at: string;
}

const FLOW_META: Record<string, { href: string; label: string; ref: string }> = {
  passport: { href: "/nav/passport", label: "Nigerian Passport", ref: "NIS-01" },
  nysc: { href: "/nav/nysc", label: "NYSC Mobilisation", ref: "NYSC-02" },
  "nin-bvn": { href: "/nav/nin-bvn", label: "NIN & BVN Harmonisation", ref: "NIMC-03" },
  cac: { href: "/nav/cac", label: "CAC Business Registration", ref: "CAC-04" },
};

function getRequirementUnit(type: string, count: number): string {
  switch (type) {
    case "mining_days":
      return pluralize(count, "day", "days");
    case "verified_referrals":
      return pluralize(count, "friend", "friends");
    case "completed_courses":
      return pluralize(count, "course", "courses");
    case "total_mined":
      return "ZED";
    default:
      return "";
  }
}

const REQUIREMENT_LABELS: Record<string, string> = {
  total_mined: "Total ZED mined",
  mining_days: "Days mined",
  verified_referrals: "Verified referrals",
  completed_courses: "Skill courses completed",
};

/** Deterministic Lagos time-of-day greeting and date string (prevents hydration mismatch) */
function getLagosGreetingAndDate(): { greeting: string; dateString: string } {
  const now = new Date();

  // Extract hour in Africa/Lagos
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(hourFormatter.format(now), 10) || 12;

  let greeting = "Good evening";
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  const dateString = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(now);

  return { greeting, dateString };
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Run all primary queries concurrently
  const [
    profileRes,
    walletRes,
    miningCountRes,
    referralCountRes,
    totalLessonsRes,
    completedLessonsRes,
    levelProgressRes,
    progressRowsRes,
    newsRes,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, level_id, is_verified")
      .eq("id", user.id)
      .single(),
    supabase
      .from("token_wallets")
      .select("balance_zed, streak_days, last_mined_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("mining_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id),
    supabase
      .from("skill_lessons")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("skill_progress")
      .select("lesson_id, skill_lessons!inner(id)", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.rpc("get_my_level_progress"),
    supabase
      .from("nav_progress")
      .select("flow_id, state, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("news_posts")
      .select("id, slug, title, summary, category, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
  ]);

  const profile = profileRes.data;
  const wallet = walletRes.data;
  const miningDays = miningCountRes.count ?? 0;
  const referralCount = referralCountRes.count ?? 0;
  const totalLessons = totalLessonsRes.count ?? 0;
  const completedLessons = completedLessonsRes.count ?? 0;
  const newsPosts = (newsRes.data as NewsPostItem[] | null) ?? [];

  let levelProgress: LevelProgressData | null = null;
  if (levelProgressRes && !levelProgressRes.error && levelProgressRes.data) {
    levelProgress = levelProgressRes.data as unknown as LevelProgressData;
  }

  // Active guide detection
  const activeGuideRow = (progressRowsRes.data ?? []).find(
    (row) => !row.state?.completed
  );
  const activeFlowId = activeGuideRow?.flow_id as string | undefined;
  const activeGuideMeta = activeFlowId ? FLOW_META[activeFlowId] : null;
  const activeGuideState = activeGuideRow?.state as {
    completed_steps?: string[];
  } | null;
  const completedSteps = activeGuideState?.completed_steps ?? [];

  // Check verification banner status
  const isVerified = Boolean(profile?.is_verified);
  let bannerStatus: "none" | "pending" | "rejected" | null = null;
  if (!isVerified && isVerifiedBadgeEnabled()) {
    const { data: bankVerif } = await supabase
      .from("bank_verifications")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!bankVerif) {
      bannerStatus = "none";
    } else if (bankVerif.status === "pending" || bankVerif.status === "rejected") {
      bannerStatus = bankVerif.status;
    }
  }

  const fullName = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || "";
  const firstName = fullName.trim().split(" ")[0] || "Citizen";
  const civicLevel = (profile?.level_id ?? 1) as 1 | 2 | 3 | 4 | 5;
  const levelData = MINING_LEVEL_MAP[civicLevel] ?? MINING_LEVEL_MAP[1];
  const balanceZed = wallet?.balance_zed ?? 0;
  const streakDays = wallet?.streak_days ?? 0;
  const lastMinedAt = wallet?.last_mined_at;

  // Claim eligibility: user can claim if they have not yet claimed today in Lagos time
  const alreadyClaimedToday = lastMinedAt
    ? isSameLagosDay(new Date(lastMinedAt), new Date())
    : false;

  const { greeting, dateString } = getLagosGreetingAndDate();

  // Modules separation
  const liveModules = MODULES.filter((m) => m.status === "live");
  const soonModules = MODULES.filter((m) => m.status === "soon");

  // Level requirements evaluation
  const requirements = levelProgress?.requirements ?? [];
  const metCount = requirements.filter(
    (r) => r.met || (r.threshold > 0 && r.current >= r.threshold)
  ).length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── 1. Header Row ────────────────────────────────────────── */}
      <header className="space-y-1.5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <h1
            className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight"
            suppressHydrationWarning
          >
            {greeting}, {firstName}
          </h1>

          {/* Level pill: below name on phone, inline on desktop */}
          <div className="flex items-center gap-2 mt-1 sm:mt-0 flex-wrap">
            <span className="inline-flex items-center rounded-md border border-[var(--data-signups-border)] bg-[var(--data-signups-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-signups-ink)]">
              Level {civicLevel} · {levelData.name}
            </span>

            {isVerifiedBadgeEnabled() && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border",
                  isVerified
                    ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                    : "border-border/70 bg-secondary/50 text-muted-foreground"
                )}
              >
                {isVerified ? "Verified" : "Unverified"}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-sans" suppressHydrationWarning>
          {dateString}
        </p>
      </header>

      {/* ── 2. Verification Banner (if unverified) ────────────────── */}
      {bannerStatus && <VerifyAccountBanner status={bannerStatus} />}

      {/* ── 3. Hero Row (aligned to top so Mining card hugs content) ─ */}
      <section aria-label="Hero overview" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Mining Card (8 cols) — hugs content without artificial height stretching */}
        <div className="lg:col-span-8 rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col gap-5 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-mining)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                ZED balance
              </span>
              <Coins className="h-4 w-4 stroke-[1.5] text-[var(--data-mining)]" />
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[40px] leading-[44px] font-semibold font-sans tabular-nums text-foreground tracking-tight">
                  {balanceZed.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  $ZED
                </span>
              </div>
              {balanceZed === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Claim your daily ZED points to begin your streak.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* State-driven claim action */}
            {!alreadyClaimedToday ? (
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  asChild
                  size="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm h-10 px-5 motion-safe:transition-transform motion-safe:hover:scale-[1.01]"
                >
                  <Link href="/mining">
                    <Pickaxe className="h-4 w-4 mr-2 stroke-[1.5]" />
                    Mine today
                  </Link>
                </Button>
                <span className="text-xs text-muted-foreground">
                  +{levelData.dailyCap} ZED available for your tier
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <Button
                  disabled
                  variant="outline"
                  size="default"
                  className="h-10 px-5 text-sm opacity-70 border-border/70 font-medium"
                >
                  Claimed today
                </Button>
                <span className="text-xs text-muted-foreground">
                  Next claim available tomorrow (resets at midnight Lagos time)
                </span>
              </div>
            )}

            {/* Stat lines below */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
              <span className="font-sans tabular-nums">
                <strong className="font-semibold text-foreground">{streakDays}</strong>{" "}
                {pluralize(streakDays, "day", "days")} streak
              </span>
              <span>·</span>
              <span className="font-sans tabular-nums">
                <strong className="font-semibold text-foreground">{miningDays}</strong>{" "}
                total {pluralize(miningDays, "claim", "claims")}
              </span>
            </div>
          </div>
        </div>

        {/* Level Card (4 cols) */}
        <div className="lg:col-span-4 rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col gap-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-signups)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Civic level
              </span>
              <span className="text-xs text-muted-foreground font-sans tabular-nums">
                ×{levelData.multiplier.toFixed(1)} · {levelData.dailyCap} ZED / day
              </span>
            </div>

            <div>
              <p className="text-base font-semibold text-foreground">
                Level {civicLevel} — {levelData.name}
              </p>
              {civicLevel >= 5 ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Maximum civic level achieved.
                </p>
              ) : levelProgress?.next_open && requirements.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Next: Level {levelProgress.next_level} ({metCount} of {requirements.length} requirements met)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Next tier requirements opening soon.
                </p>
              )}
            </div>

            {/* Overall progress bar */}
            {civicLevel < 5 && requirements.length > 0 && (
              <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--data-signups)] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((metCount / requirements.length) * 100))}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Requirement checklist */}
          {civicLevel < 5 && requirements.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
              {requirements.map((req) => {
                const label = REQUIREMENT_LABELS[req.type] ?? req.type.replace(/_/g, " ");
                const unit = getRequirementUnit(req.type, req.threshold);
                const isMet = req.met || (req.threshold > 0 && req.current >= req.threshold);
                const pct =
                  req.threshold > 0
                    ? Math.min(100, Math.round((req.current / req.threshold) * 100))
                    : 0;

                if (isMet) {
                  return (
                    <div
                      key={req.type}
                      className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                    >
                      <span className="text-foreground leading-snug pr-2 whitespace-normal break-words">
                        {label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[var(--data-signups-ink)] font-medium shrink-0">
                        <Check className="h-3.5 w-3.5 text-[var(--data-signups)]" />
                        <span>Done</span>
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={req.type}
                    className="space-y-1 py-1 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground leading-snug pr-2 whitespace-normal break-words">
                        {label}
                      </span>
                      <span className="text-muted-foreground font-sans tabular-nums shrink-0">
                        {req.current} of {req.threshold} {unit}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--data-signups)] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Stat Row (3 tiles, col-span-4 each) ───────────────── */}
      <section aria-label="Key metrics" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Referrals */}
        <div className="rounded-lg border border-border/70 bg-card p-5 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-users)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Referrals
            </span>
            <Users className="h-4 w-4 stroke-[1.5] text-[var(--data-users)]" />
          </div>

          <div>
            <div className="text-2xl font-semibold font-sans tabular-nums text-foreground">
              <CountUp value={referralCount} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {referralCount === 0
                ? "Invite friends to earn bonus ZED"
                : `${referralCount} ${pluralize(referralCount, "friend", "friends")} invited`}
            </p>
          </div>

          <Link
            href="/referrals"
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            Invite friends <ArrowRight className="h-3 w-3 stroke-[1.5]" />
          </Link>
        </div>

        {/* Skill */}
        <div className="rounded-lg border border-border/70 bg-card p-5 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-flows)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Skill
            </span>
            <GraduationCap className="h-4 w-4 stroke-[1.5] text-[var(--data-flows)]" />
          </div>

          <div>
            <div className="text-2xl font-semibold font-sans tabular-nums text-foreground">
              <CountUp value={completedLessons} />
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {totalLessons}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pluralize(completedLessons, "lesson", "lessons")} completed
            </p>
          </div>

          <Link
            href="/skill"
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            View tracks <ArrowRight className="h-3 w-3 stroke-[1.5]" />
          </Link>
        </div>

        {/* Mining Activity / Streak */}
        <div className="rounded-lg border border-border/70 bg-card p-5 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-mining)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Mining streak
            </span>
            <Pickaxe className="h-4 w-4 stroke-[1.5] text-[var(--data-mining)]" />
          </div>

          <div>
            <div className="text-2xl font-semibold font-sans tabular-nums text-foreground">
              <CountUp value={streakDays} />
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {pluralize(streakDays, "day", "days")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans tabular-nums">
              {miningDays} total {pluralize(miningDays, "claim", "claims")} logged
            </p>
          </div>

          <Link
            href="/mining"
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            Mining details <ArrowRight className="h-3 w-3 stroke-[1.5]" />
          </Link>
        </div>
      </section>

      {/* ── 5. Two-up Row: Continue Guide & From Zed ─────────────── */}
      <section aria-label="Activity and news" className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Continue Zed Nav guide */}
        <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-verified)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {activeGuideMeta ? "Active civic guide" : "Civic guides"}
              </span>
              <Compass className="h-4 w-4 stroke-[1.5] text-[var(--data-verified)]" />
            </div>

            {activeGuideMeta ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-sans">
                    {activeGuideMeta.ref}
                  </span>
                  <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--data-verified-ink)]">
                    In progress
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {activeGuideMeta.label}
                </h3>
                {completedSteps.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-sans tabular-nums">
                        {completedSteps.length} {pluralize(completedSteps.length, "step", "steps")} completed
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--data-verified)] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(completedSteps.length * 15, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  Nigerian Passport (NIS-01)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Step-by-step verified civic playbook with statutory fee tables, document checklists, and appointment guides.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs font-medium border-border/70 hover:bg-secondary"
            >
              <Link href={activeGuideMeta ? activeGuideMeta.href : "/nav/passport"}>
                {activeGuideMeta ? "Resume guide" : "Start guide"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 stroke-[1.5]" />
              </Link>
            </Button>
          </div>
        </div>

        {/* From Zed (Latest 2 news posts) — compact when empty */}
        <div
          className={cn(
            "rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col justify-between gap-4",
            newsPosts.length === 0 && "py-4 sm:py-5"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                From Zed
              </span>
              <Newspaper className="h-4 w-4 stroke-[1.5] text-muted-foreground" />
            </div>

            {newsPosts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">
                No news yet.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {newsPosts.map((post) => (
                  <article key={post.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                        {post.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-sans tabular-nums">
                        {new Date(post.published_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Link
                      href={`/news/${post.slug}`}
                      className="text-xs font-medium text-foreground hover:underline block line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                      {post.summary}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="pt-1">
            <Link
              href="/news"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              All news <ArrowRight className="h-3 w-3 stroke-[1.5]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Platform Modules ──────────────────────────────────── */}
      <section aria-label="Platform modules" className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Zed modules
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {liveModules.length} modules are live. More are on the way.
          </p>
        </div>

        {/* Live module tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {liveModules.map((mod) => {
            const Icon = mod.icon;
            const href = mod.href ?? "/nav";

            return (
              <Link
                key={mod.slug}
                href={href}
                className="rounded-lg border border-border/70 bg-card p-3.5 hover:shadow-xs hover:border-border transition-all flex items-start gap-3 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-foreground shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {mod.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 bg-secondary px-1.5 py-0.2 rounded border border-border/40 shrink-0">
                      Live
                    </span>
                  </div>
                  {/* Two-line description allowed */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                    {mod.tagline}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quiet On the Roadmap row */}
        {soonModules.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              On the roadmap
            </p>
            <div className="flex flex-wrap gap-2">
              {soonModules.map((mod) => (
                <span
                  key={mod.slug}
                  className="text-xs text-muted-foreground/70 bg-secondary/40 border border-border/40 rounded-md px-2.5 py-1"
                >
                  {mod.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
