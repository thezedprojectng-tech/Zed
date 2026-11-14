import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetCampusHubs } from "@/lib/campus-hubs/actions";
import { AdminCampusHubsClient } from "./AdminCampusHubsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Campus Hubs Moderation | Zed Admin",
  description: "Create, edit, and publish university campus guides.",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    state?: string;
    search?: string;
  }>;
}

export default async function AdminCampusHubsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const sp = await searchParams;
  const status = sp.status || "all";
  const state = sp.state || "all";
  const search = sp.search || "";

  const res = await adminGetCampusHubs({
    status,
    state,
    search,
  });

  return (
    <div className="w-full space-y-6">
      <AdminCampusHubsClient
        initialHubs={res.data || []}
        initialStatus={status}
        initialState={state}
        initialSearch={search}
        loadError={res.ok ? null : res.error || "Failed to load campus hubs"}
      />
    </div>
  );
}


