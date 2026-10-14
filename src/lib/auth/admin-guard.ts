/**
 * Server-only helper: verifies the current session user is an admin.
 * Returns the user ID on success. Calls notFound() otherwise so the
 * page is silently invisible to non-admins.
 *
 * Usage (server components / server actions):
 *   const userId = await requireAdmin();
 *   const admin = createAdminClient();
 *   // … safe to fetch sensitive data …
 */
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    notFound();
  }

  return user.id;
}

/** Mask a phone number: +234 906 *** 0810 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return "***";
  // Show first 7 chars then mask then last 4
  const raw = phone.trim();
  // e.g. +2348060001234 → +234 806 *** 1234
  if (raw.length <= 7) return "***";
  const start = raw.slice(0, Math.max(raw.length - 7, 4));
  const end = raw.slice(-4);
  return `${start} *** ${end}`;
}
