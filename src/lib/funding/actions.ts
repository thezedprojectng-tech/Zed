"use server";

import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  fundingSubmissionSchema,
  type FundingSubmissionInput,
  type FundingSubmissionRow,
  type FundingStatus,
} from "./schema";
import { sendFundingEmails } from "./email";
import { checkRateLimits, hashClientIp } from "./rate-limit";

export { checkRateLimits, hashClientIp };

export interface SubmitFundingResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action to submit a funding idea proposal.
 */
export async function submitFundingIdea(
  rawInput: FundingSubmissionInput
): Promise<SubmitFundingResult> {
  // 1. Validate environment configuration (Fail closed)
  const salt = process.env.FUNDING_IP_SALT;
  if (!salt) {
    console.error("[Funding] Missing FUNDING_IP_SALT environment variable");
    return {
      ok: false,
      error: "Submission service is temporarily misconfigured. Please try again shortly.",
    };
  }

  // 2. Honeypot check (anti-bot)
  if (rawInput.hpCompanyField && rawInput.hpCompanyField.trim().length > 0) {
    console.warn("[Funding] Honeypot triggered. Silently aborting submission.");
    return { ok: true };
  }

  // 3. Schema validation
  const parsed = fundingSubmissionSchema.safeParse(rawInput);
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
      error: "Please review the highlighted fields in your submission.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 4. Cloudflare Turnstile Verification
  const isProd = process.env.NODE_ENV === "production";
  const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (isProd && !turnstileSecret) {
    console.error("[Funding] Missing CLOUDFLARE_TURNSTILE_SECRET_KEY in production");
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
      console.error("[Funding] Turnstile verification network error:", err);
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

  // 6. Enforce Rate Limits via Database Count Queries
  const adminClient = createAdminClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [emailRes, ipRes] = await Promise.all([
      adminClient
        .from("funding_submissions")
        .select("id", { count: "exact", head: true })
        .eq("email", data.email.toLowerCase())
        .gte("created_at", oneDayAgo),
      adminClient
        .from("funding_submissions")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneDayAgo),
    ]);

    const emailCount = emailRes.count ?? 0;
    const ipCount = ipRes.count ?? 0;

    const rateCheck = checkRateLimits(emailCount, ipCount);
    if (!rateCheck.allowed) {
      return { ok: false, error: rateCheck.reason };
    }
  } catch (err) {
    console.error("[Funding] Rate limit lookup failed:", err);
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
    const { error: insertError } = await adminClient.from("funding_submissions").insert({
      user_id: submitterUserId,
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      project_title: data.projectTitle,
      category: data.category,
      stage: data.stage,
      funding_needed_ngn: data.fundingNeededNgn,
      summary: data.summary,
      problem: data.problem,
      plan: data.plan,
      link: data.link || null,
      status: "new",
      ip_hash: ipHash,
    });

    if (insertError) {
      console.error("[Funding] Database insert error:", insertError);
      return {
        ok: false,
        error: "We could not save your submission. Please try again shortly.",
      };
    }
  } catch (err) {
    console.error("[Funding] Unexpected insertion exception:", err);
    return {
      ok: false,
      error: "An unexpected error occurred while saving. Please try again.",
    };
  }

  // 9. Best-effort email notification (does not fail user response)
  sendFundingEmails({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    projectTitle: data.projectTitle,
    category: data.category,
    stage: data.stage,
    fundingNeededNgn: data.fundingNeededNgn,
    summary: data.summary,
    problem: data.problem,
    plan: data.plan,
    link: data.link || null,
  }).catch((err) => {
    console.error("[Funding] Background email trigger failed:", err);
  });

  return { ok: true };
}

/**
 * Admin action: Fetch submissions with optional search & status filter
 */
export async function adminGetFundingSubmissions(options?: {
  status?: string;
  search?: string;
}): Promise<{ ok: boolean; data?: FundingSubmissionRow[]; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("funding_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.search && options.search.trim().length > 0) {
    const term = `%${options.search.trim()}%`;
    query = query.or(
      `project_title.ilike.${term},full_name.ilike.${term},email.ilike.${term}`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[Admin Funding] Query error:", error);
    return { ok: false, error: "Failed to load funding submissions" };
  }

  return { ok: true, data: (data as FundingSubmissionRow[]) || [] };
}

/**
 * Admin action: Update submission status and internal note.
 * Calls the database RPC admin_update_funding_submission, always
 * forwarding the current note to avoid accidental clearing.
 */
export async function adminUpdateFundingSubmission(params: {
  id: string;
  status: FundingStatus;
  adminNote: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_update_funding_submission", {
    p_id: params.id,
    p_status: params.status,
    p_admin_note: params.adminNote,
  });

  if (error) {
    console.error("[Admin Funding] Update RPC error:", error);
    return { ok: false, error: error.message || "Failed to update submission" };
  }

  revalidatePath("/admin/funding");
  return { ok: true };
}
