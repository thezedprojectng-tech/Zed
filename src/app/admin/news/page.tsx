import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetNewsPosts } from "@/lib/news/admin-actions";
import { AdminNewsClient } from "./AdminNewsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "News & updates — Admin Console | Zed",
  description: "Draft, publish, and manage community announcements, changelogs, and updates.",
};

export default async function AdminNewsPage() {
  await requireAdmin();
  const posts = await adminGetNewsPosts();

  return <AdminNewsClient initialPosts={posts} />;
}
