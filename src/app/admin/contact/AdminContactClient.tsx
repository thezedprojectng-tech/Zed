"use client";

import { useState, useTransition, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Mail,
  AlertCircle,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  ExternalLink,
  Phone,
  User as UserIcon,
  X,
  ArrowUpDown,
} from "lucide-react";
import {
  type ContactMessageRow,
  type ContactStatus,
  CONTACT_STATUSES,
} from "@/lib/contact/schema";
import {
  adminGetContactMessages,
  adminSetContactStatus,
  adminDeleteContactMessage,
} from "@/lib/contact/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { StatusPill, StatusPillVariant } from "@/components/admin/people/StatusPill";

interface AdminContactClientProps {
  initialMessages: ContactMessageRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialUnreadCount: number;
  initialSelectedId: string | null;
  loadError?: string | null;
}

const STATUS_TO_PILL: Record<ContactStatus, StatusPillVariant> = {
  new: "new",
  read: "read",
  archived: "archived",
};

function getInitials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(isoDate: string) {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDateGroup(isoDate: string): "Today" | "Yesterday" | "This week" | "Earlier" {
  const now = new Date();
  const d = new Date(isoDate);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const t = d.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfYesterday) return "Yesterday";
  if (t >= startOfWeek) return "This week";
  return "Earlier";
}

export function AdminContactClient({
  initialMessages,
  initialTotal,
  initialPage,
  initialPageSize,
  initialUnreadCount,
  initialSelectedId,
  loadError,
}: AdminContactClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<ContactMessageRow[]>(initialMessages);
  const [total, setTotal] = useState(initialTotal);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // Filters from URL
  const statusParam = searchParams.get("status") || "all";
  const searchParam = searchParams.get("search") || "";
  const sortParam = (searchParams.get("sort") as "newest" | "oldest") || "newest";
  const pageParam = parseInt(searchParams.get("page") || "1", 10) || initialPage;
  const selectedIdParam = searchParams.get("id") || initialSelectedId;

  const [searchVal, setSearchVal] = useState(searchParam);
  const [selectedId, setSelectedId] = useState<string | null>(selectedIdParam || null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initial props change
  useEffect(() => {
    setMessages(initialMessages);
    setTotal(initialTotal);
  }, [initialMessages, initialTotal]);

  // Update URL helper
  const updateUrl = useCallback(
    (params: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, val]) => {
        if (val === null || val === "" || (key === "page" && val === "1") || (key === "status" && val === "all") || (key === "sort" && val === "newest")) {
          sp.delete(key);
        } else {
          sp.set(key, val);
        }
      });
      router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Debounced search input to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchVal !== searchParam) {
        updateUrl({ search: searchVal || null, page: "1" });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal, searchParam, updateUrl]);

  // Selected message resolution
  const selectedMessage = useMemo(() => {
    if (!selectedId) return null;
    return messages.find((m) => m.id === selectedId) || null;
  }, [messages, selectedId]);

  // Select first message automatically on desktop if none selected and messages exist
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      if (!selectedId && messages.length > 0) {
        setSelectedId(messages[0].id);
        updateUrl({ id: messages[0].id });
      }
    }
  }, [messages, selectedId, updateUrl]);

  // Mark message as read when selected
  const handleSelectMessage = useCallback(
    (msg: ContactMessageRow) => {
      setSelectedId(msg.id);
      updateUrl({ id: msg.id });

      if (msg.status === "new") {
        // Optimistic UI update
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Call server action silently
        adminSetContactStatus({ id: msg.id, status: "read" }).then((res) => {
          if (!res.ok) {
            toast.error(res.error || "Failed to mark as read");
          } else {
            router.refresh();
          }
        });
      }
    },
    [router, updateUrl]
  );

  // Actions
  const handleStatusChange = (newStatus: ContactStatus) => {
    if (!selectedMessage) return;
    const oldStatus = selectedMessage.status;

    // Optimistic UI
    setMessages((prev) =>
      prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: newStatus } : m))
    );
    if (oldStatus === "new" && newStatus !== "new") {
      setUnreadCount((c) => Math.max(0, c - 1));
    } else if (oldStatus !== "new" && newStatus === "new") {
      setUnreadCount((c) => c + 1);
    }

    startTransition(async () => {
      const res = await adminSetContactStatus({
        id: selectedMessage.id,
        status: newStatus,
      });

      if (res.ok) {
        toast.success(`Message marked as ${newStatus}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedMessage) return;
    const targetId = selectedMessage.id;
    const wasNew = selectedMessage.status === "new";

    startTransition(async () => {
      const res = await adminDeleteContactMessage({ id: targetId });
      if (res.ok) {
        toast.success("Contact message deleted");
        setMessages((prev) => prev.filter((m) => m.id !== targetId));
        setTotal((t) => Math.max(0, t - 1));
        if (wasNew) setUnreadCount((c) => Math.max(0, c - 1));

        // Select adjacent message
        const remaining = messages.filter((m) => m.id !== targetId);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
          updateUrl({ id: remaining[0].id });
        } else {
          setSelectedId(null);
          updateUrl({ id: null });
        }

        setDeleteConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete message");
      }
    });
  };

  // Sorted messages (client fallback for sort)
  const sortedMessages = useMemo(() => {
    const copy = [...messages];
    copy.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortParam === "newest" ? diff : -diff;
    });
    return copy;
  }, [messages, sortParam]);

  // Grouped by date
  const groupedMessages = useMemo(() => {
    const groups: { title: "Today" | "Yesterday" | "This week" | "Earlier"; items: ContactMessageRow[] }[] = [];
    const map = new Map<string, ContactMessageRow[]>();

    for (const msg of sortedMessages) {
      const grp = getDateGroup(msg.created_at);
      if (!map.has(grp)) {
        map.set(grp, []);
      }
      map.get(grp)!.push(msg);
    }

    const order: ("Today" | "Yesterday" | "This week" | "Earlier")[] = [
      "Today",
      "Yesterday",
      "This week",
      "Earlier",
    ];

    for (const key of order) {
      if (map.has(key) && map.get(key)!.length > 0) {
        groups.push({ title: key, items: map.get(key)! });
      }
    }

    return groups;
  }, [sortedMessages]);

  // Keyboard navigation: / focus search, j/k navigate, Enter open, e archive, Esc back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isInput) return;

      if (e.key === "Escape") {
        if (selectedId) {
          setSelectedId(null);
          updateUrl({ id: null });
        }
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = sortedMessages.findIndex((m) => m.id === selectedId);
        if (currentIndex < sortedMessages.length - 1) {
          handleSelectMessage(sortedMessages[currentIndex + 1]);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = sortedMessages.findIndex((m) => m.id === selectedId);
        if (currentIndex > 0) {
          handleSelectMessage(sortedMessages[currentIndex - 1]);
        }
      } else if (e.key === "e") {
        // Archive hotkey
        if (selectedMessage && selectedMessage.status !== "archived") {
          e.preventDefault();
          handleStatusChange("archived");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sortedMessages, selectedId, selectedMessage, handleSelectMessage, updateUrl]);

  // Navigate prev/next message
  const currentIndex = sortedMessages.findIndex((m) => m.id === selectedId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < sortedMessages.length - 1;

  const handlePrevMessage = () => {
    if (hasPrev) handleSelectMessage(sortedMessages[currentIndex - 1]);
  };
  const handleNextMessage = () => {
    if (hasNext) handleSelectMessage(sortedMessages[currentIndex + 1]);
  };

  const totalPages = Math.max(1, Math.ceil(total / initialPageSize));

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Contact inbox
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total.toLocaleString()} {total === 1 ? "message" : "messages"} &middot;{" "}
            <span
              className="font-medium"
              style={{ color: unreadCount > 0 ? "var(--data-users)" : "inherit" }}
            >
              {unreadCount} new
            </span>
          </p>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-[color:var(--data-negative-subtle)] border border-[color:var(--data-negative-border)] text-[color:var(--data-negative-ink)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── Master/Detail Container ────────────────────────────────────── */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs flex flex-col lg:flex-row min-h-[680px]">
        {/* ── Left Pane: List & Toolbar ── */}
        <div
          className={`flex flex-col border-r border-border/80 bg-card w-full lg:w-[380px] lg:shrink-0 ${
            selectedMessage ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Toolbar */}
          <div className="p-3 border-b border-border/80 space-y-2.5 bg-card/50">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search sender, email, subject... (press /)"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                maxLength={80}
                className="w-full h-8 pl-8 pr-7 rounded-md border border-border bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary transition-colors"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => setSearchVal("")}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs & Sort */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-secondary/50 border border-border/60 text-xs">
                {(["all", "new", "read", "archived"] as const).map((st) => {
                  const isActive = statusParam === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateUrl({ status: st === "all" ? null : st, page: "1" })}
                      className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                        isActive
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {/* Sort Toggle */}
              <button
                type="button"
                onClick={() =>
                  updateUrl({ sort: sortParam === "newest" ? "oldest" : "newest" })
                }
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground border border-border/60 hover:bg-secondary/40 transition-colors cursor-pointer shrink-0"
                title={`Sorted by ${sortParam} first`}
              >
                <ArrowUpDown className="h-3 w-3" />
                <span className="capitalize">{sortParam}</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto admin-scrollbar divide-y divide-border/60">
            {isPending && (
              <div className="p-2 text-center text-[11px] text-muted-foreground bg-secondary/20">
                <Loader2 className="inline-block h-3 w-3 animate-spin mr-1" />
                Updating list...
              </div>
            )}

            {sortedMessages.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-semibold text-foreground">No messages found</p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  {searchParam || statusParam !== "all"
                    ? "No contact submissions match the current filters."
                    : "No community inquiries have been submitted yet."}
                </p>
                {(searchParam || statusParam !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchVal("");
                      updateUrl({ search: null, status: null, page: "1" });
                    }}
                    className="h-7 text-xs border-border mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              groupedMessages.map((grp) => (
                <div key={grp.title}>
                  <div className="sticky top-0 z-10 px-3 py-1 bg-secondary/60 backdrop-blur-xs text-[11px] font-medium text-muted-foreground border-b border-border/40 font-sans">
                    {grp.title}
                  </div>
                  <div>
                    {grp.items.map((item, index) => {
                      const isSelected = selectedId === item.id;
                      const isNew = item.status === "new";

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectMessage(item)}
                          style={{
                            animationDelay: `${Math.min(index * 20, 240)}ms`,
                          }}
                          className={`group relative px-3 py-2.5 cursor-pointer transition-colors select-none text-left ${
                            isSelected
                              ? "bg-secondary/70"
                              : "hover:bg-secondary/35"
                          } ${isPending ? "opacity-60" : ""}`}
                        >
                          {/* Left Accent Bar on Selected */}
                          {isSelected && (
                            <span
                              className="absolute left-0 top-0 bottom-0 w-0.5"
                              style={{ backgroundColor: "var(--data-users)" }}
                              aria-hidden="true"
                            />
                          )}

                          <div className="flex items-start gap-2.5">
                            {/* Avatar Initials */}
                            <div className="h-7 w-7 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0 mt-0.5">
                              {getInitials(item.name)}
                            </div>

                            <div className="min-w-0 flex-1">
                              {/* Sender & Time */}
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs truncate ${
                                    isNew ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                                  }`}
                                >
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                  {formatRelativeTime(item.created_at)}
                                </span>
                              </div>

                              {/* Subject */}
                              <div
                                className={`text-xs truncate mt-0.5 ${
                                  isNew ? "font-medium text-foreground" : "text-foreground/75"
                                }`}
                              >
                                {item.subject}
                              </div>

                              {/* Preview Snippet */}
                              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {item.message}
                              </div>

                              {/* Status indicator */}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <StatusPill variant={STATUS_TO_PILL[item.status]} size="sm" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* List Footer: Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border/80 px-3 py-2 flex items-center justify-between bg-card text-[11px] text-muted-foreground">
              <span>
                Page {pageParam} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUrl({ page: String(Math.max(1, pageParam - 1)) })}
                  disabled={pageParam <= 1 || isPending}
                  className="h-7 px-2 text-[11px] border-border"
                >
                  <ChevronLeft className="h-3 w-3 mr-0.5" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUrl({ page: String(Math.min(totalPages, pageParam + 1)) })}
                  disabled={pageParam >= totalPages || isPending}
                  className="h-7 px-2 text-[11px] border-border"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Pane: Reading View ── */}
        <div
          className={`flex-1 flex flex-col bg-card/30 min-w-0 ${
            selectedMessage ? "flex" : "hidden lg:flex"
          }`}
        >
          {selectedMessage ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Reading Pane Header */}
              <div className="p-4 sm:p-5 border-b border-border/80 bg-card space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Mobile Back Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedId(null);
                      updateUrl({ id: null });
                    }}
                    className="lg:hidden h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to list
                  </Button>

                  <div className="hidden lg:flex items-center gap-2">
                    <StatusPill variant={STATUS_TO_PILL[selectedMessage.status]} size="md" />
                    <span className="text-xs text-muted-foreground">
                      Received{" "}
                      {new Date(selectedMessage.created_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  {/* Prev/Next arrows */}
                  <div className="flex items-center gap-1 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevMessage}
                      disabled={!hasPrev}
                      className="h-7 w-7 p-0 border-border text-muted-foreground hover:text-foreground"
                      title="Previous message (k)"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMessage}
                      disabled={!hasNext}
                      className="h-7 w-7 p-0 border-border text-muted-foreground hover:text-foreground"
                      title="Next message (j)"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Subject Title */}
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                  {selectedMessage.subject}
                </h2>

                {/* Sender Metadata Block */}
                <div className="rounded-lg bg-secondary/40 border border-border/70 p-3 sm:p-3.5 space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {selectedMessage.name}
                      </span>
                      <span className="text-muted-foreground">&bull;</span>
                      <a
                        href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(
                          `Re: ${selectedMessage.subject}`
                        )}`}
                        className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {selectedMessage.email}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </div>

                    <div className="text-[11px] text-muted-foreground lg:hidden">
                      {new Date(selectedMessage.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    {selectedMessage.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <a
                          href={`tel:${selectedMessage.phone}`}
                          className="hover:text-foreground hover:underline"
                        >
                          {selectedMessage.phone}
                        </a>
                      </div>
                    )}

                    {selectedMessage.user_id && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        <Link
                          href={`/admin/users?search=${selectedMessage.user_id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          User ID: {selectedMessage.user_id.slice(0, 8)}...
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Body (Max ~65ch, readable column, line breaks preserved) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 admin-scrollbar">
                <div className="max-w-[65ch] text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap select-text">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Sticky Action Bar */}
              <div className="border-t border-border/80 p-3 sm:p-4 bg-card/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Primary Reply */}
                  <a
                    href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Reply to {selectedMessage.name.split(" ")[0]}</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>

                  {/* Status Toggles */}
                  {selectedMessage.status !== "read" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange("read")}
                      disabled={isPending}
                      className="h-8 text-xs border-border"
                    >
                      Mark read
                    </Button>
                  )}

                  {selectedMessage.status !== "archived" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange("archived")}
                      disabled={isPending}
                      className="h-8 text-xs border-border"
                    >
                      <Archive className="h-3.5 w-3.5 mr-1" />
                      Archive
                    </Button>
                  )}

                  {selectedMessage.status !== "new" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange("new")}
                      disabled={isPending}
                      className="h-8 text-xs border-border"
                    >
                      Mark as new
                    </Button>
                  )}
                </div>

                {/* Destructive Delete */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={isPending}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            /* Empty State: No message selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/80 border border-border/60 text-muted-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">Select a message to read it</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Choose an inquiry from the list on the left to view the full details and respond.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md border border-border/80">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Confirm message deletion</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete this contact message from{" "}
              <strong>{selectedMessage?.name}</strong>? This action will remove the record from
              the database. It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-xs border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Delete permanently</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
