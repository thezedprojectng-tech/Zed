import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

/**
 * Server layout for all /admin routes.
 *
 * Security contract:
 *  1. No session → redirect to /login.
 *  2. Session exists but role !== 'admin' → notFound() so the page is invisible.
 *  3. Role is 'admin' → render standalone admin console shell (citizen layout is bypassed).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the authenticated session user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // 2. Fetch the public.users row with the service-role client
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("id, full_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    notFound();
  }

  const adminUser = {
    id: user.id,
    fullName: profile.full_name || (user.user_metadata?.full_name as string) || "Administrator",
    email: user.email,
    avatarUrl: profile.avatar_url || (user.user_metadata?.avatar_url as string) || undefined,
  };

  // 3. Fetch unread contact message count (safely fallback to 0)
  let unreadContactCount = 0;
  try {
    const { count } = await admin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    unreadContactCount = count ?? 0;
  } catch {
    unreadContactCount = 0;
  }

  // 4. Fetch pending internships count (safely fallback to 0)
  let pendingInternshipsCount = 0;
  try {
    const { count } = await admin
      .from("internships")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingInternshipsCount = count ?? 0;
  } catch {
    pendingInternshipsCount = 0;
  }

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground antialiased font-sans selection:bg-amber-500/20 selection:text-amber-500">
      {/* Dedicated Admin Sidebar */}
      <AdminSidebar
        adminUser={adminUser}
        unreadContactCount={unreadContactCount}
        pendingInternshipsCount={pendingInternshipsCount}
      />

      {/* Main Console Content */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <AdminTopBar adminUser={adminUser} />
        <main className="flex-1 bg-secondary/15 p-3.5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
