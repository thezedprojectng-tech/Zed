import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  getAdminReportedListings,
  getAdminAllListings,
} from "@/lib/market/admin-actions";
import { AdminMarketClient } from "./AdminMarketClient";
import type { MarketStatus } from "@/lib/market/types";

export const metadata: Metadata = {
  title: "Admin – Marketplace | Zed",
  description: "Review reported listings, remove or restore marketplace posts.",
};

interface SearchParams {
  tab?: string;
  page?: string;
  limit?: string;
  q?: string;
  status?: string;
}

export default async function AdminMarketPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();

  const params = await searchParams;

  const tab = params.tab === "all" ? "all" : "reported";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const limitRaw = parseInt(params.limit || "25", 10);
  const limit = [25, 50, 100].includes(limitRaw) ? limitRaw : 25;
  const q = params.q?.trim() || "";
  const statusRaw = params.status || "all";
  const statusFilter: MarketStatus | "all" = (["all", "active", "sold", "removed"] as const).includes(
    statusRaw as MarketStatus | "all"
  )
    ? (statusRaw as MarketStatus | "all")
    : "all";

  const [reportedListings, allResult] = await Promise.all([
    getAdminReportedListings(),
    tab === "all"
      ? getAdminAllListings({ search: q, status: statusFilter, page, limit })
      : getAdminAllListings({ limit: 1 }), // minimal fetch for non-active tab
  ]);

  const allListings = tab === "all" ? allResult.listings : [];
  const total = tab === "all" ? allResult.total : 0;
  const totalPages = tab === "all" ? allResult.totalPages : 0;

  return (
    <AdminMarketClient
      tab={tab}
      reportedListings={reportedListings}
      allListings={allListings}
      total={total}
      page={tab === "all" ? allResult.page : 1}
      totalPages={totalPages}
      limit={limit}
      searchQuery={q}
      statusFilter={statusFilter}
    />
  );
}
