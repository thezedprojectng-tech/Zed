"use server";

import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  ambassadorApplicationSchema,
  type AmbassadorApplicationInput,
  type AmbassadorApplicationRow,
  type AmbassadorStatus,
} from "./schema";
import { sendAmbassadorEmail } from "./email";
import { checkAmbassadorRateLimits, hashClientIp } from "./rate-limit";

export { checkAmbassadorRateLimits, hashClientIp };

export interface SubmitAmbassadorResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action to submit a Campus Ambassador application.
 */
export async function submitAmbassadorApplication(
  rawInput: AmbassadorApplicationInput
): Promise<SubmitAmbassadorResult> {
  const isProd = process.env.NODE_ENV === "production";

  // 1. Validate environment configuration (Fail closed in production)
  const salt = process.env.CONTACT_IP_SALT || process.env.FUNDING_IP_SALT;
  if (!salt) {
    console.error("[Ambassador] Missing CONTACT_IP_SALT / FUNDING_IP_SALT environment variable");
    return {
      ok: false,
      error: "Application service is temporarily misconfigured. Please try again shortly.",
    };
  }

  // 2. Honeypot check (anti-bot)
  if (rawInput.hpCompanyField && rawInput.hpCompanyField.trim().length > 0) {
    console.warn("[Ambassador] Honeypot triggered. Silently aborting submission.");
    return { ok: true };
  }

  // 3. Schema validation & control character stripping
  const parsed = ambassadorApplicationSchema.safeParse(rawInput);
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
    console.error("[Ambassador] Missing TURNSTILE_SECRET_KEY in production");
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
      console.error("[Ambassador] Turnstile verification network error:", err);
      return {
        ok: false,
        error: "Unable to verify security challenge. Please try again.",
      };
    }
  }

  // 5. Extract Client IP & Calculate Salted Hash (fallback to "unknown")
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
        .from("ambassador_applications")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneHourAgo),
      adminClient
        .from("ambassador_applications")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneDayAgo),
    ]);

    const hourlyCount = hourlyRes.count ?? 0;
    const dailyCount = dailyRes.count ?? 0;

    const rateCheck = checkAmbassadorRateLimits(hourlyCount, dailyCount);
    if (!rateCheck.allowed) {
      return { ok: false, error: rateCheck.reason };
    }
  } catch (err) {
    console.error("[Ambassador] Rate limit lookup failed:", err);
    return { ok: false, error: "Service busy. Please try submitting again in a moment." };
  }

  // 7. Check for authenticated user session (if logged in)
  let submitterUserId: string | null = null;
  try {
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (user?.id) {
      submitterUserId = user.id;
    }
  } catch {
    // Public page – anonymous submitter is completely normal
  }

  // 8. Persist to Database via Service Role Client
  try {
    const { error: insertError } = await adminClient.from("ambassador_applications").insert({
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      institution: data.institution,
      state: data.state,
      course: data.course,
      level: data.level,
      social_handle: data.socialHandle && data.socialHandle.trim().length > 0 ? data.socialHandle.trim() : null,
      why_ambassador: data.whyAmbassador,
      referral_code: data.referralCode && data.referralCode.trim().length > 0 ? data.referralCode.trim().toUpperCase() : null,
      consent: data.consent,
      status: "new",
      user_id: submitterUserId,
      ip_hash: ipHash,
    });

    if (insertError) {
      if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique")) {
        return {
          ok: false,
          error: "We already have an application from this email.",
        };
      }
      console.error("[Ambassador] Database insert error:", insertError);
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
    console.error("[Ambassador] Unexpected database error:", err);
    return {
      ok: false,
      error: "An unexpected error occurred while saving your application. Please try again.",
    };
  }

  // 9. Best-effort email notification via Resend (never fails user response)
  sendAmbassadorEmail({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    institution: data.institution,
    state: data.state,
    course: data.course,
    level: data.level,
    socialHandle: data.socialHandle || null,
    whyAmbassador: data.whyAmbassador,
    referralCode: data.referralCode || null,
  }).catch((err) => {
    console.error("[Ambassador] Background email trigger failed:", err);
  });

  return { ok: true };
}

/**
 * Admin action: Fetch ambassador applications with status filter, search, & pagination
 */
export async function adminGetAmbassadorApplications(options?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  ok: boolean;
  data?: AmbassadorApplicationRow[];
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
      .from("ambassador_applications")
      .select("*", { count: "exact" });

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().replace(/[%_]/g, "");
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,institution.ilike.%${q}%,course.ilike.%${q}%`
      );
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error("[Admin Ambassador] Query error:", error);
      return { ok: false, error: "Failed to load ambassador applications" };
    }

    return {
      ok: true,
      data: (data || []) as AmbassadorApplicationRow[],
      total: count ?? 0,
      page,
      pageSize,
    };
  } catch (err) {
    console.error("[Admin Ambassador] Unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while loading applications" };
  }
}

/**
 * Admin action: Update status of an ambassador application via RPC
 */
export async function adminSetAmbassadorStatus(
  id: string,
  status: AmbassadorStatus
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const supabase = await createClient();
  try {
    const { error } = await supabase.rpc("admin_set_ambassador_status", {
      p_id: id,
      p_status: status,
    });

    if (error) {
      console.error("[Admin Ambassador] Status update error:", error);
      return { ok: false, error: error.message || "Failed to update status" };
    }

    revalidatePath("/admin/ambassadors");
    return { ok: true };
  } catch (err) {
    console.error("[Admin Ambassador] Status change unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while updating status" };
  }
}

/**
 * Admin action: Delete an ambassador application via RPC
 */
export async function adminDeleteAmbassadorApplication(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const supabase = await createClient();
  try {
    const { error } = await supabase.rpc("admin_delete_ambassador_application", {
      p_id: id,
    });

    if (error) {
      console.error("[Admin Ambassador] Delete application error:", error);
      return { ok: false, error: error.message || "Failed to delete application" };
    }

    revalidatePath("/admin/ambassadors");
    return { ok: true };
  } catch (err) {
    console.error("[Admin Ambassador] Delete application unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred while deleting application" };
  }
}

