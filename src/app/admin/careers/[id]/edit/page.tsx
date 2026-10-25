import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetRoleById } from "@/lib/careers/admin-actions";
import { AdminCareerFormClient } from "@/components/admin/careers/AdminCareerFormClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const role = await adminGetRoleById(id);

  return {
    title: role ? `Edit ${role.title} — Admin Console` : "Edit Career Role",
  };
}

export default async function AdminEditCareerRolePage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const role = await adminGetRoleById(id);

  if (!role) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-2">
      <AdminCareerFormClient mode="edit" initialRole={role} />
    </div>
  );
}
