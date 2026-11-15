import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetNewsPostById } from "@/lib/news/admin-actions";
import { AdminNewsFormClient } from "@/components/admin/news/AdminNewsFormClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit post — News Admin | Zed",
  description: "Edit article content, publish status, or summary.",
};

export default async function AdminNewsEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const post = await adminGetNewsPostById(id);
  if (!post) {
    notFound();
  }

  return <AdminNewsFormClient mode="edit" initialPost={post} />;
}
