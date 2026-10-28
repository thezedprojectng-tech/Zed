import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetAmbassadorApplications } from "@/lib/ambassadors/actions";
import { AdminAmbassadorsClient } from "./AdminAmbassadorsClient";

export const metadata = {
  title: "Ambassador Applications | Zed Admin",
  description: "Review and manage campus ambassador applications.",
};

export default async function AdminAmbassadorsPage() {
  await requireAdmin();

  const res = await adminGetAmbassadorApplications({
    page: 1,
    pageSize: 20,
    status: "all",
  });

  return (
    <AdminAmbassadorsClient
      initialApplications={res.data || []}
      initialTotal={res.total || 0}
      initialPage={1}
      initialPageSize={20}
      loadError={res.ok ? null : res.error || "Failed to load applications"}
    />
  );
}

