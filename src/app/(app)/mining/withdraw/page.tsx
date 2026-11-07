import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWithdrawalOverview } from "@/lib/withdraw/actions";
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
    .select("date_of_birth")
    .eq("id", user.id)
    .single();

  if (!profile?.date_of_birth) {
    redirect("/home");
  }

  const overview = await getWithdrawalOverview();

  if (!overview) {
    redirect("/login?redirect=/mining/withdraw");
  }

  return <WithdrawClient overview={overview} />;
}
