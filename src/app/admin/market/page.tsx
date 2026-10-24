import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  getAdminReportedListings,
  getAdminAllListings,
} from "@/lib/market/admin-actions";
import { AdminMarketClient } from "./AdminMarketClient";

export const metadata: Metadata = {
  title: "Admin – Market Moderation | Zed",
  description: "Review reported listings, remove or restore marketplace posts.",
};

export default async function AdminMarketPage() {
  await requireAdmin();

  const [reportedListings, { listings: allListings }] = await Promise.all([
    getAdminReportedListings(),
    getAdminAllListings({ limit: 100 }),
  ]);

  return (
    <AdminMarketClient
      reportedListings={reportedListings}
      allListings={allListings}
    />
  );
}
