"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Newspaper,
  Radio,
  MessageSquare,
  ShieldCheck,
  FileText,
  Award,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUserNotificationsAction,
  getUserUnreadNotificationCountAction,
  markUserNotificationsSeenAction,
  type UserNotification,
} from "@/lib/notifications/actions";

export function getUserNotificationIcon(type: string) {
  switch (type) {
    case "news":
      return Newspaper;
    case "announcement":
      return Radio;
    case "message":
      return MessageSquare;
    case "verification":
      return ShieldCheck;
    case "application":
      return FileText;
    case "level":
      return Award;
    default:
      return Bell;
  }
}

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
  });
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedUnreadIds, setHighlightedUnreadIds] = useState<Set<string>>(new Set());
  const markSeenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUserUnreadNotificationCountAction();
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, []);

  // Fetch recent 8
  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getUserNotificationsAction({ limit: 8 });
      setNotifications(list);

      // Snapshot unread IDs to keep them highlighted while open
      const unreadIds = new Set(list.filter((n) => n.is_unread).map((n) => n.id));
      setHighlightedUnreadIds(unreadIds);

      // Call mark_my_notifications_seen after 1s, but keep items highlighted until closed
      if (unreadIds.size > 0) {
        if (markSeenTimerRef.current) clearTimeout(markSeenTimerRef.current);
        markSeenTimerRef.current = setTimeout(async () => {
          await markUserNotificationsSeenAction();
          setUnreadCount(0);
        }, 1000);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh on mount, focus, and every 60s while visible
  useEffect(() => {
    refreshUnreadCount();

    const handleFocus = () => {
      refreshUnreadCount();
      if (open) {
        fetchRecent();
      }
    };

    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshUnreadCount();
      }
    }, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
      if (markSeenTimerRef.current) clearTimeout(markSeenTimerRef.current);
    };
  }, [refreshUnreadCount, open, fetchRecent]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      fetchRecent();
    } else {
      // When popover closes, clear the highlight snapshot
      if (markSeenTimerRef.current) clearTimeout(markSeenTimerRef.current);
      setHighlightedUnreadIds(new Set());
    }
  };

  const handleItemClick = (item: UserNotification) => {
    setOpen(false);
    if (item.href && item.href.startsWith("/")) {
      router.push(item.href);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground hover:text-foreground shrink-0"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground shadow-xs animate-in zoom-in-75">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-88 border-hairline bg-popover p-0 shadow-lg rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-card/40">
          <p className="text-xs font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/50">
          {loading ? (
            <div className="p-3 space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-1">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                <Bell className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-foreground">Nothing here yet</p>
              <p className="text-[11px] text-muted-foreground">
                We will notify you about procedure updates, verifications, and news.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = getUserNotificationIcon(item.type);
              const isHighlighted = highlightedUnreadIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-secondary/40 ${
                    isHighlighted ? "bg-primary/[0.04]" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleItemClick(item);
                  }}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      isHighlighted
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-secondary border-border/70 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <p
                        className={`text-xs truncate ${
                          isHighlighted
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground/90"
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {relativeTime(item.created_at)}
                      </span>
                    </div>
                    {item.body && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {item.body}
                      </p>
                    )}
                  </div>

                  {isHighlighted && (
                    <span
                      className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5"
                      aria-label="Unread"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/30 p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground justify-center gap-1.5"
          >
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <span>See all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
