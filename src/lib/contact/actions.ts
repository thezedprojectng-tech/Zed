"use server";

import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  contactMessageSchema,
  type ContactSubmissionInput,
  type ContactMessageRow,
  type ContactStatus,
} from "./schema";
import { sendContactEmail } from "./email";
import { checkContactRateLimits, hashClientIp } from "./rate-limit";

export { checkContactRateLimits, hashClientIp };

export interface SubmitContactResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action to submit a contact inquiry.
 */
export async function submitContactMessage(
  rawInput: ContactSubmissionInput
): Promise<SubmitContactResult> {
  const isProd = process.env.NODE_ENV === "production";

  // 1. Validate environment configuration (Fail closed in production)
  const salt = process.env.CONTACT_IP_SALT || process.env.FUNDING_IP_SALT;
  if (!salt) {
    console.error("[Contact] Missing CONTACT_IP_SALT / FUNDING_IP_SALT environment variable");
    return {
      ok: false,
      error: "Contact service is temporarily misconfigured. Please try again shortly.",
    };
  }

  // 2. Honeypot check (anti-bot)
  if (rawInput.hpCompanyField && rawInput.hpCompanyField.trim().length > 0) {
    console.warn("[Contact] Honeypot triggered. Silently aborting submission.");
    return { ok: true };
  }

  // 3. Schema validation & control character stripping
  const parsed = contactMessageSchema.safeParse(rawInput);
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
      error: "Please review the highlighted fields in your message.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 4. Cloudflare Turnstile Verification
  const turnstileSecret =
    process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (isProd && !turnstileSecret) {
    console.error("[Contact] Missing TURNSTILE_SECRET_KEY in production");
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
      console.error("[Contact] Turnstile verification network error:", err);
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
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : (realIp || "127.0.0.1");
  const ipHash = hashClientIp(clientIp, salt);

  // 6. Enforce Rate Limits via Database Count Queries (5/hr, 20/day)
  const adminClient = createAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [hourlyRes, dailyRes] = await Promise.all([
      adminClient
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneHourAgo),
      adminClient
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneDayAgo),
    ]);

    const hourlyCount = hourlyRes.count ?? 0;
    const dailyCount = dailyRes.count ?? 0;

    const rateCheck = checkContactRateLimits(hourlyCount, dailyCount);
    if (!rateCheck.allowed) {
      return { ok: false, error: rateCheck.reason };
    }
  } catch (err) {
    console.error("[Contact] Rate limit lookup failed:", err);
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
    const { error: insertError } = await adminClient.from("contact_messages").insert({
      user_id: submitterUserId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone && data.phone.trim().length > 0 ? data.phone.trim() : null,
      subject: data.subject,
      message: data.message,
      status: "new",
      ip_hash: ipHash,
    });

    if (insertError) {
      console.error("[Contact] Database insert error:", insertError);
      return {
        ok: false,
        error: "We could not save your message. Please try again shortly.",
      };
    }
  } catch (err) {
    console.error("[Contact] Unexpected database error:", err);
    return {
      ok: false,
      error: "An unexpected error occurred while saving your message. Please try again.",
    };
  }

  // 9. Best-effort email notification via Resend (never fails user response)
  sendContactEmail({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    subject: data.subject,
    message: data.message,
  }).catch((err) => {
    console.error("[Contact] Background email trigger failed:", err);
  });

  return { ok: true };
}

/**
 * Admin action: Fetch contact messages with safe search & status filter
 */
export async function adminGetContactMessages(options?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  ok: boolean;
  data?: ContactMessageRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}> {
  await requireAdmin();
  const supabase = await createClient();

  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize || 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("contact_messages")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  // Safe search: sanitize input to prevent PostgREST .or() filter injection
  if (options?.search && options.search.trim().length > 0) {
    const cleanSearch = options.search
      .trim()
      .slice(0, 80)
      .replace(/[%_(),\\]/g, ""); // Strip dangerous PostgREST filter characters

    if (cleanSearch.length > 0) {
      query = query.or(
        `name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,subject.ilike.%${cleanSearch}%`
      );
    }
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[Admin Contact] Query error:", error);
    return { ok: false, error: "Failed to load contact messages" };
  }

  return {
    ok: true,
    data: (data as ContactMessageRow[]) || [],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Admin action: Update contact message status via SECURITY DEFINER RPC.
 */
export async function adminSetContactStatus(params: {
  id: string;
  status: ContactStatus;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_set_contact_status", {
    p_id: params.id,
    p_status: params.status,
  });

  if (error) {
    console.error("[Admin Contact] Update RPC error:", error);
    return { ok: false, error: error.message || "Failed to update contact message status" };
  }

  revalidatePath("/admin/contact");
  return { ok: true };
}

/**
 * Admin action: Delete contact message via SECURITY DEFINER RPC.
 */
export async function adminDeleteContactMessage(params: {
  id: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_delete_contact_message", {
    p_id: params.id,
  });

  if (error) {
    console.error("[Admin Contact] Delete RPC error:", error);
    return { ok: false, error: error.message || "Failed to delete contact message" };
  }

  revalidatePath("/admin/contact");
  return { ok: true };
}

/**
 * Admin action: Get count of unread (status = 'new') contact messages.
 */
export async function adminGetContactUnreadCount(): Promise<number> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    if (error) {
      console.error("[Admin Contact] Unread count error:", error);
      return 0;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}
