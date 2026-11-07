import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMiningData } from "@/lib/mining/actions";
import { getLagosDate } from "@/lib/mining/helpers";
import { MiningClient } from "./MiningClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Zed Mining — Daily $ZED Claim",
  description:
    "Claim your daily $ZED engagement points. $ZED has no cash value in Phase 1.",
};

export default async function MiningPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("level_id, is_verified, date_of_birth")
    .eq("id", user.id)
    .single();

  if (!profile?.date_of_birth) {
    redirect("/home");
  }

  const levelId: number = profile?.level_id ?? 1;
  const isVerified: boolean = Boolean(profile?.is_verified);

  // Fetch wallet + logs
  const { wallet, logs } = await getMiningData();

  // Determine if already claimed today (Lagos calendar day)
  const alreadyClaimed =
    wallet?.last_mined_at
      ? getLagosDate(new Date(wallet.last_mined_at)) === getLagosDate(new Date())
      : false;

  // Fetch zed settings for withdrawals flag
  const { data: zedSettings } = await supabase
    .from("zed_settings")
    .select("withdrawals_enabled")
    .eq("id", 1)
    .maybeSingle();

  const withdrawalsEnabled = Boolean(zedSettings?.withdrawals_enabled);

  // Fetch level requirements
  const { data: levelRequirements } = await supabase
    .from("level_requirements")
    .select("level_id, requirement_type, threshold")
    .order("level_id")
    .order("requirement_type");

  return (
    <MiningClient
      wallet={wallet}
      logs={logs}
      levelId={levelId}
      isVerified={isVerified}
      alreadyClaimed={alreadyClaimed}
      withdrawalsEnabled={withdrawalsEnabled}
      levelRequirements={levelRequirements ?? []}
    />
  );
}
