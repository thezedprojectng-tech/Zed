import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetCampusHubs } from "@/lib/campus-hubs/actions";
import { AdminCampusHubsClient } from "./AdminCampusHubsClient";

export const metadata: Metadata = {
  title: "Campus Hubs Moderation | Zed Admin",
  description: "Create, edit, and publish university campus guides.",
};

export default async function AdminCampusHubsPage() {
  await requireAdmin();

  const res = await adminGetCampusHubs({ status: "all" });

  return (
    <div className="w-full space-y-6">
      <AdminCampusHubsClient
        initialHubs={res.data || []}
        loadError={res.ok ? null : res.error || "Failed to load campus hubs"}
      />
    </div>
  );
}

