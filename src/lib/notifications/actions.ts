"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UserNotification {
  id: string;
  type: "news" | "announcement" | "message" | "verification" | "application" | "level" | "certificate" | string;
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
  is_unread: boolean;
}

/**
 * Fetch notifications for the currently signed-in user.
 */
export async function getUserNotificationsAction(params: {
  limit?: number;
  before?: string | null;
} = {}): Promise<UserNotification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("my_notifications", {
    p_limit: params.limit ?? 20,
    p_before: params.before ?? null,
  });

  if (error) {
    console.error("my_notifications error:", error);
    return [];
  }

  return (data as UserNotification[]) || [];
}

/**
 * Fetch unread notification count for the currently signed-in user.
 */
export async function getUserUnreadNotificationCountAction(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("my_unread_notification_count");

  if (error) {
    console.error("my_unread_notification_count error:", error);
    return 0;
  }

  return typeof data === "number" ? data : Number(data) || 0;
}

/**
 * Mark all notifications as seen/read for the currently signed-in user.
 */
export async function markUserNotificationsSeenAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc("mark_my_notifications_seen");

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/notifications");
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark notifications as read";
    return { ok: false, error: message };
  }
}
