"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ArrowRight,
  Loader2,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getUserNotificationIcon } from "@/components/layout/NotificationBell";
import {
  getUserNotificationsAction,
  markUserNotificationsSeenAction,
  type UserNotification,
} from "@/lib/notifications/actions";

interface Props {
  initialNotifications: UserNotification[];
  initialUnreadCount: number;
}

function dayHeading(isoString: string): string {
  const d = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const ds = d.toDateString();
  if (ds === today.toDateString()) return "Today";
  if (ds === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeString(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 25);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Group notifications by day
  const groupedNotifications = useMemo(() => {
    const groups: { day: string; items: UserNotification[] }[] = [];
    const map = new Map<string, UserNotification[]>();

    for (const item of notifications) {
      const day = dayHeading(item.created_at);
      if (!map.has(day)) {
        map.set(day, []);
        groups.push({ day, items: map.get(day)! });
      }
      map.get(day)!.push(item);
    }

    return groups;
  }, [notifications]);

  // Load more via p_before
  const handleLoadMore = async () => {
    if (notifications.length === 0 || loadingMore) return;
    setLoadingMore(true);
    const lastItem = notifications[notifications.length - 1];

    try {
      const more = await getUserNotificationsAction({
        limit: 25,
        before: lastItem.created_at,
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
      const res = await markUserNotificationsSeenAction();
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })));
        toast.success("All notifications marked as read");
      } else {
        toast.error(res.error || "Failed to mark notifications as read");
      }
    });
  };

  const handleItemClick = (item: UserNotification) => {
    if (item.href && item.href.startsWith("/")) {
      router.push(item.href);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Procedural updates, verifications, and platform announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="h-8 gap-1.5 text-xs rounded-lg self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-border bg-card/40 p-10 text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary border border-border/60 text-muted-foreground mx-auto">
            <Inbox className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-semibold text-foreground">Nothing here yet</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            We will notify you about your verification status, civil guide milestones, and platform news.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map((group) => (
            <div key={group.day} className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground px-1">
                {group.day}
              </h2>

              <div className="rounded-lg border border-border bg-card/60 divide-y divide-border/60 overflow-hidden shadow-2xs">
                {group.items.map((item) => {
                  const Icon = getUserNotificationIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 sm:p-4 flex items-start gap-3.5 transition-colors duration-150 ${
                        item.href && item.href.startsWith("/")
                          ? "cursor-pointer hover:bg-muted/40"
                          : ""
                      } ${item.is_unread ? "bg-primary/[0.03]" : ""}`}
                      role={item.href?.startsWith("/") ? "button" : undefined}
                      tabIndex={item.href?.startsWith("/") ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleItemClick(item);
                      }}
                    >
                      {/* Outline Icon */}
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          item.is_unread
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-secondary border-border/70 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={`text-sm leading-snug truncate ${
                              item.is_unread
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/90"
                            }`}
                          >
                            {item.title}
                          </h3>
                          <span
                            className="text-[11px] text-muted-foreground tabular-nums shrink-0"
                            title={new Date(item.created_at).toLocaleString()}
                          >
                            {timeString(item.created_at)}
                          </span>
                        </div>

                        {item.body && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.body}
                          </p>
                        )}

                        {item.href && item.href.startsWith("/") && (
                          <div className="pt-1 flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                            <span>Open</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Unread Dot */}
                      {item.is_unread && (
                        <span
                          className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2"
                          aria-label="Unread notification"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-xs h-9 px-4 rounded-lg gap-1.5 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load more notifications</span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
