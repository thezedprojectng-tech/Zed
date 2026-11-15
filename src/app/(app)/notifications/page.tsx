import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getUserNotificationsAction,
  getUserUnreadNotificationCountAction,
} from "@/lib/notifications/actions";
import { NotificationsClient } from "./NotificationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Notifications — Zed",
  description: "Stay up to date with civic verifications, procedural guides, and community announcements.",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/notifications");
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotificationsAction({ limit: 25 }),
    getUserUnreadNotificationCountAction(),
  ]);

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
