"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapTurnstileErrorCodes } from "@/lib/mining/turnstile";

interface ClaimResult {
  ok: true;
  amount: number;
  new_balance: number;
  streak_days: number;
}

interface ClaimError {
  ok: false;
  error:
    | "NOT_SIGNED_IN"
    | "NOT_VERIFIED"
    | "ALREADY_CLAIMED"
    | "INTERNAL"
    | "TURNSTILE_FAILED"
    | "TURNSTILE_EXPIRED"
    | "TURNSTILE_MISSING";
}

export type ClaimDailyMiningResult = ClaimResult | ClaimError;

/**
 * Server action: claim the daily $ZED mining reward.
 *
 * Flow:
 *  1. Turnstile bot-protection check:
 *     - In production (NODE_ENV === "production"), if secret is missing or verification fails, reject.
 *     - In development, skip verification if secret is not configured.
 *  2. Call Supabase RPC `claim_daily_mining()` (takes no args; uses auth.uid() inside).
 *  3. Revalidate /mining path to update balance and logs.
 */
export async function claimDailyMining(
  turnstileToken: string
): Promise<ClaimDailyMiningResult> {
  // ── 1. Turnstile verification ─────────────────────────────────────────────
  const isProd = process.env.NODE_ENV === "production";
  const secret =
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (isProd && !secret) {
    return { ok: false, error: "TURNSTILE_FAILED" };
  }

  if (secret) {
    if (!turnstileToken || (isProd && turnstileToken === "bypass")) {
      return { ok: false, error: "TURNSTILE_MISSING" };
    }

    const body = new URLSearchParams({
      secret,
      response: turnstileToken,
      // NOTE: never log `secret` or `turnstileToken` below this point
    });

    try {
      const tsRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body }
      );

      if (!tsRes.ok) {
        // HTTP-level failure – not a token problem
        console.error("[Turnstile] siteverify HTTP error:", tsRes.status);
        return { ok: false, error: "TURNSTILE_FAILED" };
      }

      const tsJson = (await tsRes.json()) as {
        success: boolean;
        "error-codes"?: string[];
      };

      if (!tsJson.success) {
        const codes: string[] = tsJson["error-codes"] ?? [];
        // Log raw Cloudflare codes for ops visibility – no PII, no secret, no token
        console.error("[Turnstile] verification failed. error-codes:", codes);
        return { ok: false, error: mapTurnstileErrorCodes(codes) };
      }
    } catch (err) {
      console.error("[Turnstile] network/parse error:", (err as Error).message);
      return { ok: false, error: "TURNSTILE_FAILED" };
    }
  }

  // ── 2. Call DB function claim_daily_mining() ──────────────────────────────
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_daily_mining");

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already claimed")) {
      return { ok: false, error: "ALREADY_CLAIMED" };
    }
    if (msg.includes("not verified") || msg.includes("must be verified")) {
      return { ok: false, error: "NOT_VERIFIED" };
    }
    if (msg.includes("not authenticated") || msg.includes("not signed in")) {
      return { ok: false, error: "NOT_SIGNED_IN" };
    }
    return { ok: false, error: "INTERNAL" };
  }

  const result = data as {
    ok?: boolean;
    error?: string;
    amount?: number;
    new_balance?: number;
    streak_days?: number;
  };

  if (!result || result.ok === false) {
    const code = result?.error;
    if (
      code === "NOT_VERIFIED" ||
      code === "ALREADY_CLAIMED" ||
      code === "NOT_SIGNED_IN"
    ) {
      return { ok: false, error: code };
    }
    return { ok: false, error: "INTERNAL" };
  }

  // ── 3. Revalidate ─────────────────────────────────────────────────────────
  revalidatePath("/mining");

  return {
    ok: true,
    amount: Number(result.amount ?? 0),
    new_balance: Number(result.new_balance ?? 0),
    streak_days: Number(result.streak_days ?? 1),
  };
}

/**
 * Fetch the current token wallet + last 14 mining logs for the signed-in user.
 * Used by the /mining page Server Component.
 */
export async function getMiningData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      wallet: null,
      logs: [],
    };
  }

  const [walletResult, logsResult] = await Promise.all([
    supabase
      .from("token_wallets")
      .select("balance_zed, total_mined, streak_days, last_mined_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("mining_logs")
      .select("id, amount_mined, multiplier_applied, claim_date, mined_at")
      .eq("user_id", user.id)
      .order("mined_at", { ascending: false })
      .limit(14),
  ]);

  return {
    wallet: walletResult.data as {
      balance_zed: number;
      total_mined: number;
      streak_days: number;
      last_mined_at: string | null;
    } | null,
    logs: (logsResult.data ?? []) as Array<{
      id: number;
      amount_mined: number;
      multiplier_applied: number;
      claim_date: string;
      mined_at: string;
    }>,
  };
}
