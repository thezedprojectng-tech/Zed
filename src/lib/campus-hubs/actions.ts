"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  saveCampusHubSchema,
  type SaveCampusHubInput,
} from "./validation";
import type { CampusHub, CampusHubStatus, ActionResult } from "./types";

/**
 * Admin action: Fetch campus hubs with optional filters.
 */
export async function adminGetCampusHubs(options?: {
  status?: string;
  search?: string;
  state?: string;
}): Promise<ActionResult<CampusHub[]>> {
  await requireAdmin();

  const supabase = await createClient();

  try {
    let query = supabase
      .from("campus_hubs")
      .select("*");

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options?.state && options.state !== "all") {
      query = query.eq("state", options.state);
    }

    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().replace(/[%_]/g, "");
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,state.ilike.%${q}%`);
    }

    query = query.order("name", { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error("[Admin Campus Hubs] Query error:", error);
      return { ok: false, error: "Failed to load campus hubs" };
    }

    return {
      ok: true,
      data: (data || []) as CampusHub[],
    };
  } catch (err) {
    console.error("[Admin Campus Hubs] Unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while loading campus hubs" };
  }
}

/**
 * Admin action: Create or update a campus hub via RPC.
 */
export async function adminSaveCampusHub(
  rawInput: SaveCampusHubInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();

  const parsed = saveCampusHubSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      error: "Please correct the highlighted errors.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  try {
    const { data: rpcData, error } = await supabase.rpc("admin_save_campus_hub", {
      p_id: data.id || null,
      p_slug: data.slug,
      p_name: data.name,
      p_state: data.state,
      p_summary: data.summary || null,
      p_clearance_guide: data.clearance_guide || null,
      p_hostel_guide: data.hostel_guide || null,
      p_departments_guide: data.departments_guide || null,
    });

    if (error) {
      console.error("[Admin Campus Hubs] Save error:", error);
      return { ok: false, error: error.message || "Failed to save campus hub" };
    }

    revalidatePath("/campus-hubs");
    revalidatePath(`/campus-hubs/${data.slug}`);
    revalidatePath("/admin/campus-hubs");

    return {
      ok: true,
      data: rpcData as { id: string; slug: string },
    };
  } catch (err) {
    console.error("[Admin Campus Hubs] Save unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while saving the campus hub" };
  }
}

/**
 * Admin action: Update the status of a campus hub via RPC.
 */
export async function adminSetCampusHubStatus(
  id: string,
  status: CampusHubStatus
): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("admin_set_campus_hub_status", {
      p_id: id,
      p_status: status,
    });

    if (error) {
      console.error("[Admin Campus Hubs] Status update error:", error);
      return { ok: false, error: error.message || "Failed to update status" };
    }

    revalidatePath("/campus-hubs");
    revalidatePath("/admin/campus-hubs");

    return { ok: true };
  } catch (err) {
    console.error("[Admin Campus Hubs] Status update unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while updating status" };
  }
}

/**
 * Admin action: Delete a campus hub via RPC.
 */
export async function adminDeleteCampusHub(id: string): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("admin_delete_campus_hub", {
      p_id: id,
    });

    if (error) {
      console.error("[Admin Campus Hubs] Delete error:", error);
      return { ok: false, error: error.message || "Failed to delete campus hub" };
    }

    revalidatePath("/campus-hubs");
    revalidatePath("/admin/campus-hubs");

    return { ok: true };
  } catch (err) {
    console.error("[Admin Campus Hubs] Delete unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while deleting the campus hub" };
  }
}

