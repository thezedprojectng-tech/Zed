import { createClient } from "@supabase/supabase-js";
import type { AlumniProfileRow } from "./types";

export const revalidate = 60; // ISR cache 60 seconds

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
 * Fetch all published alumni profiles using the static anon client.
 * Ordered by published_at DESC.
 */
export async function getPublishedAlumniProfiles(): Promise<AlumniProfileRow[]> {
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("alumni_profiles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as AlumniProfileRow[];
  } catch {
    return [];
  }
}

/**
 * Fetch a single published alumni profile by ID using the static anon client.
 * Returns null if not found or not published.
 */
export async function getPublishedAlumniProfileById(
  id: string
): Promise<AlumniProfileRow | null> {
  if (!id) return null;
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("alumni_profiles")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as AlumniProfileRow;
  } catch {
    return null;
  }
}

/**
 * Fetch published alumni profile IDs and timestamps for the sitemap generator.
 */
export async function getPublishedAlumniForSitemap(): Promise<
  Array<{ id: string; published_at: string; updated_at: string }>
> {
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("alumni_profiles")
      .select("id, published_at, updated_at")
      .eq("status", "published");

    if (error || !data) {
      return [];
    }

    return data as Array<{ id: string; published_at: string; updated_at: string }>;
  } catch {
    return [];
  }
}
