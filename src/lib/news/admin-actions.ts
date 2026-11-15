"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  newsPostSchema,
  type NewsPostInput,
} from "./validation";
import type { NewsPost, NewsPostListItem, NewsStatus } from "./types";

export type AdminActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Fetch all news posts for the admin list view.
 */
export async function adminGetNewsPosts(): Promise<NewsPostListItem[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news_posts")
    .select("id, slug, title, summary, category, status, pinned, published_at, created_at, updated_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("adminGetNewsPosts error:", error);
    return [];
  }

  return data as NewsPostListItem[];
}

/**
 * Fetch a single news post by ID with full markdown body for editing.
 */
export async function adminGetNewsPostById(id: string): Promise<NewsPost | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news_posts")
    .select("id, slug, title, summary, body_md, category, status, pinned, published_at, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as NewsPost;
}

/**
 * Save (create or update) a news post directly with the user-session Supabase client.
 * Database trigger automatically handles publishing timestamp, broadcast notification, and audit row.
 */
export async function adminSaveNewsPostAction(rawInput: unknown): Promise<AdminActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    const parsed = newsPostSchema.parse(rawInput);
    const supabase = await createClient();

    if (parsed.id) {
      // Update
      const { data, error } = await supabase
        .from("news_posts")
        .update({
          slug: parsed.slug,
          title: parsed.title,
          summary: parsed.summary,
          body_md: parsed.body_md,
          category: parsed.category,
          status: parsed.status,
          pinned: parsed.pinned,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsed.id)
        .select("id, slug")
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      revalidatePath("/admin/news");
      revalidatePath(`/admin/news/${parsed.id}/edit`);
      revalidatePath("/news");
      revalidatePath(`/news/${parsed.slug}`);

      return { ok: true, data: { id: data.id, slug: data.slug } };
    } else {
      // Create
      const { data, error } = await supabase
        .from("news_posts")
        .insert({
          slug: parsed.slug,
          title: parsed.title,
          summary: parsed.summary,
          body_md: parsed.body_md,
          category: parsed.category,
          status: parsed.status,
          pinned: parsed.pinned,
        })
        .select("id, slug")
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      revalidatePath("/admin/news");
      revalidatePath("/news");

      return { ok: true, data: { id: data.id, slug: data.slug } };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save news post";
    return { ok: false, error: message };
  }
}

/**
 * Quick status update (e.g. publish or archive) from list or row menu.
 */
export async function adminSetNewsStatusAction(
  id: string,
  newStatus: NewsStatus
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("news_posts")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/news");
    revalidatePath(`/admin/news/${id}/edit`);
    revalidatePath("/news");

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update news post status";
    return { ok: false, error: message };
  }
}

/**
 * Delete a news post.
 */
export async function adminDeleteNewsPostAction(id: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("news_posts")
      .delete()
      .eq("id", id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/news");
    revalidatePath("/news");

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete news post";
    return { ok: false, error: message };
  }
}
