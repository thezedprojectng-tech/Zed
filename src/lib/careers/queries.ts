import { createClient } from "@supabase/supabase-js";
import { mapRoleRowToJob, type CareerRoleRow, type Job } from "@/data/careers";

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
 * Fetch all published roles from the database using a stateless anon client.
 * Catches all query and network errors so database states never crash static builds.
 */
export async function getPublishedRoles(): Promise<Job[]> {
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("career_roles")
      .select("*")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("posted_at", { ascending: false, nullsFirst: false });

    if (error || !data) {
      return [];
    }

    return (data as CareerRoleRow[]).map(mapRoleRowToJob);
  } catch {
    return [];
  }
}

/**
 * Fetch a single published role by its unique URL slug.
 * Returns null if the role is draft, closed, not found, or on database error.
 */
export async function getRoleBySlug(slug: string): Promise<Job | null> {
  if (!slug) return null;
  try {
    const supabase = getStaticAnonClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("career_roles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRoleRowToJob(data as CareerRoleRow);
  } catch {
    return null;
  }
}
