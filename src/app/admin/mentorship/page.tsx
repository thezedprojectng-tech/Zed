import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetMentorshipApplications } from "@/lib/mentorship/actions";
import { AdminMentorshipClient } from "./AdminMentorshipClient";

export const metadata = {
  title: "Mentorship Applications | Zed Admin",
  description: "Review and manage mentorship applications.",
};

export default async function AdminMentorshipPage() {
  await requireAdmin();

  const res = await adminGetMentorshipApplications({
    page: 1,
    pageSize: 20,
    status: "all",
  });

  return (
    <AdminMentorshipClient
      initialApplications={res.data || []}
      initialTotal={res.total || 0}
      initialPage={1}
      initialPageSize={20}
      loadError={res.ok ? null : res.error || "Failed to load applications"}
    />
  );
}

