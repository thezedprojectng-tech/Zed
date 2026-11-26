"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Send,
  CheckCheck,
  ExternalLink,
  Loader2,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { SendMessageDialog } from "@/components/admin/comms/SendMessageDialog";
import { getNotificationTypeIcon } from "@/components/admin/comms/AdminNotificationBell";
import {
  adminListNotificationsAction,
  adminMarkNotificationsSeenAction,
} from "@/lib/comms/admin-actions";
import type { AdminNotification, AdminNotificationType } from "@/lib/comms/types";

interface Props {
  initialNotifications: AdminNotification[];
  initialUnreadCount: number;
}

const TYPE_FILTER_OPTIONS: { id: string; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "user", label: "Users" },
  { id: "verification", label: "Verifications" },
  { id: "ambassador", label: "Ambassadors" },
  { id: "mentorship", label: "Mentorship" },
  { id: "alumni", label: "Alumni" },
  { id: "internship", label: "Internships" },
  { id: "contact", label: "Contact inbox" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "market", label: "Marketplace" },
  { id: "funding", label: "Funding" },
  { id: "certificate", label: "Certificate" },
];

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminNotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 25);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Filter change
  const handleTypeChange = async (type: string) => {
    setSelectedType(type);
    startTransition(async () => {
      const list = await adminListNotificationsAction({
        limit: 25,
        type: type === "all" ? null : type,
      });
      setNotifications(list);
      setHasMore(list.length >= 25);
    });
  };

  // Load more with cursor (p_before)
  const handleLoadMore = async () => {
    if (notifications.length === 0 || loadingMore) return;
    setLoadingMore(true);
    const lastItem = notifications[notifications.length - 1];
    try {
      const more = await adminListNotificationsAction({
        limit: 25,
        before: lastItem.created_at,
        type: selectedType === "all" ? null : selectedType,
      });
      if (more.length < 25) {
        setHasMore(false);
      }
      setNotifications((prev) => [...prev, ...more]);
    } catch {
      toast.error("Failed to load more notifications");
    } finally {
      setLoadingMore(false);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    startTransition(async () => {
      const res = await adminMarkNotificationsSeenAction();
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })));
        toast.success("All notifications marked as read");
      } else {
        toast.error(res.error || "Failed to mark as read");
      }
    });
  };

  const handleNotificationClick = (item: AdminNotification) => {
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <main className="space-y-6 max-w-[1400px] mx-auto">
      <AdminPageHeader
        section="communication"
        icon={Bell}
        title="Notifications"
        description="Administrative activity stream, system alerts, and user broadcast messaging."
        badge={
          unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {unreadCount} unread
            </span>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="h-9 gap-1.5 text-xs rounded-md"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all as read</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setSendMessageOpen(true)}
              className="h-9 gap-1.5 text-xs rounded-md"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send message</span>
            </Button>
          </div>
        }
      />

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 admin-scrollbar select-none">
        {TYPE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleTypeChange(opt.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors border ${
              selectedType === opt.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications found"
          description={
            selectedType !== "all"
              ? "No notifications recorded for the selected filter category."
              : "No administrative notifications recorded yet."
          }
          action={
            selectedType !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTypeChange("all")}
                className="text-xs"
              >
                View all notifications
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          className={`rounded-lg border border-border bg-card overflow-hidden divide-y divide-border/60 transition-opacity duration-150 ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
          {notifications.map((item) => {
            const Icon = getNotificationTypeIcon(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer hover:bg-muted/40 ${
                  item.is_unread ? "bg-primary/[0.03]" : ""
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNotificationClick(item);
                }}
              >
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                    item.type === "certificate"
                      ? "bg-[var(--data-verified-subtle)] border-[var(--data-verified-border)] text-[var(--data-verified-ink)]"
                      : item.is_unread
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-secondary border-border/70 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={
                          item.type === "certificate"
                            ? "text-[10px] font-semibold border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)] px-2 py-0.5 rounded-md shrink-0"
                            : "text-xs uppercase tracking-wider text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md shrink-0"
                        }
                      >
                        {item.type === "certificate" ? "Certificate" : item.type || "notification"}
                      </span>
                      <h3
                        className={`text-sm truncate ${
                          item.is_unread
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground/90"
                        }`}
                      >
                        {item.title}
                      </h3>
                    </div>
                    <span
                      className="text-xs text-muted-foreground tabular-nums shrink-0"
                      title={new Date(item.created_at).toLocaleString()}
                    >
                      {relativeTime(item.created_at)}
                    </span>
                  </div>

                  {item.body && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.body}
                    </p>
                  )}

                  {item.href && (
                    <div className="pt-1 flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <span>View details</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {item.is_unread && (
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-2"
                    aria-label="Unread notification"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && notifications.length > 0 && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs h-9 px-4 rounded-md gap-1.5"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading more...</span>
              </>
            ) : (
              <span>Load older notifications</span>
            )}
          </Button>
        </div>
      )}

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={sendMessageOpen}
        onOpenChange={setSendMessageOpen}
        onSuccess={() => handleTypeChange(selectedType)}
      />
    </main>
  );
}
