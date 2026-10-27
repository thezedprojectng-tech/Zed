import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetContactMessages } from "@/lib/contact/actions";
import { AdminContactClient } from "./AdminContactClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Contact Inquiries Inbox",
  description: "Review, manage, reply to, and archive community inquiries sent through the Zed Contact portal.",
};

export default async function AdminContactPage() {
  await requireAdmin();

  const res = await adminGetContactMessages({
    status: "all",
    page: 1,
    pageSize: 15,
  });

  return (
    <AdminContactClient
      initialMessages={res.ok ? res.data || [] : []}
      initialTotal={res.ok ? res.total || 0 : 0}
      initialPage={1}
      initialPageSize={15}
      loadError={res.ok ? null : res.error}
    />
  );
}
