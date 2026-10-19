"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  formatReferralLink,
  maskUserName,
  mapReferralError,
} from "./helpers";
import {
  applyReferralSchema,
  adminReferralSettingsSchema,
  type AdminReferralSettingsInput,
} from "./validation";
import type {
  AdminReferralRecord,
  ReferredUserEntry,
  ReferralSettings,
  ReferralStatus,
  TopReferrerEntry,
  UserReferralOverview,
} from "./types";

const DEFAULT_SETTINGS: ReferralSettings = {
  id: 1,
  enabled: false,
  referrer_reward_zed: 100,
  referee_reward_zed: 50,
  max_rewarded_per_referrer: 50,
  updated_at: new Date().toISOString(),
};

/**
 * Fetch overview data for the current user's referral screen:
 * - Unique referral code & sign-up link
 * - Active referral settings
 * - Stats (invited, rewarded, total ZED earned)
 * - List of invited users (masked names)
 * - Eligibility to enter a referral code manually
 */
export async function getReferralOverview(): Promise<UserReferralOverview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileRes, settingsRes, existingReferrerRes, userReferralsRes] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, referral_code, is_verified, created_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("referral_settings")
        .select("id, enabled, referrer_reward_zed, referee_reward_zed, max_rewarded_per_referrer, updated_at")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("referrals")
        .select("id, status")
        .eq("referred_id", user.id)
        .maybeSingle(),
      supabase.rpc("get_user_referrals"),
    ]);

  const profile = profileRes.data;
  if (!profile) {
    return null;
  }

  const rawSettings = settingsRes.data;
  const settings: ReferralSettings = rawSettings
    ? {
        id: rawSettings.id,
        enabled: Boolean(rawSettings.enabled),
        referrer_reward_zed: Number(rawSettings.referrer_reward_zed ?? 100),
        referee_reward_zed: Number(rawSettings.referee_reward_zed ?? 50),
        max_rewarded_per_referrer: Number(rawSettings.max_rewarded_per_referrer ?? 50),
        updated_at: rawSettings.updated_at,
      }
    : DEFAULT_SETTINGS;

  const hasReferrer = Boolean(existingReferrerRes.data);

  // Eligible to enter code: no referrer yet, unverified, and account created within 7 days
  const accountAgeMs = Date.now() - new Date(profile.created_at).getTime();
  const isRecentAccount = accountAgeMs <= 7 * 24 * 60 * 60 * 1000;
  const isEligibleToEnterCode =
    !hasReferrer && !profile.is_verified && isRecentAccount;

  // Process referred users
  const rawList = (userReferralsRes.data ?? []) as Array<{
    id: string;
    referred_id: string;
    masked_name: string;
    status: string;
    referrer_reward_zed: number;
    created_at: string;
    rewarded_at: string | null;
  }>;

  const referredUsers: ReferredUserEntry[] = rawList.map((r) => ({
    id: String(r.id),
    masked_name: r.masked_name || "User",
    status: r.status as ReferralStatus,
    reward_earned: Number(r.referrer_reward_zed || 0),
    created_at: String(r.created_at),
    rewarded_at: r.rewarded_at ? String(r.rewarded_at) : null,
  }));

  const totalInvited = referredUsers.length;
  const totalRewarded = referredUsers.filter(
    (r) => r.status === "rewarded"
  ).length;
  const totalEarnedZed = referredUsers.reduce(
    (sum, r) => sum + (r.status === "rewarded" ? r.reward_earned : 0),
    0
  );
  const pendingCount = referredUsers.filter(
    (r) => r.status === "pending"
  ).length;

  const referralCode = profile.referral_code || "";
  const referralLink = formatReferralLink(referralCode);

  return {
    referralCode,
    referralLink,
    settings,
    stats: {
      totalInvited,
      totalRewarded,
      totalEarnedZed,
      pendingCount,
    },
    hasReferrer,
    isEligibleToEnterCode,
    referredUsers,
  };
}

/**
 * Server action: User enters a referral code.
 * Safe, idempotent, validates constraints on DB side.
 */
export async function applyReferralAction(
  code: string
): Promise<{ ok: true; referral_id?: string } | { ok: false; error: string }> {
  const parsed = applyReferralSchema.safeParse({ code });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid referral code." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please sign in to apply a referral code." };
  }

  const { data, error } = await supabase.rpc("apply_referral", {
    p_code: parsed.data.code.trim().toUpperCase(),
  });

  if (error) {
    console.error("[Referrals] apply_referral RPC error:", error.message);
    return { ok: false, error: mapReferralError(error.message) };
  }

  const result = data as { ok?: boolean; error?: string; referral_id?: string };
  if (!result || result.ok === false) {
    return { ok: false, error: mapReferralError(result?.error) };
  }

  revalidatePath("/referrals");
  revalidatePath("/home");

  return { ok: true, referral_id: result.referral_id };
}

/**
 * Admin check helper
 */
async function verifyAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, authorized: false as const, user: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { supabase, authorized: false as const, user };
  }

  return { supabase, authorized: true as const, user };
}

/**
 * Admin: Get all referrals, settings, metrics, and top referrers
 */
export async function adminGetReferrals() {
  const { supabase, authorized } = await verifyAdminSession();
  if (!authorized) {
    return { ok: false as const, error: "Unauthorized access" };
  }

  const [settingsRes, referralsRes] = await Promise.all([
    supabase.from("referral_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (settingsRes.error || referralsRes.error) {
    console.error(
      "[Admin] adminGetReferrals error:",
      settingsRes.error?.message || referralsRes.error?.message
    );
    return { ok: false as const, error: "Failed to load referrals data" };
  }

  const rawSettings = settingsRes.data;
  const settings: ReferralSettings = rawSettings
    ? {
        id: rawSettings.id,
        enabled: Boolean(rawSettings.enabled),
        referrer_reward_zed: Number(rawSettings.referrer_reward_zed ?? 100),
        referee_reward_zed: Number(rawSettings.referee_reward_zed ?? 50),
        max_rewarded_per_referrer: Number(rawSettings.max_rewarded_per_referrer ?? 50),
        updated_at: rawSettings.updated_at,
      }
    : DEFAULT_SETTINGS;

  const rawReferrals = referralsRes.data ?? [];
  const userIds = Array.from(
    new Set([
      ...rawReferrals.map((r) => r.referrer_id),
      ...rawReferrals.map((r) => r.referred_id),
    ].filter(Boolean))
  );

  // Fetch users details in a secondary query
  const usersMap: Record<
    string,
    { name: string; referral_code: string; is_verified: boolean }
  > = {};

  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, full_name, referral_code, is_verified")
      .in("id", userIds);

    for (const u of usersData ?? []) {
      usersMap[u.id] = {
        name: u.full_name || "User",
        referral_code: u.referral_code || "",
        is_verified: Boolean(u.is_verified),
      };
    }
  }

  const referrals: AdminReferralRecord[] = rawReferrals.map((r) => ({
    id: String(r.id),
    referrer_id: String(r.referrer_id),
    referrer_name: usersMap[r.referrer_id]?.name || "User",
    referrer_code: usersMap[r.referrer_id]?.referral_code || "—",
    referred_id: String(r.referred_id),
    referred_name: usersMap[r.referred_id]?.name || "User",
    referred_verified: Boolean(usersMap[r.referred_id]?.is_verified),
    status: r.status as ReferralStatus,
    referrer_reward_zed: Number(r.referrer_reward_zed || 0),
    referee_reward_zed: Number(r.referee_reward_zed || 0),
    created_at: String(r.created_at),
    rewarded_at: r.rewarded_at ? String(r.rewarded_at) : null,
  }));

  // Aggregated Stats
  const totalReferrals = referrals.length;
  const totalRewarded = referrals.filter((r) => r.status === "rewarded").length;
  const totalPending = referrals.filter((r) => r.status === "pending").length;
  const totalCapped = referrals.filter((r) => r.status === "capped").length;
  const totalZedPaid = referrals.reduce(
    (sum, r) => sum + r.referrer_reward_zed + r.referee_reward_zed,
    0
  );

  // Top Referrers
  const referrerStatsMap: Record<
    string,
    {
      userId: string;
      name: string;
      code: string;
      totalInvites: number;
      rewardedCount: number;
      totalEarnedZed: number;
    }
  > = {};

  for (const r of referrals) {
    if (!referrerStatsMap[r.referrer_id]) {
      referrerStatsMap[r.referrer_id] = {
        userId: r.referrer_id,
        name: r.referrer_name,
        code: r.referrer_code,
        totalInvites: 0,
        rewardedCount: 0,
        totalEarnedZed: 0,
      };
    }
    const stat = referrerStatsMap[r.referrer_id];
    stat.totalInvites += 1;
    if (r.status === "rewarded") {
      stat.rewardedCount += 1;
      stat.totalEarnedZed += r.referrer_reward_zed;
    }
  }

  const topReferrers: TopReferrerEntry[] = Object.values(referrerStatsMap)
    .sort((a, b) => b.rewardedCount - a.rewardedCount || b.totalInvites - a.totalInvites)
    .slice(0, 10);

  return {
    ok: true as const,
    data: {
      settings,
      referrals,
      stats: {
        totalReferrals,
        totalRewarded,
        totalPending,
        totalCapped,
        totalZedPaid,
      },
      topReferrers,
    },
  };
}

/**
 * Admin: Update referral settings (reward amounts, enabled toggle, cap)
 */
export async function adminUpdateReferralSettingsAction(
  input: AdminReferralSettingsInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, authorized } = await verifyAdminSession();
  if (!authorized) {
    return { ok: false, error: "Unauthorized access" };
  }

  const parsed = adminReferralSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid settings input." };
  }

  const {
    enabled,
    referrer_reward_zed,
    referee_reward_zed,
    max_rewarded_per_referrer,
  } = parsed.data;

  const { error } = await supabase.rpc("admin_update_referral_settings", {
    p_enabled: enabled,
    p_referrer_reward_zed: referrer_reward_zed,
    p_referee_reward_zed: referee_reward_zed,
    p_max_rewarded_per_referrer: max_rewarded_per_referrer,
  });

  if (error) {
    console.error("[Admin] admin_update_referral_settings error:", error.message);
    return { ok: false, error: "Failed to update referral settings" };
  }

  revalidatePath("/admin/referrals");
  revalidatePath("/referrals");

  return { ok: true };
}

/**
 * Admin: Batch process pending referrals for users who verified before feature was enabled
 */
export async function adminProcessPendingReferralsAction(): Promise<
  { ok: true; processedCount: number } | { ok: false; error: string }
> {
  const { supabase, authorized } = await verifyAdminSession();
  if (!authorized) {
    return { ok: false, error: "Unauthorized access" };
  }

  const { data, error } = await supabase.rpc("admin_process_pending_referrals");

  if (error) {
    console.error("[Admin] admin_process_pending_referrals error:", error.message);
    return { ok: false, error: "Failed to process pending referrals" };
  }

  const result = data as { ok?: boolean; processed_count?: number };

  revalidatePath("/admin/referrals");
  revalidatePath("/referrals");

  return { ok: true, processedCount: Number(result?.processed_count ?? 0) };
}
