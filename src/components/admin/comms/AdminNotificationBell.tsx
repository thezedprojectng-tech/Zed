"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  User,
  Award,
  GraduationCap,
  Building2,
  Briefcase,
  ShieldCheck,
  Mail,
  Banknote,
  ShoppingBag,
  Lightbulb,
  BadgeCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  adminListNotificationsAction,
  adminGetUnreadNotificationCountAction,
  adminMarkNotificationsSeenAction,
} from "@/lib/comms/admin-actions";
import type { AdminNotification, AdminNotificationType } from "@/lib/comms/types";

export function getNotificationTypeIcon(type: string) {
  switch (type) {
    case "user":
      return User;
    case "ambassador":
      return Award;
    case "mentorship":
      return GraduationCap;
    case "alumni":
      return Building2;
    case "internship":
      return Briefcase;
    case "verification":
      return ShieldCheck;
    case "contact":
      return Mail;
    case "withdrawal":
      return Banknote;
    case "market":
      return ShoppingBag;
    case "funding":
      return Lightbulb;
    case "certificate":
      return BadgeCheck;
    default:
      return Bell;
  }
}

export function getNotificationTypeLabel(type: string): string {
  if (type === "certificate") return "Certificate";
  return type || "notification";
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

export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 1. Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await adminGetUnreadNotificationCountAction();
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, []);

  // 2. Fetch latest 10 notifications for the popover
  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminListNotificationsAction({ limit: 10 });
      setNotifications(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh on mount, window focus, and every 60s while visible
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
    };
  }, [refreshUnreadCount, open, fetchRecent]);

  // When popover opens: fetch recent 10 (DO NOT auto-mark as read!)
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      fetchRecent();
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
    setOpen(false);
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/60 shrink-0"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground shadow-xs animate-in zoom-in-75">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 bg-card border border-border shadow-lg rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/70 bg-card">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleMarkAllRead}
              className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>

        {/* List of items */}
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
              <p className="text-xs font-medium text-foreground">No notifications</p>
              <p className="text-[11px] text-muted-foreground">
                You are all caught up with system activities.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = getNotificationTypeIcon(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-muted/40 ${
                    item.is_unread ? "bg-primary/[0.03]" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNotificationClick(item);
                  }}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      item.type === "certificate"
                        ? "bg-[var(--data-verified-subtle)] border-[var(--data-verified-border)] text-[var(--data-verified-ink)]"
                        : item.is_unread
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-secondary border-border/70 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <p
                        className={`text-xs truncate ${
                          item.is_unread
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
                  {item.is_unread && (
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
        <div className="border-t border-border/70 bg-card p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground justify-center gap-1.5"
          >
            <Link href="/admin/notifications" onClick={() => setOpen(false)}>
              <span>View all notifications</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
