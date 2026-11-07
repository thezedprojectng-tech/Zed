import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetBankVerifications } from "./actions";
import { AdminVerificationsClient } from "./AdminVerificationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Bank Verifications Queue",
  description: "Review and approve citizen bank account verifications.",
};

export default async function AdminVerificationsPage() {
  await requireAdmin();

  const res = await adminGetBankVerifications("all");

  return (
    <AdminVerificationsClient
      initialRequests={res.ok ? res.data : []}
      loadError={res.ok ? null : res.error}
    />
  );
}

