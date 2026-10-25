"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import type { CareerRoleRow, CareerRoleStatus } from "@/data/careers";
import {
  careerRoleSchema,
  mapAdminCareerError,
  type CareerRoleInput,
} from "./validation";

export type AdminActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Fetch all career roles for the admin console table.
 */
export async function adminGetRoles(): Promise<CareerRoleRow[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_roles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as CareerRoleRow[];
}

/**
 * Fetch a single career role by ID for admin editing.
 */
export async function adminGetRoleById(id: string): Promise<CareerRoleRow | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_roles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CareerRoleRow;
}

/**
 * Save (create or update) a career role via the admin RPC.
 */
export async function adminSaveRoleAction(params: {
  id?: string | null;
  input: CareerRoleInput;
}): Promise<AdminActionResult<{ role_id: string; slug: string }>> {
  await requireAdmin();

  const parsed = careerRoleSchema.safeParse(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_save_career_role", {
      p_id: params.id ?? null,
      p_title: parsed.data.title,
      p_slug: parsed.data.slug,
      p_department: parsed.data.department,
      p_location: parsed.data.location,
      p_type: parsed.data.type,
      p_featured: parsed.data.featured,
      p_summary: parsed.data.summary,
      p_about: parsed.data.about,
      p_responsibilities: parsed.data.responsibilities,
      p_requirements: parsed.data.requirements,
      p_nice_to_have: parsed.data.nice_to_have,
    });

    if (error) {
      return { ok: false, error: mapAdminCareerError(error) };
    }

    revalidatePath("/careers");
    revalidatePath(`/careers/${parsed.data.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/careers");

    return {
      ok: true,
      data: data as { role_id: string; slug: string },
    };
  } catch (err) {
    return { ok: false, error: mapAdminCareerError(err) };
  }
}

/**
 * Transition a role's status ('draft' | 'published' | 'closed').
 */
export async function adminSetRoleStatusAction(params: {
  roleId: string;
  status: CareerRoleStatus;
  slug?: string;
}): Promise<AdminActionResult<{ status: CareerRoleStatus; posted_at?: string }>> {
  await requireAdmin();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_set_career_status", {
      p_role_id: params.roleId,
      p_status: params.status,
    });

    if (error) {
      return { ok: false, error: mapAdminCareerError(error) };
    }

    revalidatePath("/careers");
    if (params.slug) {
      revalidatePath(`/careers/${params.slug}`);
    }
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/careers");

    return {
      ok: true,
      data: data as { status: CareerRoleStatus; posted_at?: string },
    };
  } catch (err) {
    return { ok: false, error: mapAdminCareerError(err) };
  }
}

/**
 * Delete a career role.
 */
export async function adminDeleteRoleAction(params: {
  roleId: string;
  slug?: string;
}): Promise<AdminActionResult> {
  await requireAdmin();

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_delete_career_role", {
      p_role_id: params.roleId,
    });

    if (error) {
      return { ok: false, error: mapAdminCareerError(error) };
    }

    revalidatePath("/careers");
    if (params.slug) {
      revalidatePath(`/careers/${params.slug}`);
    }
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/careers");

    return { ok: true };
  } catch (err) {
    return { ok: false, error: mapAdminCareerError(err) };
  }
}
