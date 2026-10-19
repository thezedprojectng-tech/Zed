import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getReferralOverview } from "@/lib/referrals/actions";
import { ReferralsClient } from "./ReferralsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Invite Friends & Earn ZED — Zed Referrals",
  description:
    "Invite friends to Zed. Earn bonus ZED points when your referred users verify their account.",
};

export default async function ReferralsPage() {
  const overview = await getReferralOverview();

  if (!overview) {
    redirect("/login?redirect=/referrals");
  }

  return <ReferralsClient overview={overview} />;
}
