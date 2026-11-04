import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  adminGetAlumniApplications,
  adminGetAlumniProfiles,
} from "@/lib/alumni-office-hours/actions";
import { AdminAlumniClient } from "./AdminAlumniClient";

export const metadata = {
  title: "Alumni Office Hours | Zed Admin",
  description: "Review alumni applications and manage published alumni profiles.",
};

export default async function AdminAlumniPage() {
  await requireAdmin();

  const [appsRes, profilesRes] = await Promise.all([
    adminGetAlumniApplications({ page: 1, pageSize: 20, status: "all" }),
    adminGetAlumniProfiles({ page: 1, pageSize: 20, status: "all" }),
  ]);

  return (
    <AdminAlumniClient
      initialApplications={appsRes.data || []}
      initialAppsTotal={appsRes.total || 0}
      initialProfiles={profilesRes.data || []}
      initialProfilesTotal={profilesRes.total || 0}
      loadError={
        !appsRes.ok
          ? appsRes.error || "Failed to load alumni applications"
          : !profilesRes.ok
            ? profilesRes.error || "Failed to load alumni profiles"
            : null
      }
    />
  );
}

