import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server layout for all /admin routes.
 *
 * Security contract:
 *  1. No session → redirect to /login (middleware already handles this but
 *     we double-check here so the layout is self-contained).
 *  2. Session exists but role !== 'admin' → notFound() so the page is invisible.
 *  3. Role is 'admin' → render children.
 *
 * Data is fetched with the service-role client AFTER the admin check passes.
 * The service-role key is never sent to the browser.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the authenticated session user via the cookie-based client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // 2. Fetch the public.users row using the service-role client (bypasses RLS,
  //    so we see the role column reliably)
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    notFound();
  }

  return <>{children}</>;
}
