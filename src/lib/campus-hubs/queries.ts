import { createClient } from "@supabase/supabase-js";
import type { CampusHub } from "./types";

function getStaticAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Fetch all published campus hubs using the static anon client.
 * Ordered alphabetically by name.
 */
export async function getPublishedCampusHubs(): Promise<CampusHub[]> {
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("campus_hubs")
      .select("*")
      .eq("status", "published")
      .order("name", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as CampusHub[];
  } catch {
    return [];
  }
}

/**
 * Fetch a single published campus hub by unique slug.
 */
export async function getPublishedCampusHubBySlug(slug: string): Promise<CampusHub | null> {
  if (!slug) return null;
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("campus_hubs")
      .select("*")
      .eq("slug", slug.toLowerCase().trim())
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as CampusHub;
  } catch {
    return null;
  }
}

/**
 * Fetch minimal metadata of published hubs for sitemap generation.
 */
export async function getPublishedCampusHubsForSitemap(): Promise<
  Array<{ slug: string; published_at?: string | null; updated_at: string }>
> {
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("campus_hubs")
      .select("slug, published_at, updated_at")
      .eq("status", "published");

    if (error || !data) {
      return [];
    }

    return data as Array<{ slug: string; published_at?: string | null; updated_at: string }>;
  } catch {
    return [];
  }
}

