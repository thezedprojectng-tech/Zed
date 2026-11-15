import { createClient } from "@/lib/supabase/server";
import type { NewsPost } from "./types";

export interface PublicNewsPostListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: "news" | "update" | "announcement";
  pinned: boolean;
  published_at: string;
}

/**
 * Fetch all published news posts for public display.
 */
export async function getPublicNewsPosts(category?: string): Promise<PublicNewsPostListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("news_posts")
    .select("id, slug, title, summary, category, pinned, published_at")
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("getPublicNewsPosts error:", error);
    return [];
  }

  return data as PublicNewsPostListItem[];
}

/**
 * Fetch a single published news post by slug for reading.
 */
export async function getPublicNewsPostBySlug(slug: string): Promise<NewsPost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news_posts")
    .select("id, slug, title, summary, body_md, category, status, pinned, published_at, created_at, updated_at")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as NewsPost;
}
