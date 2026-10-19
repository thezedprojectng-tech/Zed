import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetFundingSubmissions } from "@/lib/funding/actions";
import { AdminFundingClient } from "./AdminFundingClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Idea Funding Submissions",
  description: "Review, evaluate, and track pitches submitted to the Zed Innovation & Pitch Fund.",
};

export default async function AdminFundingPage() {
  await requireAdmin();

  const res = await adminGetFundingSubmissions({ status: "all" });

  return (
    <AdminFundingClient
      initialSubmissions={res.ok ? res.data || [] : []}
      loadError={res.ok ? null : res.error}
    />
  );
}
