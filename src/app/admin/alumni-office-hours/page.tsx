import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  adminGetAlumniApplications,
  adminGetAlumniProfiles,
} from "@/lib/alumni-office-hours/actions";
import { AdminAlumniClient } from "./AdminAlumniClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Alumni Office Hours | Zed Admin",
  description: "Review alumni applications and manage published alumni profiles.",
};

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    appStatus?: string;
    profileStatus?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminAlumniPage({ searchParams }: PageProps) {
  await requireAdmin();

  const sp = await searchParams;
  const tab = (sp.tab === "profiles" ? "profiles" : "applications") as "applications" | "profiles";
  const appStatus = sp.appStatus || "new";
  const profileStatus = sp.profileStatus || "all";
  const search = sp.search || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.pageSize || "25", 10) || 25));

  const [appsRes, profilesRes] = await Promise.all([
    adminGetAlumniApplications({
      page: tab === "applications" ? page : 1,
      pageSize,
      status: appStatus,
      search: tab === "applications" ? search : undefined,
    }),
    adminGetAlumniProfiles({
      page: tab === "profiles" ? page : 1,
      pageSize,
      status: profileStatus,
      search: tab === "profiles" ? search : undefined,
    }),
  ]);

  return (
    <AdminAlumniClient
      initialApplications={appsRes.data || []}
      initialAppsTotal={appsRes.total || 0}
      initialProfiles={profilesRes.data || []}
      initialProfilesTotal={profilesRes.total || 0}
      initialTab={tab}
      initialAppStatus={appStatus}
      initialProfileStatus={profileStatus}
      initialSearch={search}
      initialPage={page}
      initialPageSize={pageSize}
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


