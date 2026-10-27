"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  submitInternshipSchema,
  adminPublishSchema,
  adminRejectSchema,
  type SubmitInternshipInput,
} from "./validation";
import { sendInternshipSubmissionNotification } from "./email";
import type { MyInternshipSubmission, AdminInternshipWithReview } from "./types";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitInternshipLeadAction(
  rawInput: SubmitInternshipInput
): Promise<ActionResult<{ id: string }>> {
  const isProd = process.env.NODE_ENV === "production";

  // 1. Honeypot check
  if (rawInput.hpCompanyField && rawInput.hpCompanyField.trim().length > 0) {
    return { ok: true, data: { id: "00000000-0000-0000-0000-000000000000" } };
  }

  // 2. Schema validation
  const parsed = submitInternshipSchema.safeParse(rawInput);
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

  // 3. Cloudflare Turnstile Verification
  const turnstileSecret =
    process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (turnstileSecret && isProd) {
    if (!data.turnstileToken || data.turnstileToken === "bypass") {
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
        return { ok: false, error: "Security check failed. Please refresh and try again." };
      }
    } catch {
      return { ok: false, error: "Security verification service unavailable." };
    }
  }

  // 4. Authenticated client & RPC call
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to submit an internship opportunity." };
  }

  const { data: newId, error: rpcError } = await supabase.rpc("submit_internship_lead", {
    p_title: data.title,
    p_organization: data.organization,
    p_location: data.location,
    p_work_mode: data.work_mode,
    p_field: data.field,
    p_type: data.type,
    p_paid_status: data.paid_status,
    p_description: data.description,
    p_eligibility: data.eligibility || null,
    p_apply_url: data.apply_url || null,
    p_apply_email: data.apply_email || null,
    p_deadline: data.deadline || null,
  });

  if (rpcError || !newId) {
    return {
      ok: false,
      error: rpcError?.message || "Failed to submit opportunity. Please try again.",
    };
  }

  // 5. Fire notification email (best-effort)
  try {
    await sendInternshipSubmissionNotification({
      id: newId as string,
      title: data.title,
      organization: data.organization,
      location: data.location,
      workMode: data.work_mode,
      field: data.field,
      paidStatus: data.paid_status,
    });
  } catch (err) {
    console.error("[Internship Lead] Notification failed:", err);
  }

  revalidatePath("/internships");
  revalidatePath("/admin/internships");

  return { ok: true, data: { id: newId as string } };
}

export async function fetchMyInternshipSubmissionsAction(): Promise<ActionResult<MyInternshipSubmission[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required" };
  }

  const { data, error } = await supabase.rpc("my_internship_submissions");
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: (data as MyInternshipSubmission[]) || [] };
}

export async function adminFetchInternshipsAction(): Promise<ActionResult<AdminInternshipWithReview[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const adminClient = createAdminClient();

  const { data: internships, error: intError } = await adminClient
    .from("internships")
    .select(`
      *,
      review:internship_reviews (
        submitted_by,
        reviewed_by,
        reviewed_at,
        rejection_reason
      )
    `)
    .order("created_at", { ascending: false });

  if (intError || !internships) {
    return { ok: false, error: intError?.message || "Failed to load listings" };
  }

  interface DbInternshipJoined {
    [key: string]: unknown;
    review?:
      | {
          submitted_by?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
        }
      | Array<{
          submitted_by?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
        }>;
  }

  const rawInternships = (internships as unknown as DbInternshipJoined[]) || [];

  // Format and optionally fetch submitter details
  const submitterIds = Array.from(
    new Set(
      rawInternships
        .map((i) => {
          const rev = Array.isArray(i.review) ? i.review[0] : i.review;
          return rev?.submitted_by;
        })
        .filter((id): id is string => Boolean(id))
    )
  );

  const userMap: Record<string, { email?: string; full_name?: string }> = {};
  if (submitterIds.length > 0) {
    const { data: userData } = await adminClient
      .from("users")
      .select("id, email, full_name")
      .in("id", submitterIds);

    if (userData) {
      for (const u of userData) {
        userMap[u.id] = { email: u.email, full_name: u.full_name };
      }
    }
  }

  const rows: AdminInternshipWithReview[] = rawInternships.map((row) => {
    const rev = Array.isArray(row.review) ? row.review[0] : row.review;
    const subId = rev?.submitted_by;
    const submitter = subId ? userMap[subId] : null;

    return {
      ...(row as unknown as AdminInternshipWithReview),
      submitted_by: subId,
      reviewed_by: rev?.reviewed_by,
      reviewed_at: rev?.reviewed_at,
      rejection_reason: rev?.rejection_reason,
      submitter_email: submitter?.email || null,
      submitter_name: submitter?.full_name || null,
    };
  });

  return { ok: true, data: rows };
}

export async function adminPublishInternshipAction(input: unknown): Promise<ActionResult> {
  const parsed = adminPublishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const supabase = await createClient();
  const data = parsed.data;

  const { error } = await supabase.rpc("admin_publish_internship", {
    p_id: data.id,
    p_title: data.title,
    p_organization: data.organization,
    p_location: data.location,
    p_work_mode: data.work_mode,
    p_field: data.field,
    p_type: data.type,
    p_paid_status: data.paid_status,
    p_description: data.description,
    p_eligibility: data.eligibility || null,
    p_apply_url: data.apply_url || null,
    p_apply_email: data.apply_email || null,
    p_deadline: data.deadline || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/internships");
  revalidatePath(`/internships/${data.id}`);
  revalidatePath("/admin/internships");
  return { ok: true };
}

export async function adminRejectInternshipAction(input: unknown): Promise<ActionResult> {
  const parsed = adminRejectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reject_internship", {
    p_id: parsed.data.id,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/internships");
  revalidatePath(`/internships/${parsed.data.id}`);
  revalidatePath("/admin/internships");
  return { ok: true };
}

export async function adminUnpublishInternshipAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_unpublish_internship", { p_id: id });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/internships");
  revalidatePath(`/internships/${id}`);
  revalidatePath("/admin/internships");
  return { ok: true };
}

export async function adminDeleteInternshipAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_internship", { p_id: id });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/internships");
  revalidatePath(`/internships/${id}`);
  revalidatePath("/admin/internships");
  return { ok: true };
}
