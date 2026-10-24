"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  adminRemoveListingSchema,
  escapeSearchQuery,
} from "./validation";
import { mapMarketError } from "./helpers";
import type {
  MarketListing,
  MarketListingWithReports,
  MarketReport,
  MarketStatus,
} from "./types";

/**
 * Fetch all listings with report_count > 0 for the Admin moderation queue,
 * ordered newest first, with associated report items.
 */
export async function getAdminReportedListings(): Promise<MarketListingWithReports[]> {
  await requireAdmin();
  const admin = createAdminClient();

  // 1. Fetch listings with reports
  const { data: listings, error: listingsError } = await admin
    .from("market_listings")
    .select(
      "id, seller_id, seller_name_masked, title, description, category, price_ngn, condition, location, image_paths, status, removed_reason, created_at, updated_at, expires_at, report_count"
    )
    .gt("report_count", 0)
    .order("created_at", { ascending: false });

  if (listingsError || !listings || listings.length === 0) {
    return [];
  }

  const listingIds = listings.map((l) => l.id);

  // 2. Fetch reports for these listings
  const { data: reports, error: reportsError } = await admin
    .from("market_reports")
    .select("id, listing_id, reporter_id, reason, note, created_at")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false });

  if (reportsError || !reports) {
    return listings as MarketListingWithReports[];
  }

  const reportsByListingId: Record<string, MarketReport[]> = {};
  for (const r of reports) {
    if (!reportsByListingId[r.listing_id]) {
      reportsByListingId[r.listing_id] = [];
    }
    reportsByListingId[r.listing_id].push(r as MarketReport);
  }

  return listings.map((l) => ({
    ...l,
    reports: reportsByListingId[l.id] || [],
  })) as MarketListingWithReports[];
}

/**
 * Fetch all marketplace listings for admin management with filters and search.
 */
export async function getAdminAllListings(params: {
  search?: string;
  status?: MarketStatus | "all";
  page?: number;
  limit?: number;
} = {}): Promise<{
  listings: MarketListing[];
  total: number;
  page: number;
  totalPages: number;
}> {
  await requireAdmin();
  const admin = createAdminClient();

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("market_listings")
    .select(
      "id, seller_id, seller_name_masked, title, description, category, price_ngn, condition, location, image_paths, status, removed_reason, created_at, updated_at, expires_at, report_count",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.search && params.search.trim()) {
    const escaped = escapeSearchQuery(params.search);
    query = query.or(`title.ilike.%${escaped}%,location.ilike.%${escaped}%,seller_name_masked.ilike.%${escaped}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Error fetching admin market listings:", error);
    return { listings: [], total: 0, page: 1, totalPages: 0 };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    listings: (data as MarketListing[]) || [],
    total,
    page,
    totalPages,
  };
}

/**
 * Admin action to remove a listing with a mandatory reason.
 * Invokes admin_remove_listing RPC and logs to admin_audit_log.
 */
export async function adminRemoveListing(rawInput: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    const parsed = adminRemoveListingSchema.parse(rawInput);
    const supabase = await createClient();

    const { error } = await supabase.rpc("admin_remove_listing", {
      p_listing_id: parsed.listing_id,
      p_reason: parsed.reason,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    revalidatePath("/admin/market");
    revalidatePath("/market");
    revalidatePath(`/market/${parsed.listing_id}`);

    return { success: true };
  } catch (err) {
    return { success: false, error: mapMarketError(err) };
  }
}

/**
 * Admin action to restore a previously removed or reported listing.
 * Invokes admin_restore_listing RPC and logs to admin_audit_log.
 */
export async function adminRestoreListing(listingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase.rpc("admin_restore_listing", {
      p_listing_id: listingId,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    revalidatePath("/admin/market");
    revalidatePath("/market");
    revalidatePath(`/market/${listingId}`);

    return { success: true };
  } catch (err) {
    return { success: false, error: mapMarketError(err) };
  }
}
