import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  adminListNotificationsAction,
  adminGetUnreadNotificationCountAction,
} from "@/lib/comms/admin-actions";
import { AdminNotificationsClient } from "./AdminNotificationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Notifications — Admin Console | Zed",
  description: "Administrative notifications inbox and broadcast communications.",
};

export default async function AdminNotificationsPage() {
  await requireAdmin();

  const [notifications, unreadCount] = await Promise.all([
    adminListNotificationsAction({ limit: 25 }),
    adminGetUnreadNotificationCountAction(),
  ]);

  return (
    <AdminNotificationsClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
