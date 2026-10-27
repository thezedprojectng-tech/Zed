import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminFetchInternshipsAction } from "@/lib/internships/actions";
import { AdminInternshipsClient } from "./AdminInternshipsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internship Moderation — Admin Console",
};

export default async function AdminInternshipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    notFound();
  }

  const res = await adminFetchInternshipsAction();
  const initialData = res.ok && res.data ? res.data : [];

  return (
    <div className="w-full space-y-6">
      <AdminInternshipsClient initialInternships={initialData} />
    </div>
  );
}
