export type AdminNotificationType =
  | "user"
  | "ambassador"
  | "mentorship"
  | "alumni"
  | "internship"
  | "verification"
  | "contact"
  | "withdrawal"
  | "market"
  | "funding";

export interface AdminNotification {
  id: string;
  type: AdminNotificationType | string;
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
  is_unread: boolean;
}

export interface SendNotificationInput {
  audience: "all" | "user";
  userId?: string | null;
  title: string;
  body: string;
  href?: string | null;
}
