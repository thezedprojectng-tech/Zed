import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWithdrawalOverview } from "@/lib/withdraw/actions";
import { isVerifiedBadgeEnabled } from "@/lib/verification/flags";
import { VerifyAccountBanner } from "@/components/verification/VerifyAccountBanner";
import { WithdrawClient } from "./WithdrawClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Withdraw ZED — Bank Payout",
  description:
    "Convert and withdraw your $ZED tokens to your Nigerian bank account at the fixed community rate.",
};

export default async function WithdrawPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/mining/withdraw");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("date_of_birth, is_verified")
    .eq("id", user.id)
    .single();

  if (!profile?.date_of_birth) {
    redirect("/home");
  }

  const overview = await getWithdrawalOverview();

  if (!overview) {
    redirect("/login?redirect=/mining/withdraw");
  }

  const isVerified = Boolean(profile?.is_verified ?? overview.isVerified);
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

  return (
    <div className="mx-auto max-w-8xl">
      {bannerStatus && (
        <div className="px-4 md:px-8 pt-6 md:pt-8">
          <VerifyAccountBanner status={bannerStatus} />
        </div>
      )}
      <WithdrawClient overview={overview} />
    </div>
  );
}
