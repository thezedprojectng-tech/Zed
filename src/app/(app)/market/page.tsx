import { Metadata } from "next";
import { getListings } from "@/lib/market/actions";
import { MarketFeedClient } from "./MarketFeedClient";
import type { MarketCategory } from "@/lib/market/types";

export const metadata: Metadata = {
  title: "Zed Market | Peer-to-Peer Classifieds",
  description:
    "Direct peer-to-peer marketplace listings for verified Nigerian youth. Connect with sellers on WhatsApp for phones, books, services, and essentials.",
};

interface MarketPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function MarketPage({ searchParams }: MarketPageProps) {
  const resolvedParams = await searchParams;
  const category = (resolvedParams.category as MarketCategory | "all") || "all";
  const search = resolvedParams.search || "";
  const page = parseInt(resolvedParams.page || "1", 10) || 1;

  const { listings, total, totalPages } = await getListings({
    category,
    search,
    page,
    limit: 12,
  });

  return (
    <MarketFeedClient
      initialListings={listings}
      total={total}
      currentPage={page}
      totalPages={totalPages}
      currentCategory={category}
      currentSearch={search}
    />
  );
}
