import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetReferrals } from "@/lib/referrals/actions";
import { AdminReferralsClient } from "./AdminReferralsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Referrals & Invite System",
  description: "Configure rewards, review referral activity, and process pending rewards.",
};

export default async function AdminReferralsPage() {
  await requireAdmin();

  const res = await adminGetReferrals();

  return (
    <AdminReferralsClient
      initialData={res.ok ? res.data : null}
      loadError={res.ok ? null : res.error}
    />
  );
}
