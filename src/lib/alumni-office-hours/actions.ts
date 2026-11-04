"use server";

import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  alumniApplicationSchema,
  adminPublishAlumniSchema,
  type AlumniApplicationInput,
  type AdminPublishAlumniInput,
} from "./schema";
import {
  type AlumniApplicationRow,
  type AlumniProfileRow,
  type SubmitAlumniApplicationResult,
} from "./types";
import type { AlumniApplicationStatus, AlumniProfileStatus } from "./constants";
import { sendAlumniApplicationEmail } from "./email";
import { checkAlumniRateLimits, hashClientIp } from "./rate-limit";

export { checkAlumniRateLimits, hashClientIp };

/**
 * Public Server Action: Submit an Alumni Office Hours application.
 */
export async function submitAlumniApplication(
  rawInput: AlumniApplicationInput
): Promise<SubmitAlumniApplicationResult> {
  const isProd = process.env.NODE_ENV === "production";

  // 1. Validate environment salt configuration
  const salt = process.env.CONTACT_IP_SALT || process.env.FUNDING_IP_SALT;
  if (!salt) {
    console.error("[Alumni] Missing CONTACT_IP_SALT / FUNDING_IP_SALT variable");
    return {
      ok: false,
      error: "Application service is temporarily misconfigured. Please try again shortly.",
    };
  }

  // 2. Honeypot check (anti-bot)
  if (rawInput.hpCompanyField && rawInput.hpCompanyField.trim().length > 0) {
    console.warn("[Alumni] Honeypot triggered. Silently aborting submission.");
    return { ok: true };
  }

  // 3. Schema validation & control character stripping
  const parsed = alumniApplicationSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      error: "Please review the highlighted fields in your application.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 4. Cloudflare Turnstile Verification
  const turnstileSecret =
    process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (isProd && !turnstileSecret) {
    console.error("[Alumni] Missing TURNSTILE_SECRET_KEY in production");
    return { ok: false, error: "Security check is unavailable. Please try again later." };
  }

  if (turnstileSecret) {
    if (!data.turnstileToken || (isProd && data.turnstileToken === "bypass")) {
      return { ok: false, error: "Please complete the security verification challenge." };
    }

    try {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: data.turnstileToken,
          }),
        }
      );

      const verifyJson = (await verifyRes.json()) as { success: boolean };
      if (!verifyJson.success) {
        return {
          ok: false,
          error: "Security verification failed or expired. Please try again.",
        };
      }
    } catch (err) {
      console.error("[Alumni] Turnstile verification network error:", err);
      return {
        ok: false,
        error: "Unable to verify security challenge. Please try again.",
      };
    }
  }

  // 5. Extract Client IP & Calculate Salted Hash
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "unknown";
  const ipHash = hashClientIp(clientIp, salt);

  // 6. Enforce Rate Limits via Database Count Queries (10/hr, 40/day)
  const adminClient = createAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [hourlyRes, dailyRes] = await Promise.all([
      adminClient
        .from("alumni_applications")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneHourAgo),
      adminClient
        .from("alumni_applications")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneDayAgo),
    ]);

    const hourlyCount = hourlyRes.count ?? 0;
    const dailyCount = dailyRes.count ?? 0;

    const rateCheck = checkAlumniRateLimits(hourlyCount, dailyCount);
    if (!rateCheck.allowed) {
      return { ok: false, error: rateCheck.reason };
    }
  } catch (err) {
    console.error("[Alumni] Rate limit lookup failed:", err);
    return { ok: false, error: "Service busy. Please try submitting again in a moment." };
  }

  // 7. Persist to Database via Service Role Client
  try {
    const { error: insertError } = await adminClient.from("alumni_applications").insert({
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      graduation_year: data.graduationYear,
      institution: data.institution,
      field: data.field,
      occupation: data.occupation,
      bio: data.bio,
      topics: data.topics,
      availability: data.availability,
      contact_url: data.contactUrl,
      consent_public: data.consentPublic,
      status: "new",
      ip_hash: ipHash,
    });

    if (insertError) {
      if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique")) {
        return {
          ok: false,
          error: "We already have an application from this email.",
        };
      }
      console.error("[Alumni] Database insert error:", insertError);
      return {
        ok: false,
        error: "We could not save your application. Please try again shortly.",
      };
    }
  } catch (err: unknown) {
    const pgError = err as { code?: string; message?: string };
    if (pgError?.code === "23505" || pgError?.message?.toLowerCase().includes("unique")) {
      return {
        ok: false,
        error: "We already have an application from this email.",
      };
    }
    console.error("[Alumni] Unexpected database error:", err);
    return {
      ok: false,
      error: "An unexpected error occurred while saving your application. Please try again.",
    };
  }

  // 8. Best-effort email notification via Resend (never fails user submission)
  sendAlumniApplicationEmail({
    fullName: data.fullName,
    email: data.email,
    graduationYear: data.graduationYear,
    institution: data.institution,
    field: data.field,
    occupation: data.occupation,
    bio: data.bio,
    topics: data.topics,
    availability: data.availability,
    contactUrl: data.contactUrl,
  }).catch((err) => {
    console.error("[Alumni] Background notification email trigger failed:", err);
  });

  return { ok: true };
}

/**
 * Admin action: Fetch alumni applications with status filter, search & pagination.
 */
export async function adminGetAlumniApplications(options?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  ok: boolean;
  data?: AlumniApplicationRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}> {
  await requireAdmin();

  const adminClient = createAdminClient();
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = adminClient
      .from("alumni_applications")
      .select("*", { count: "exact" });

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().replace(/[%_]/g, "");
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,institution.ilike.%${q}%,field.ilike.%${q}%,occupation.ilike.%${q}%`
      );
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error("[Admin Alumni] Query applications error:", error);
      return { ok: false, error: "Failed to load alumni applications" };
    }

    return {
      ok: true,
      data: (data || []) as AlumniApplicationRow[],
      total: count ?? 0,
      page,
      pageSize,
    };
  } catch (err) {
    console.error("[Admin Alumni] Unexpected query applications error:", err);
    return { ok: false, error: "An unexpected error occurred while loading applications" };
  }
}

/**
 * Admin action: Fetch alumni published/unpublished profiles.
 */
export async function adminGetAlumniProfiles(options?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  ok: boolean;
  data?: AlumniProfileRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}> {
  await requireAdmin();

  const adminClient = createAdminClient();
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = adminClient
      .from("alumni_profiles")
      .select("*", { count: "exact" });

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().replace(/[%_]/g, "");
      query = query.or(
        `display_name.ilike.%${q}%,institution.ilike.%${q}%,field.ilike.%${q}%,occupation.ilike.%${q}%`
      );
    }

    query = query.order("published_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error("[Admin Alumni] Query profiles error:", error);
      return { ok: false, error: "Failed to load alumni profiles" };
    }

    return {
      ok: true,
      data: (data || []) as AlumniProfileRow[],
      total: count ?? 0,
      page,
      pageSize,
    };
  } catch (err) {
    console.error("[Admin Alumni] Unexpected query profiles error:", err);
    return { ok: false, error: "An unexpected error occurred while loading profiles" };
  }
}

/**
 * Admin action: Update status of an application via RPC using caller's client.
 */
export async function adminSetAlumniApplicationStatusAction(
  id: string,
  status: AlumniApplicationStatus,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const supabase = await createClient();
  try {
    const { error } = await supabase.rpc("admin_set_alumni_application_status", {
      p_id: id,
      p_status: status,
      p_notes: notes ?? null,
    });

    if (error) {
      console.error("[Admin Alumni] Application status update error:", error);
      return { ok: false, error: error.message || "Failed to update status" };
    }

    revalidatePath("/admin/alumni-office-hours");
    return { ok: true };
  } catch (err) {
    console.error("[Admin Alumni] Status update unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while updating status" };
  }
}

/**
 * Admin action: Approve and publish alumni profile via RPC using caller's client.
 */
export async function adminPublishAlumniAction(
  rawInput: AdminPublishAlumniInput
): Promise<{ ok: boolean; error?: string; profileId?: string }> {
  await requireAdmin();

  const parsed = adminPublishAlumniSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid alumni profile details",
    };
  }

  const {
    applicationId,
    displayName,
    graduationYear,
    institution,
    field,
    occupation,
    bio,
    topics,
    availability,
    contactUrl,
  } = parsed.data;

  const supabase = await createClient();
  try {
    const { data, error } = await supabase.rpc("admin_publish_alumni", {
      p_application_id: applicationId,
      p_display_name: displayName,
      p_graduation_year: graduationYear,
      p_institution: institution,
      p_field: field,
      p_occupation: occupation,
      p_bio: bio,
      p_topics: topics,
      p_availability: availability,
      p_contact_url: contactUrl,
    });

    if (error) {
      console.error("[Admin Alumni] Publish error:", error);
      return { ok: false, error: error.message || "Failed to publish alumni profile" };
    }

    revalidatePath("/admin/alumni-office-hours");
    revalidatePath("/alumni-office-hours");
    revalidatePath(`/alumni-office-hours/${(data as { id?: string })?.id}`);
    return { ok: true, profileId: (data as { id?: string })?.id };
  } catch (err) {
    console.error("[Admin Alumni] Publish unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while publishing profile" };
  }
}

/**
 * Admin action: Toggle published/unpublished profile status via RPC using caller's client.
 */
export async function adminSetAlumniProfileStatusAction(
  id: string,
  status: AlumniProfileStatus
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const supabase = await createClient();
  try {
    const { error } = await supabase.rpc("admin_set_alumni_profile_status", {
      p_id: id,
      p_status: status,
    });

    if (error) {
      console.error("[Admin Alumni] Profile status update error:", error);
      return { ok: false, error: error.message || "Failed to update profile status" };
    }

    revalidatePath("/admin/alumni-office-hours");
    revalidatePath("/alumni-office-hours");
    revalidatePath(`/alumni-office-hours/${id}`);
    return { ok: true };
  } catch (err) {
    console.error("[Admin Alumni] Profile status unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while updating profile status" };
  }
}

/**
 * Admin action: Delete application and associated profile via RPC using caller's client.
 */
export async function adminDeleteAlumniApplicationAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const supabase = await createClient();
  try {
    const { error } = await supabase.rpc("admin_delete_alumni_application", {
      p_id: id,
    });

    if (error) {
      console.error("[Admin Alumni] Delete application error:", error);
      return { ok: false, error: error.message || "Failed to delete application" };
    }

    revalidatePath("/admin/alumni-office-hours");
    revalidatePath("/alumni-office-hours");
    return { ok: true };
  } catch (err) {
    console.error("[Admin Alumni] Delete application unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while deleting application" };
  }
}

