import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetRoles } from "@/lib/careers/admin-actions";
import { AdminCareersClient } from "./AdminCareersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Careers — Admin Console",
  description: "Manage public career opportunities, roles, status and specifications.",
};

export default async function AdminCareersPage() {
  await requireAdmin();
  const roles = await adminGetRoles();

  return <AdminCareersClient initialRoles={roles} />;
}
