"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeLeaderboardResponse,
  type LeaderboardBoard,
  type LeaderboardData,
  type LeaderboardPeriod,
} from "./format";

export async function getLeaderboardAction(
  board: LeaderboardBoard,
  period: LeaderboardPeriod,
  limit = 20
): Promise<{ ok: true; data: LeaderboardData } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Please sign in to view leaderboards." };
    }

    const { data, error } = await supabase.rpc("leaderboard_get", {
      p_board: board,
      p_period: period,
      p_limit: limit,
    });

    if (error) {
      return { ok: false, error: error.message || "Failed to load leaderboard." };
    }

    return {
      ok: true,
      data: normalizeLeaderboardResponse(data, board, period),
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load leaderboard.",
    };
  }
}

export async function getLeaderboardHiddenAction(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from("leaderboard_prefs")
      .select("hidden")
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return Boolean((data as { hidden?: boolean }).hidden);
  } catch {
    return false;
  }
}

export async function setLeaderboardHiddenAction(
  hidden: boolean
): Promise<{ ok: boolean; hidden: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, hidden: !hidden, error: "Please sign in first." };
    }

    const { data, error } = await supabase.rpc("leaderboard_set_hidden", {
      p_hidden: hidden,
    });

    if (error) {
      return {
        ok: false,
        hidden: !hidden,
        error: error.message || "Failed to update leaderboard visibility.",
      };
    }

    const resultHidden =
      data && typeof data === "object" && "hidden" in data
        ? Boolean((data as { hidden?: boolean }).hidden)
        : hidden;

    revalidatePath("/leaderboard");
    revalidatePath("/profile");

    return { ok: true, hidden: resultHidden };
  } catch (err: unknown) {
    return {
      ok: false,
      hidden: !hidden,
      error: err instanceof Error ? err.message : "Failed to update leaderboard visibility.",
    };
  }
}
