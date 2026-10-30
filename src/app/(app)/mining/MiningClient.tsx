"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import { Pickaxe, Flame, Zap, AlertTriangle, ShieldCheck, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MINING_LEVELS, MINING_LEVEL_MAP } from "@/data/levels";
import { msUntilNextLagosMidnight, formatCountdown } from "@/lib/mining/helpers";
import { claimDailyMining } from "@/lib/mining/actions";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

interface MiningClientProps {
  wallet: WalletData | null;
  logs: LogEntry[];
  levelId: number;
  isVerified: boolean;
  alreadyClaimed: boolean;
  withdrawalsEnabled?: boolean;
}

/**
 * Turnstile sitekey.
 * Falls back to the Cloudflare "always passes" test key in development
 * when no real key is configured.
 */
const TURNSTILE_SITEKEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ??
  null; // null → dev bypass or "unavailable" in prod

const DEV_TEST_KEY = "1x00000000000000000000AA";
const IS_PROD = process.env.NODE_ENV === "production";

// ── Debug logger (dev only) ────────────────────────────────────────────────────
function dbg(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[turnstile]", ...args);
  }
}

// ── Per-error user-facing messages ────────────────────────────────────────────
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

// ── Resolved sitekey (may be test key in dev) ─────────────────────────────────
const resolvedSitekey = TURNSTILE_SITEKEY ?? (IS_PROD ? null : DEV_TEST_KEY);

export function MiningClient({
  wallet,
  logs,
  levelId,
  isVerified,
  alreadyClaimed: initialAlreadyClaimed,
  withdrawalsEnabled = false,
}: MiningClientProps) {
  const level = MINING_LEVEL_MAP[levelId as 1 | 2 | 3 | 4 | 5] ?? MINING_LEVEL_MAP[1];

  // Local state
  const [claimed, setClaimed] = useState(initialAlreadyClaimed);
  const [currentBalance, setCurrentBalance] = useState(wallet?.balance_zed ?? 0);
  const [currentStreak, setCurrentStreak] = useState(wallet?.streak_days ?? 0);
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilNextLagosMidnight()));
  const [isPending, startTransition] = useTransition();

  /** Turnstile Cloudflare error code, set by onError */
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  /**
   * `turnstileToken` state:
   *   null  → no token yet (widget loading / expired / cleared)
   *   str   → valid token ready to submit
   */
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  /** Ref to the Turnstile instance for resetting the challenge. */
  const turnstileRef = useRef<TurnstileInstance>(null);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilNextLagosMidnight()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  // ── Claim handler ──────────────────────────────────────────────────────────
  function handleClaim() {
    const token = turnstileToken ?? "bypass";

    startTransition(async () => {
      const result = await claimDailyMining(token);

      // Always reset the widget after every attempt so the next claim
      // (or retry) gets a fresh challenge – the core mobile fix.
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
          description: `Streak: ${result.streak_days} day${result.streak_days !== 1 ? "s" : ""} 🔥`,
        });
      } else {
        toast.error(CLAIM_MESSAGES[result.error] ?? "Claim failed.");
      }
    });
  }

  // Claim button is enabled only when we have a token (or dev bypass)
  const hasSitekey = Boolean(resolvedSitekey);
  const tokenReady = Boolean(turnstileToken) || (!IS_PROD && !hasSitekey);
  const canClaim = !claimed && !isPending && tokenReady;

  const claimButtonLabel = isPending
    ? "Claiming…"
    : claimed
    ? "Claimed today ✓"
    : !tokenReady
    ? "Verifying you're human…"
    : `Claim ${level.dailyCap} $ZED`;

  return (
    <div className="px-4 md:px-8 py-8 md:py-10 space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="space-y-1 border-hairline-b pb-6">
        <p className="type-caption text-muted-foreground font-mono uppercase tracking-wider">
          ZED MINING · PHASE 1
        </p>
        <h1 className="type-display text-foreground">Daily $ZED Claim</h1>
        <p className="type-body text-muted-foreground max-w-xl">
          Earn $ZED engagement points by claiming once per Lagos calendar day.
        </p>
        <p className="type-small text-muted-foreground/70 mt-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {withdrawalsEnabled
            ? "ZED can be withdrawn to a bank account once your request is approved."
            : "$ZED points have no cash value yet. Conversion is planned for a later phase."}
        </p>
      </section>

      {/* ── Balance + Claim card ────────────────────────────────────────── */}
      <section
        aria-label="Mining claim"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Balance card */}
        <Card className="p-5 border-border bg-card shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <p className="type-caption text-muted-foreground font-mono uppercase tracking-wider">
              Your Balance
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <Zap className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-3xl font-bold font-mono text-foreground">
                {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="type-small text-muted-foreground mt-0.5">$ZED points</p>
            </div>
            <Button asChild variant="outline" size="sm" className="font-mono text-xs">
              <Link href="/mining/withdraw">
                Withdraw ZED
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 pt-1 border-hairline-t">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold">
                {currentStreak} day streak
              </span>
            </div>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs text-muted-foreground">
              {(wallet?.total_mined ?? 0).toLocaleString()} total mined
            </span>
          </div>
        </Card>

        {/* Claim card */}
        <Card className="relative p-5 border-border bg-card shadow-xs overflow-hidden flex flex-col justify-between gap-4">
          {/* Accent stripe */}
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-primary" />

          <div className="flex items-start justify-between">
            <div>
              <p className="type-caption text-muted-foreground font-mono uppercase tracking-wider">
                {claimed ? "Next Claim In" : "Claim Available"}
              </p>
              <p className="text-2xl font-mono font-bold text-foreground mt-1 tabular-nums">
                {claimed ? countdown : `+${level.dailyCap} $ZED`}
              </p>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[10px] border-primary/20 bg-primary/10 text-primary px-1.5 py-0"
            >
              {level.name} · {level.multiplier}×
            </Badge>
          </div>

          {/*
           * Bot-check unavailable banner (production only, no sitekey configured).
           * Keeps the page functional while making the failure obvious.
           */}
          {!claimed && IS_PROD && !resolvedSitekey && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Bot check unavailable. Please try again later.</span>
            </div>
          )}

          {/* Turnstile error banner with retry */}
          {turnstileError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="flex-1">
                Verification failed
                {!IS_PROD && ` (code: ${turnstileError})`}
                . Tap to retry.
              </span>
              <button
                type="button"
                aria-label="Retry verification"
                onClick={handleRetry}
                className="shrink-0 rounded p-0.5 hover:bg-destructive/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/*
           * Turnstile widget container.
           *
           * Always rendered with reserved dimensions to prevent layout shift:
           *   • min-w-[300px] – Cloudflare's minimum widget width.
           *   • min-h-[65px]  – Cloudflare's standard widget height.
           *   • w-full        – fills available card width on narrow screens.
           *   • overflow-hidden – clips iframe edge bleed on small viewports.
           */}
          <div
            className="w-full min-w-[300px] min-h-[65px] flex items-center justify-center overflow-hidden"
            aria-label="Human verification widget"
          >
            {!claimed && resolvedSitekey && (
              <Turnstile
                ref={turnstileRef}
                siteKey={resolvedSitekey}
                options={{
                  theme: "auto",
                  size: "normal",
                }}
                onLoadScript={() => dbg("script loaded")}
                onWidgetLoad={(widgetId) => dbg("widget loaded, id:", widgetId)}
                onSuccess={(token) => {
                  dbg("token received (length):", token.length);
                  setTurnstileToken(token);
                  setTurnstileError(null);
                }}
                onExpire={() => {
                  dbg("token expired");
                  clearToken();
                }}
                onError={(errorCode) => {
                  dbg("error code:", errorCode);
                  setTurnstileError(typeof errorCode === "string" ? errorCode : "unknown");
                  clearToken();
                }}
                className="w-full"
              />
            )}
          </div>

          <Button
            id="claim-zed-button"
            onClick={handleClaim}
            disabled={!canClaim}
            className={cn(
              "w-full font-semibold gap-2",
              claimed && "cursor-default"
            )}
            aria-label={claimed ? "Already claimed today" : "Claim daily ZED"}
          >
            <Pickaxe className="h-4 w-4" aria-hidden="true" />
            {claimButtonLabel}
          </Button>
        </Card>
      </section>

      {/* ── Level Ladder ───────────────────────────────────────────────── */}
      <section aria-label="Mining level ladder" className="space-y-3">
        <h2 className="type-caption text-muted-foreground font-semibold uppercase tracking-wider font-mono">
          Level Matrix
        </h2>
        <div className="space-y-2">
          {MINING_LEVELS.map((lvl) => {
            const isCurrentLevel = lvl.id === level.id;
            const isLocked = lvl.locked;
            return (
              <div
                key={lvl.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                  isCurrentLevel
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card",
                  isLocked && !isCurrentLevel && "opacity-60"
                )}
              >
                {/* Level badge */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold",
                    isCurrentLevel
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-border bg-secondary text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {lvl.id}
                </div>

                {/* Name + unlock criteria */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isCurrentLevel ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {lvl.name}
                    </span>
                    {isCurrentLevel && (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono border-primary/20 bg-primary/10 text-primary px-1.5 py-0"
                      >
                        YOUR LEVEL
                      </Badge>
                    )}
                    {isLocked && (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono border-border text-muted-foreground/60 px-1.5 py-0"
                      >
                        LOCKED
                      </Badge>
                    )}
                  </div>
                  <p className="type-small text-muted-foreground mt-0.5 truncate">
                    {isLocked ? lvl.unlockCriteria : "Active."}
                  </p>
                </div>

                {/* Cap + multiplier */}
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs font-bold text-foreground">
                    {lvl.dailyCap} $ZED
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {lvl.multiplier}× daily
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Claim History ──────────────────────────────────────────────── */}
      <section aria-label="Mining claim history" className="space-y-3">
        <h2 className="type-caption text-muted-foreground font-semibold uppercase tracking-wider font-mono">
          Recent Claims (last 14)
        </h2>

        {logs.length === 0 ? (
          <Card className="p-8 border-border bg-card text-center">
            <ShieldCheck className="h-6 w-6 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-muted-foreground font-mono">
              No claims yet. Make your first claim above!
            </p>
          </Card>
        ) : (
          <Card className="border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-muted-foreground text-[10px] font-mono uppercase">
                    <th className="text-left px-4 py-2.5">Claim Date (WAT)</th>
                    <th className="text-left px-4 py-2.5">Amount</th>
                    <th className="text-left px-4 py-2.5">Multiplier</th>
                    <th className="text-right px-4 py-2.5">Mined At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                        {log.claim_date}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                        +{Number(log.amount_mined).toFixed(2)} $ZED
                      </td>
                      <td className="px-4 py-2.5 font-mono text-primary whitespace-nowrap">
                        {Number(log.multiplier_applied).toFixed(1)}×
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.mined_at).toLocaleTimeString("en-GB", {
                          timeZone: "Africa/Lagos",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} WAT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
