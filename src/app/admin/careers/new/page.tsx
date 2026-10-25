import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { AdminCareerFormClient } from "@/components/admin/careers/AdminCareerFormClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — New Career Role",
  description: "Create and publish a new career opportunity at Zed.",
};

export default async function AdminNewCareerRolePage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl mx-auto py-2">
      <AdminCareerFormClient mode="create" />
    </div>
  );
}
