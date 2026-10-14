import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client initialized with the SERVICE ROLE key.
 *
 * CRITICAL SECURITY RULES:
 *  1. NEVER import this file into Client Components.
 *  2. NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *  3. Use strictly for backend operations that must bypass RLS (e.g. updating nin_hash,
 *     is_verified, or level_id in /api/nin/verify).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "[supabase/admin] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
