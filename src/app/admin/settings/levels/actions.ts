"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { validateLevelRules, type LevelRule } from "@/lib/levels/validation";

export interface LevelRequirementRow {
  id: number;
  level_id: 2 | 3 | 4 | 5;
  requirement_type: "total_mined" | "mining_days" | "verified_referrals" | "completed_courses";
  threshold: number;
  created_at: string;
  updated_at: string;
}

export interface PromotionPreviewItem {
  to_level: number;
  user_count: number;
}

/**
 * Fetch all configured level requirements
 */
export async function adminGetLevelRequirements(): Promise<
  | { ok: true; rules: LevelRequirementRow[] }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("level_requirements")
      .select("id, level_id, requirement_type, threshold, created_at, updated_at")
      .order("level_id", { ascending: true })
      .order("requirement_type", { ascending: true });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, rules: (data ?? []) as LevelRequirementRow[] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load level rules",
    };
  }
}

/**
 * Save new level requirements via admin RPC
 */
export async function adminSaveLevelRequirementsAction(
  rawRules: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();

    const validation = validateLevelRules(rawRules);
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_save_level_requirements", {
      p_rules: validation.data,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/settings/levels");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save level rules",
    };
  }
}

/**
 * Dry-run preview of promotions
 */
export async function adminPreviewPromotionsAction(): Promise<
  | { ok: true; results: PromotionPreviewItem[] }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "admin_recalculate_user_levels",
      { p_dry_run: true }
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      results: (data ?? []) as PromotionPreviewItem[],
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to preview promotions",
    };
  }
}

/**
 * Apply promotions immediately (dry_run = false)
 */
export async function adminApplyPromotionsAction(): Promise<
  | { ok: true; results: PromotionPreviewItem[] }
  | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "admin_recalculate_user_levels",
      { p_dry_run: false }
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/settings/levels");
    revalidatePath("/admin/users");
    return {
      ok: true,
      results: (data ?? []) as PromotionPreviewItem[],
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to apply promotions",
    };
  }
}

