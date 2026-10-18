import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  const overview = await getWithdrawalOverview();

  if (!overview) {
    redirect("/login?redirect=/mining/withdraw");
  }

  return <WithdrawClient overview={overview} />;
}
