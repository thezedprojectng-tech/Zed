"use server";

// ─── CDS Logger – Server Actions ──────────────────────────────────────────────
// Uses the Supabase server client (anon key + RLS). Never uses service-role key.
// All mutations go through the shared Zod schema for validation.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cdsLogSchema } from "@/lib/cds/helpers";
import type { CdsLog } from "@/types/cds";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/nav/nysc/cds");
  return { supabase, userId: user.id };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all CDS logs for the currently signed-in user, newest first.
 */
export async function fetchCdsLogs(): Promise<
  { logs: CdsLog[] } | { error: string }
> {
  try {
    const { supabase, userId } = await requireUser();

    const { data, error } = await supabase
      .from("cds_logs")
      .select("id, user_id, session_date, group_name, activity, hours, notes, created_at")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchCdsLogs] Supabase error:", error.message);
      return { error: "Could not load your CDS logs. Please try again." };
    }

    return { logs: (data as CdsLog[]) ?? [] };
  } catch (err) {
    console.error("[fetchCdsLogs] Unexpected error:", err);
    return { error: "An unexpected error occurred." };
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Insert a new CDS log for the current user.
 * Validates input on the server via Zod before inserting.
 */
export async function createCdsLog(
  raw: unknown
): Promise<{ log: CdsLog } | { error: string; fieldErrors?: Record<string, string[]> }> {
  const parsed = cdsLogSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, errs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key] = errs ?? [];
    }
    return { error: "Validation failed. Please check your inputs.", fieldErrors };
  }

  try {
    const { supabase, userId } = await requireUser();
    const { session_date, group_name, activity, hours, notes } = parsed.data;

    const { data, error } = await supabase
      .from("cds_logs")
      .insert({
        user_id: userId,
        session_date,
        group_name,
        activity,
        hours,
        notes: notes ?? null,
      })
      .select("id, user_id, session_date, group_name, activity, hours, notes, created_at")
      .single();

    if (error) {
      console.error("[createCdsLog] Supabase error:", error.message);
      return { error: "Failed to save your CDS log. Please try again." };
    }

    revalidatePath("/nav/nysc/cds");
    return { log: data as CdsLog };
  } catch (err) {
    console.error("[createCdsLog] Unexpected error:", err);
    return { error: "An unexpected error occurred." };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * Update an existing CDS log owned by the current user.
 */
export async function updateCdsLog(
  id: string,
  raw: unknown
): Promise<{ log: CdsLog } | { error: string; fieldErrors?: Record<string, string[]> }> {
  if (!id || typeof id !== "string") {
    return { error: "Invalid log ID." };
  }

  const parsed = cdsLogSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, errs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key] = errs ?? [];
    }
    return { error: "Validation failed. Please check your inputs.", fieldErrors };
  }

  try {
    const { supabase, userId } = await requireUser();
    const { session_date, group_name, activity, hours, notes } = parsed.data;

    const { data, error } = await supabase
      .from("cds_logs")
      .update({ session_date, group_name, activity, hours, notes: notes ?? null })
      .eq("id", id)
      .eq("user_id", userId) // RLS + extra safety
      .select("id, user_id, session_date, group_name, activity, hours, notes, created_at")
      .single();

    if (error) {
      console.error("[updateCdsLog] Supabase error:", error.message);
      return { error: "Failed to update your CDS log. Please try again." };
    }

    revalidatePath("/nav/nysc/cds");
    return { log: data as CdsLog };
  } catch (err) {
    console.error("[updateCdsLog] Unexpected error:", err);
    return { error: "An unexpected error occurred." };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a CDS log owned by the current user.
 */
export async function deleteCdsLog(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!id || typeof id !== "string") {
    return { success: false, error: "Invalid log ID." };
  }

  try {
    const { supabase, userId } = await requireUser();

    const { error } = await supabase
      .from("cds_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[deleteCdsLog] Supabase error:", error.message);
      return { success: false, error: "Failed to delete the log. Please try again." };
    }

    revalidatePath("/nav/nysc/cds");
    return { success: true };
  } catch (err) {
    console.error("[deleteCdsLog] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
