import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { AdminNewsFormClient } from "@/components/admin/news/AdminNewsFormClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New post — News Admin | Zed",
  description: "Create and publish a new platform announcement or update.",
};

export default async function AdminNewsNewPage() {
  await requireAdmin();

  return <AdminNewsFormClient mode="create" />;
}
