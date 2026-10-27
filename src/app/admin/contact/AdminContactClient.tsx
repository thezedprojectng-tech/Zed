"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Mail,
  AlertCircle,
  CheckCircle2,
  Archive,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  Sparkles,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AdminContactClientProps {
  initialMessages: ContactMessageRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  loadError?: string | null;
}

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }
> = {
  new: { label: "New", variant: "default", icon: Sparkles },
  read: { label: "Read", variant: "secondary", icon: CheckCircle2 },
  archived: { label: "Archived", variant: "outline", icon: Archive },
};

export function AdminContactClient({
  initialMessages,
  initialTotal,
  initialPage,
  initialPageSize,
  loadError,
}: AdminContactClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessageRow[]>(initialMessages);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / initialPageSize));

  const refreshMessages = (
    targetPage: number = page,
    targetFilter: string = statusFilter,
    targetSearch: string = search
  ) => {
    startTransition(async () => {
      const res = await adminGetContactMessages({
        page: targetPage,
        pageSize: initialPageSize,
        status: targetFilter,
        search: targetSearch,
      });

      if (res.ok && res.data) {
        setMessages(res.data);
        setTotal(res.total ?? 0);
        setPage(res.page ?? targetPage);
      } else {
        toast.error(res.error || "Failed to load messages");
      }
    });
  };

  const handleStatusChange = (newStatus: ContactStatus) => {
    if (!selectedMessage) return;

    startTransition(async () => {
      const res = await adminSetContactStatus({
        id: selectedMessage.id,
        status: newStatus,
      });

      if (res.ok) {
        toast.success(`Message marked as ${newStatus}`);
        setMessages((prev) =>
          prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: newStatus } : m))
        );
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedMessage) return;

    startTransition(async () => {
      const res = await adminDeleteContactMessage({
        id: selectedMessage.id,
      });

      if (res.ok) {
        toast.success("Contact message deleted successfully");
        setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
        setTotal((prev) => Math.max(0, prev - 1));
        setSelectedMessage(null);
        setDeleteConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete message");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-primary" />
            <span>Contact Messages Inbox</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review incoming inquiries, communicate directly with users, and manage message statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
            {total} Total Message{total === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Controls Bar: Search & Status Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(["all", ...CONTACT_STATUSES] as const).map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  refreshMessages(1, st, search);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Safe Search */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, subject..."
              value={search}
              maxLength={80}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  refreshMessages(1, statusFilter, search);
                }
              }}
              className="pl-8.5 h-9 text-xs"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refreshMessages(1, statusFilter, search)}
            disabled={isPending}
            className="h-9 px-3 text-xs"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {/* Message List */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Mail className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No messages found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || statusFilter !== "all"
                ? "No contact submissions match the selected filters. Try resetting search."
                : "You have not received any contact messages yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMessage(item)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/40 transition-colors cursor-pointer ${
                    item.status === "new" ? "bg-primary/[0.02] font-medium" : ""
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        &bull; {item.email}
                      </span>
                      {item.phone && (
                        <span className="text-xs text-muted-foreground">
                          &bull; {item.phone}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm text-foreground truncate font-display font-medium">
                      {item.subject}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <Badge variant={statusCfg.variant} className="gap-1 text-[11px] font-medium">
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusCfg.label}</span>
                    </Badge>
                    <time
                      dateTime={item.created_at}
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      {new Date(item.created_at).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-card">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total} items)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshMessages(page - 1, statusFilter, search)}
                disabled={page <= 1 || isPending}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshMessages(page + 1, statusFilter, search)}
                disabled={page >= totalPages || isPending}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Message Detail Drawer */}
      <Sheet open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6 flex flex-col">
          {selectedMessage && (
            <div className="flex-1 flex flex-col space-y-6">
              <SheetHeader className="space-y-1.5 border-b border-border pb-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={STATUS_CONFIG[selectedMessage.status].variant} className="gap-1">
                    {STATUS_CONFIG[selectedMessage.status].label}
                  </Badge>
                  <time className="text-xs text-muted-foreground">
                    {new Date(selectedMessage.created_at).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                <SheetTitle className="text-xl font-bold font-display text-foreground text-left mt-2">
                  {selectedMessage.subject}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Inquiry details submitted via the Zed Contact portal.
                </SheetDescription>
              </SheetHeader>

              {/* Sender Details Card */}
              <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sender Name:</span>
                  <span className="font-semibold text-foreground">{selectedMessage.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <a
                    href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject}`
                    )}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone / WhatsApp:</span>
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
                {selectedMessage.user_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Registered User ID:</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {selectedMessage.user_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="space-y-2 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Message Content
                </span>
                <div className="bg-card border border-border rounded-xl p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {/* Reply Button via mailto link */}
                  <a
                    href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Reply to {selectedMessage.name.split(" ")[0]}</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 px-3 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>

                {/* Status Switchers */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground shrink-0">Status:</span>
                  {selectedMessage.status !== "read" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange("read")}
                      disabled={isPending}
                      className="text-xs h-7.5"
                    >
                      Mark Read
                    </Button>
                  )}
                  {selectedMessage.status !== "archived" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange("archived")}
                      disabled={isPending}
                      className="text-xs h-7.5"
                    >
                      Archive
                    </Button>
                  )}
                  {selectedMessage.status !== "new" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange("new")}
                      disabled={isPending}
                      className="text-xs h-7.5"
                    >
                      Mark as New
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Confirm Permanent Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete this contact message from{" "}
              <strong>{selectedMessage?.name}</strong>? This action will remove the record from the
              database and record an audit log entry. It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Delete Permanently</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
