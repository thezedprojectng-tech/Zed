import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetRoles } from "@/lib/careers/admin-actions";
import { AdminCareersClient } from "./AdminCareersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Careers & Job Openings",
  description: "Manage public career opportunities, status, and job specifications.",
};

export default async function AdminCareersPage() {
  await requireAdmin();
  const roles = await adminGetRoles();

  return (
    <div className="max-w-6xl mx-auto py-2">
      <AdminCareersClient initialRoles={roles} />
    </div>
  );
}
