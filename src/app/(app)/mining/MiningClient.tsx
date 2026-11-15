"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import {
  Pickaxe,
  Coins,
  AlertTriangle,
  RefreshCw,
  Info,
  Check,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MINING_LEVELS, MINING_LEVEL_MAP } from "@/data/levels";
import { formatRequirement } from "@/lib/levels/format";
import type { RequirementType } from "@/lib/levels/validation";
import { msUntilNextLagosMidnight, formatCountdown } from "@/lib/mining/helpers";
import { claimDailyMining } from "@/lib/mining/actions";
import { cn, pluralize } from "@/lib/utils";

interface WalletData {
  balance_zed: number;
  total_mined: number;
  streak_days: number;
  last_mined_at: string | null;
}

interface LogEntry {
  id: number;
  amount_mined: number;
  multiplier_applied: number;
  claim_date: string;
  mined_at: string;
}

interface LevelRequirement {
  level_id: number;
  requirement_type: string;
  threshold: number;
}

interface MiningClientProps {
  wallet: WalletData | null;
  logs: LogEntry[];
  levelId: number;
  isVerified: boolean;
  alreadyClaimed: boolean;
  withdrawalsEnabled?: boolean;
  levelRequirements?: LevelRequirement[];
}

const TURNSTILE_SITEKEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ??
  null;

const DEV_TEST_KEY = "1x00000000000000000000AA";
const IS_PROD = process.env.NODE_ENV === "production";

function dbg(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[turnstile]", ...args);
  }
}

const TURNSTILE_MESSAGES: Record<string, string> = {
  TURNSTILE_EXPIRED: "Verification expired. Please tap Claim again.",
  TURNSTILE_MISSING: "Please wait a moment for verification to finish.",
  TURNSTILE_FAILED: "Bot check failed. Refresh the page and try again.",
};

const CLAIM_MESSAGES: Record<string, string> = {
  ALREADY_CLAIMED: "You've already claimed today. Come back tomorrow!",
  NOT_SIGNED_IN: "Sign in to claim your $ZED.",
  INTERNAL: "Something went wrong. Please try again.",
  ...TURNSTILE_MESSAGES,
};

const resolvedSitekey = TURNSTILE_SITEKEY ?? (IS_PROD ? null : DEV_TEST_KEY);

export function MiningClient({
  wallet,
  logs,
  levelId,
  isVerified: _isVerified,
  alreadyClaimed: initialAlreadyClaimed,
  withdrawalsEnabled = false,
  levelRequirements = [],
}: MiningClientProps) {
  const level = MINING_LEVEL_MAP[levelId as 1 | 2 | 3 | 4 | 5] ?? MINING_LEVEL_MAP[1];

  // Local state
  const [claimed, setClaimed] = useState(initialAlreadyClaimed);
  const [currentBalance, setCurrentBalance] = useState(wallet?.balance_zed ?? 0);
  const [currentStreak, setCurrentStreak] = useState(wallet?.streak_days ?? 0);
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilNextLagosMidnight()));
  const [isPending, startTransition] = useTransition();

  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Countdown timer
  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilNextLagosMidnight()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const clearToken = useCallback(() => setTurnstileToken(null), []);

  const handleRetry = useCallback(() => {
    try {
      turnstileRef.current?.reset();
    } catch {
      /* ignore */
    }
    clearToken();
    setTurnstileError(null);
  }, [clearToken]);

  function handleClaim() {
    const token = turnstileToken ?? "bypass";

    startTransition(async () => {
      const result = await claimDailyMining(token);

      try {
        turnstileRef.current?.reset();
      } catch {
        /* ignore */
      }
      clearToken();
      setTurnstileError(null);

      if (result.ok) {
        setClaimed(true);
        setCurrentBalance(result.new_balance);
        setCurrentStreak(result.streak_days);
        toast.success(`+${result.amount} $ZED claimed!`, {
          description: `Streak: ${result.streak_days} ${pluralize(result.streak_days, "day", "days")} streak.`,
        });
      } else {
        toast.error(CLAIM_MESSAGES[result.error] ?? "Claim failed.");
      }
    });
  }

  const hasSitekey = Boolean(resolvedSitekey);
  const tokenReady = Boolean(turnstileToken) || (!IS_PROD && !hasSitekey);
  const canClaim = !claimed && !isPending && tokenReady;

  const claimButtonLabel = isPending
    ? "Claiming…"
    : claimed
    ? "Claimed today"
    : !tokenReady
    ? "Verifying you're human…"
    : `Claim ${level.dailyCap} ZED`;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── 1. Header ────────────────────────────────────────────── */}
      <section className="space-y-1 pb-2">
        <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
          Zed mining
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {withdrawalsEnabled
            ? "Earn ZED engagement points daily. Withdrawals to bank accounts are currently active."
            : "Earn ZED engagement points by claiming once per Lagos calendar day. Points have no cash value in Phase 1."}
        </p>
      </section>

      {/* ── 2. Hero Card: Balance & Daily Claim ───────────────────── */}
      <section
        aria-label="Mining overview"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* Balance & Stats Card (7 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col gap-5 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-mining)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Your balance
            </span>
            <Coins className="h-4 w-4 stroke-[1.5] text-[var(--data-mining)]" />
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[40px] leading-[44px] font-semibold font-sans tabular-nums text-foreground tracking-tight">
                {currentBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                $ZED
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {withdrawalsEnabled
                ? "Available for community bank withdrawals."
                : "Engagement points balance."}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
            <span className="font-sans tabular-nums">
              <strong className="font-semibold text-foreground">{currentStreak}</strong>{" "}
              {pluralize(currentStreak, "day", "days")} streak
            </span>
            <span>·</span>
            <span className="font-sans tabular-nums">
              <strong className="font-semibold text-foreground">
                {(wallet?.total_mined ?? 0).toLocaleString()}
              </strong>{" "}
              total ZED mined
            </span>
          </div>

          {withdrawalsEnabled && (
            <div className="pt-1">
              <Button asChild variant="outline" size="sm" className="text-xs font-medium border-border/70">
                <Link href="/mining/withdraw">
                  Withdraw ZED
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Claim Card (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col gap-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--data-mining)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {claimed ? "Next claim in" : "Daily claim"}
            </span>
            <span className="inline-flex items-center rounded-md border border-[var(--data-signups-border)] bg-[var(--data-signups-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-signups-ink)]">
              Level {level.id} · {level.multiplier.toFixed(1)}×
            </span>
          </div>

          <div>
            <p className="text-2xl font-bold font-sans tabular-nums text-foreground">
              {claimed ? countdown : `+${level.dailyCap} ZED`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {claimed
                ? "Resets at midnight Lagos time."
                : `Daily allowance based on your Level ${level.id} tier.`}
            </p>
          </div>

          {/* Bot-check unavailable banner */}
          {!claimed && IS_PROD && !resolvedSitekey && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Bot verification unavailable. Please try again later.</span>
            </div>
          )}

          {/* Turnstile error banner */}
          {turnstileError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1">Verification failed. Tap retry.</span>
              <button
                type="button"
                onClick={handleRetry}
                className="shrink-0 p-0.5 hover:bg-destructive/20 rounded cursor-pointer"
                aria-label="Retry verification"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Turnstile widget placed cleanly near button */}
          {!claimed && resolvedSitekey && (
            <div
              className="w-full min-h-[65px] flex items-center justify-center overflow-hidden rounded-md border border-border/40 bg-secondary/20 p-1"
              aria-label="Human verification widget"
            >
              <Turnstile
                ref={turnstileRef}
                siteKey={resolvedSitekey}
                options={{
                  theme: "auto",
                  size: "normal",
                }}
                onLoadScript={() => dbg("script loaded")}
                onWidgetLoad={(id) => dbg("widget loaded, id:", id)}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setTurnstileError(null);
                }}
                onExpire={() => {
                  clearToken();
                }}
                onError={(err) => {
                  setTurnstileError(typeof err === "string" ? err : "unknown");
                  clearToken();
                }}
                className="w-full"
              />
            </div>
          )}

          <Button
            id="claim-zed-button"
            onClick={handleClaim}
            disabled={!canClaim}
            size="default"
            className="w-full h-10 text-sm font-medium gap-2 motion-safe:transition-transform motion-safe:hover:scale-[1.01]"
          >
            <Pickaxe className="h-4 w-4 stroke-[1.5]" />
            {claimButtonLabel}
          </Button>
        </div>
      </section>

      {/* ── 3. Level Summary & Ladder ────────────────────────────── */}
      <section aria-label="Level matrix" className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Level matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Advance your level to increase your daily mining cap and multiplier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MINING_LEVELS.map((lvl) => {
            const isCurrentLevel = lvl.id === level.id;
            const isLocked = lvl.locked;
            const reqs = levelRequirements.filter((r) => r.level_id === lvl.id);

            return (
              <div
                key={lvl.id}
                className={cn(
                  "rounded-lg border p-4 flex flex-col justify-between gap-3 transition-colors",
                  isCurrentLevel
                    ? "border-[var(--data-signups-border)] bg-[var(--data-signups-subtle)]"
                    : "border-border/70 bg-card",
                  isLocked && !isCurrentLevel && "opacity-60"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Level {lvl.id}
                    </span>
                    {isCurrentLevel ? (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--data-signups)] text-white">
                        Current
                      </span>
                    ) : isLocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    {lvl.name}
                  </p>

                  <p className="text-xs text-muted-foreground leading-snug">
                    {isLocked
                      ? reqs.length === 0
                        ? "Opening in next phase"
                        : reqs
                            .map((r) => formatRequirement(r.requirement_type as RequirementType, r.threshold))
                            .join(" · ")
                      : "Base tier available to all citizens."}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 text-xs">
                  <span className="font-semibold text-foreground font-sans tabular-nums">
                    {lvl.dailyCap} ZED
                  </span>{" "}
                  <span className="text-muted-foreground font-sans tabular-nums">
                    (×{lvl.multiplier.toFixed(1)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Claim History ─────────────────────────────────────── */}
      <section aria-label="Claim history" className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Claim history
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your recent mining claims logged in the Lagos timezone (WAT).
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card p-8 text-center space-y-1.5">
            <Coins className="h-6 w-6 stroke-[1.5] text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">No claims yet</p>
            <p className="text-xs text-muted-foreground">
              Make your first daily claim above to begin your mining streak.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">Claim date</th>
                    <th className="text-left px-4 py-2.5 font-medium">Amount</th>
                    <th className="text-left px-4 py-2.5 font-medium">Multiplier</th>
                    <th className="text-right px-4 py-2.5 font-medium">Time (WAT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-sans tabular-nums text-foreground">
                        {log.claim_date}
                      </td>
                      <td className="px-4 py-3 font-sans tabular-nums font-semibold text-foreground">
                        +{Number(log.amount_mined).toFixed(2)} ZED
                      </td>
                      <td className="px-4 py-3 font-sans tabular-nums text-muted-foreground">
                        {Number(log.multiplier_applied).toFixed(1)}×
                      </td>
                      <td className="px-4 py-3 text-right font-sans tabular-nums text-muted-foreground">
                        {new Date(log.mined_at).toLocaleTimeString("en-GB", {
                          timeZone: "Africa/Lagos",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
