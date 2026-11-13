import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetContactMessages, adminGetContactUnreadCount } from "@/lib/contact/actions";
import { AdminContactClient } from "./AdminContactClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Contact Inbox",
  description: "Review, manage, reply to, and archive community inquiries sent through the Zed Contact portal.",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
    page?: string;
    id?: string;
  }>;
}

export default async function AdminContactPage({ searchParams }: PageProps) {
  await requireAdmin();

  const sp = await searchParams;
  const status = sp.status || "all";
  const search = sp.search || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = 25;

  const [res, unreadCount] = await Promise.all([
    adminGetContactMessages({
      status,
      search,
      page,
      pageSize,
    }),
    adminGetContactUnreadCount(),
  ]);

  return (
    <AdminContactClient
      initialMessages={res.ok ? res.data || [] : []}
      initialTotal={res.ok ? res.total || 0 : 0}
      initialPage={page}
      initialPageSize={pageSize}
      initialUnreadCount={unreadCount}
      initialSelectedId={sp.id || null}
      loadError={res.ok ? null : res.error}
    />
  );
}
