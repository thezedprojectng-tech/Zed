import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser (Client Components).
 * Safe to call multiple times – returns a singleton-style client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
