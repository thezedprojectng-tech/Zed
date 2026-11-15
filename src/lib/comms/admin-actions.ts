"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import type { AdminNotification, SendNotificationInput } from "./types";

export type CommsActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * List administrative notifications with optional cursor and type filter.
 */
export async function adminListNotificationsAction(params: {
  limit?: number;
  before?: string | null;
  type?: string | null;
} = {}): Promise<AdminNotification[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_list_notifications", {
    p_limit: params.limit ?? 20,
    p_before: params.before ?? null,
    p_type: params.type && params.type !== "all" ? params.type : null,
  });

  if (error) {
    console.error("admin_list_notifications error:", error);
    return [];
  }

  return (data as AdminNotification[]) || [];
}

/**
 * Get count of unread administrative notifications.
 */
export async function adminGetUnreadNotificationCountAction(): Promise<number> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_unread_notification_count");

  if (error) {
    console.error("admin_unread_notification_count error:", error);
    return 0;
  }

  return typeof data === "number" ? data : Number(data) || 0;
}

/**
 * Mark all administrative notifications as seen/read.
 */
export async function adminMarkNotificationsSeenAction(): Promise<CommsActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase.rpc("admin_mark_notifications_seen");

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/notifications");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark notifications as read";
    return { ok: false, error: message };
  }
}

/**
 * Send a notification broadcast or direct message to a user.
 */
export async function adminSendNotificationAction(
  input: SendNotificationInput
): Promise<CommsActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const title = input.title?.trim();
    if (!title || title.length < 1 || title.length > 140) {
      return { ok: false, error: "Title must be between 1 and 140 characters." };
    }

    const body = input.body?.trim() || "";
    if (body.length > 500) {
      return { ok: false, error: "Body cannot exceed 500 characters." };
    }

    let href = input.href?.trim() || null;
    if (href) {
      if (!href.startsWith("/")) {
        return { ok: false, error: "Internal link must start with '/' (e.g. /home or /news)." };
      }
    }

    if (input.audience === "user" && !input.userId) {
      return { ok: false, error: "A target user ID is required when sending to a single user." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("admin_send_notification", {
      p_audience: input.audience,
      p_user_id: input.audience === "user" ? input.userId : null,
      p_title: title,
      p_body: body,
      p_href: href,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/notifications");
    return { ok: true, data: { id: data as string } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send notification";
    return { ok: false, error: message };
  }
}

/**
 * Reveal full phone number for a user with audit logging.
 */
export async function adminRevealUserPhoneAction(
  userId: string
): Promise<CommsActionResult<{ phone: string }>> {
  try {
    await requireAdmin();
    if (!userId) {
      return { ok: false, error: "User ID is required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_reveal_user_phone", {
      p_user_id: userId,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, data: { phone: (data as string) || "" } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reveal phone number";
    return { ok: false, error: message };
  }
}
