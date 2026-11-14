import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetMentorshipApplications } from "@/lib/mentorship/actions";
import { AdminMentorshipClient } from "./AdminMentorshipClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Mentorship Applications | Zed Admin",
  description: "Review and manage mentorship applications.",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function AdminMentorshipPage({ searchParams }: PageProps) {
  await requireAdmin();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || "25", 10) || 25));
  const status = sp.status || "new";
  const search = sp.search || "";

  const res = await adminGetMentorshipApplications({
    page,
    pageSize,
    status,
    search,
  });

  return (
    <AdminMentorshipClient
      initialApplications={res.data || []}
      initialTotal={res.total || 0}
      initialPage={page}
      initialPageSize={pageSize}
      initialStatus={status}
      initialSearch={search}
      loadError={res.ok ? null : res.error || "Failed to load applications"}
    />
  );
}


