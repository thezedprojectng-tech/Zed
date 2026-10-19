import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetWithdrawals } from "@/lib/withdraw/actions";
import { WithdrawalsQueueClient } from "./WithdrawalsQueueClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — ZED Withdrawals Queue",
  description: "Review, approve, and manage bank payout requests for ZED miners.",
};

export default async function AdminWithdrawalsPage() {
  await requireAdmin();

  const res = await adminGetWithdrawals("all");

  return (
    <WithdrawalsQueueClient
      initialRequests={res.ok ? res.data : []}
      loadError={res.ok ? null : res.error}
    />
  );
}
