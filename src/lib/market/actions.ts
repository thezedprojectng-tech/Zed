"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createListingSchema,
  updateListingSchema,
  reportListingSchema,
  escapeSearchQuery,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  type CreateListingInput,
  type UpdateListingInput,
  type ReportListingInput,
} from "./validation";
import { mapMarketError } from "./helpers";
import type { MarketFilterParams, MarketListing } from "./types";

/**
 * Fetch marketplace listings for the public/authenticated feed.
 * Never exposes seller's phone or email; only displays seller_name_masked.
 */
export async function getListings(params: MarketFilterParams = {}): Promise<{
  listings: MarketListing[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const supabase = await createClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 12));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("market_listings")
    .select(
      "id, seller_id, seller_name_masked, title, description, category, price_ngn, condition, location, image_paths, status, removed_reason, created_at, updated_at, expires_at, report_count, seller_verified",
      { count: "exact" }
    )
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }

  if (params.search && params.search.trim()) {
    const escaped = escapeSearchQuery(params.search);
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%,location.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching market listings:", error);
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
 * Fetch a single listing by its ID.
 */
export async function getListingById(id: string): Promise<MarketListing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("market_listings")
    .select(
      "id, seller_id, seller_name_masked, title, description, category, price_ngn, condition, location, image_paths, status, removed_reason, created_at, updated_at, expires_at, report_count, seller_verified"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as MarketListing;
}

/**
 * Fetch all listings created by the currently signed-in seller.
 */
export async function getMyListings(): Promise<MarketListing[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("market_listings")
    .select(
      "id, seller_id, seller_name_masked, title, description, category, price_ngn, condition, location, image_paths, status, removed_reason, created_at, updated_at, expires_at, report_count, seller_verified"
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as MarketListing[];
}

/**
 * Create a new listing via the create_listing SECURITY DEFINER RPC.
 */
export async function createListing(rawInput: unknown): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  try {
    const parsed = createListingSchema.parse(rawInput);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_listing", {
      p_title: parsed.title,
      p_description: parsed.description,
      p_category: parsed.category,
      p_price_ngn: parsed.price_ngn,
      p_condition: parsed.condition,
      p_location: parsed.location,
      p_image_paths: parsed.image_paths,
      p_contact_whatsapp: parsed.contact_whatsapp || null,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    revalidatePath("/market");
    revalidatePath("/market/mine");

    const result = data as { success: boolean; id: string };
    return { success: true, id: result.id };
  } catch (err: unknown) {
    return { success: false, error: mapMarketError(err) };
  }
}

/**
 * Update an existing listing via the update_listing SECURITY DEFINER RPC.
 */
export async function updateListing(
  listingId: string,
  rawInput: unknown
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const parsed = updateListingSchema.parse(rawInput);
    const supabase = await createClient();

    const { error } = await supabase.rpc("update_listing", {
      p_listing_id: listingId,
      p_title: parsed.title,
      p_description: parsed.description,
      p_category: parsed.category,
      p_price_ngn: parsed.price_ngn,
      p_condition: parsed.condition,
      p_location: parsed.location,
      p_image_paths: parsed.image_paths,
      p_contact_whatsapp: parsed.contact_whatsapp || null,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    revalidatePath("/market");
    revalidatePath(`/market/${listingId}`);
    revalidatePath("/market/mine");

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: mapMarketError(err) };
  }
}

/**
 * Mark a listing as sold via the mark_listing_sold RPC.
 */
export async function markListingSold(listingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("mark_listing_sold", {
      p_listing_id: listingId,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    revalidatePath("/market");
    revalidatePath(`/market/${listingId}`);
    revalidatePath("/market/mine");

    return { success: true };
  } catch (err) {
    return { success: false, error: mapMarketError(err) };
  }
}

/**
 * Delete (or soft-delete if reports exist) via delete_my_listing RPC.
 */
export async function deleteMyListing(listingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_my_listing", {
      p_listing_id: listingId,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    revalidatePath("/market");
    revalidatePath("/market/mine");

    return { success: true };
  } catch (err) {
    return { success: false, error: mapMarketError(err) };
  }
}

/**
 * Report a listing via report_listing RPC.
 */
export async function reportListing(rawInput: unknown): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const parsed = reportListingSchema.parse(rawInput);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("report_listing", {
      p_listing_id: parsed.listing_id,
      p_reason: parsed.reason,
      p_note: parsed.note || null,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    revalidatePath(`/market/${parsed.listing_id}`);
    const res = data as { message?: string };
    return { success: true, message: res?.message };
  } catch (err) {
    return { success: false, error: mapMarketError(err) };
  }
}

/**
 * Reveal the seller's WhatsApp number (verified users only; max 30 reveals / 24h).
 */
export async function getListingContact(listingId: string): Promise<{
  success: boolean;
  has_contact: boolean;
  whatsapp?: string | null;
  seller_verified?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_listing_contact", {
      p_listing_id: listingId,
    });

    if (error) {
      return { success: false, has_contact: false, error: mapMarketError(error) };
    }

    const res = data as {
      success: boolean;
      has_contact: boolean;
      whatsapp: string | null;
      seller_verified?: boolean;
      message?: string;
    };

    return {
      success: res.success,
      has_contact: res.has_contact,
      whatsapp: res.whatsapp,
      seller_verified: Boolean(res.seller_verified),
    };
  } catch (err) {
    return { success: false, has_contact: false, error: mapMarketError(err) };
  }
}

/**
 * Retrieve the seller's own saved WhatsApp contact for the edit form.
 */
export async function getMyListingContact(listingId: string): Promise<{
  success: boolean;
  whatsapp?: string | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_my_listing_contact", {
      p_listing_id: listingId,
    });

    if (error) {
      return { success: false, error: mapMarketError(error) };
    }

    const res = data as { success: boolean; whatsapp: string | null };
    return { success: true, whatsapp: res.whatsapp };
  } catch (err) {
    return { success: false, error: mapMarketError(err) };
  }
}

/**
 * Upload an image to the private market-images Supabase Storage bucket.
 * Enforces authenticated session, max 2MB, allowed MIME types, and folder prefix.
 */
export async function uploadListingImage(formData: FormData): Promise<{
  success: boolean;
  path?: string;
  error?: string;
}> {
  let file: File | null = null;
  let storagePath: string | null = null;
  try {
    file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided" };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: "Image size exceeds the 2 MB limit" };
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Only JPEG, PNG, and WebP images are allowed",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError) {
        console.error("[market] upload failed", {
          path: null,
          bucket: "market-images",
          type: file.type,
          size: file.size,
          error: {
            message: userError.message,
            statusCode: (userError as { status?: number }).status,
            error: userError.name,
          },
        });
      }
      return { success: false, error: "Please sign in to upload images" };
    }

    // Determine extension: jpg, png, or webp
    let ext = "jpg";
    if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
      ext = "png";
    } else if (file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp")) {
      ext = "webp";
    } else {
      ext = "jpg";
    }

    storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    console.log("[market] upload path:", storagePath);

    const { error: uploadError } = await supabase.storage
      .from("market-images")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      const rawError = {
        message: uploadError.message,
        statusCode: (uploadError as { statusCode?: string | number }).statusCode,
        error: (uploadError as { error?: string }).error || (uploadError as { code?: string }).code || uploadError.name,
      };
      console.error("[market] upload failed", {
        path: storagePath,
        bucket: "market-images",
        type: file.type,
        size: file.size,
        error: rawError,
      });
      return {
        success: false,
        error: `Image upload failed: ${uploadError.message || rawError.error || "Unknown storage error"}`,
      };
    }

    return { success: true, path: storagePath };
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: string | number; error?: string };
    const rawError = {
      message: errorObj?.message || (err instanceof Error ? err.message : String(err)),
      statusCode: errorObj?.statusCode,
      error: errorObj?.error || (err instanceof Error ? err.name : undefined),
    };
    console.error("[market] upload failed", {
      path: storagePath,
      bucket: "market-images",
      type: file?.type,
      size: file?.size,
      error: rawError,
    });
    return {
      success: false,
      error: `Image upload failed: ${rawError.message || "Unknown error"}`,
    };
  }
}

