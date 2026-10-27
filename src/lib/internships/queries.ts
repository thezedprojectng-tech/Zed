import { createClient } from "@supabase/supabase-js";
import type { Internship } from "./types";

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
 * Fetch all published, active (non-expired) internships using the static anon client.
 * Expiry is derived dynamically: (deadline IS NULL OR deadline >= CURRENT_DATE).
 */
export async function getPublishedInternships(): Promise<Internship[]> {
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return [];

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .eq("status", "published")
      .or(`deadline.is.null,deadline.gte.${today}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as Internship[];
  } catch {
    return [];
  }
}

/**
 * Fetch a single published, non-expired internship by UUID.
 */
export async function getInternshipById(id: string): Promise<Internship | null> {
  if (!id) return null;
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return null;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .or(`deadline.is.null,deadline.gte.${today}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Internship;
  } catch {
    return null;
  }
}

/**
 * Fetch minimal metadata of published internships for sitemap generation.
 */
export async function getPublishedInternshipsForSitemap(): Promise<Array<{ id: string; published_at?: string | null; created_at: string }>> {
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return [];

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("internships")
      .select("id, published_at, created_at")
      .eq("status", "published")
      .or(`deadline.is.null,deadline.gte.${today}`);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
