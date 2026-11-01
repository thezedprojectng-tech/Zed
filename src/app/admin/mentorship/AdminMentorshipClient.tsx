"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Layers,
  Calendar,
  Save,
  MessageSquare,
} from "lucide-react";
import {
  type MentorshipApplicationRow,
  type MentorshipStatus,
  MENTORSHIP_STATUSES,
} from "@/lib/mentorship/schema";
import {
  adminGetMentorshipApplications,
  adminSetMentorshipStatus,
  adminDeleteMentorshipApplication,
} from "@/lib/mentorship/actions";
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

interface AdminMentorshipClientProps {
  initialApplications: MentorshipApplicationRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  loadError?: string | null;
}

const STATUS_CONFIG: Record<
  MentorshipStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }
> = {
  new: { label: "New", variant: "default", icon: Users },
  reviewing: { label: "Reviewing", variant: "secondary", icon: Clock },
  accepted: { label: "Accepted", variant: "outline", icon: CheckCircle2 },
  waitlisted: { label: "Waitlisted", variant: "secondary", icon: Clock },
  declined: { label: "Declined", variant: "destructive", icon: XCircle },
};

export function AdminMentorshipClient({
  initialApplications,
  initialTotal,
  initialPage,
  initialPageSize,
  loadError,
}: AdminMentorshipClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<MentorshipApplicationRow[]>(initialApplications);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<MentorshipApplicationRow | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / initialPageSize));

  const refreshApplications = (
    targetPage: number = page,
    targetFilter: string = statusFilter,
    targetSearch: string = search
  ) => {
    startTransition(async () => {
      const res = await adminGetMentorshipApplications({
        page: targetPage,
        pageSize: initialPageSize,
        status: targetFilter,
        search: targetSearch,
      });

      if (res.ok && res.data) {
        setApplications(res.data);
        setTotal(res.total ?? 0);
        setPage(res.page ?? targetPage);
      } else {
        toast.error(res.error || "Failed to refresh applications");
      }
    });
  };

  const openDetailSheet = (app: MentorshipApplicationRow) => {
    setSelectedApp(app);
    setAdminNotesInput(app.admin_notes || "");
  };

  const handleStatusChange = (appId: string, newStatus: MentorshipStatus) => {
    startTransition(async () => {
      const res = await adminSetMentorshipStatus(appId, newStatus, adminNotesInput);
      if (res.ok) {
        toast.success(`Application marked as ${STATUS_CONFIG[newStatus].label}`);
        setApplications((prev) =>
          prev.map((app) =>
            app.id === appId
              ? { ...app, status: newStatus, admin_notes: adminNotesInput || app.admin_notes }
              : app
          )
        );
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) =>
            prev ? { ...prev, status: newStatus, admin_notes: adminNotesInput || prev.admin_notes } : null
          );
        }
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  const handleSaveNotes = (appId: string) => {
    if (!selectedApp) return;
    startTransition(async () => {
      const res = await adminSetMentorshipStatus(appId, selectedApp.status, adminNotesInput);
      if (res.ok) {
        toast.success("Admin notes saved");
        setApplications((prev) =>
          prev.map((app) =>
            app.id === appId ? { ...app, admin_notes: adminNotesInput } : app
          )
        );
        setSelectedApp((prev) => (prev ? { ...prev, admin_notes: adminNotesInput } : null));
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save notes");
      }
    });
  };

  const handleDelete = (appId: string) => {
    startTransition(async () => {
      const res = await adminDeleteMentorshipApplication(appId);
      if (res.ok) {
        toast.success("Application deleted");
        setDeleteConfirmOpen(false);
        setSelectedApp(null);
        refreshApplications();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete application");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Mentorship Applications</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground">
            Review and manage incoming mentorship applications across software, design, data, and product.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
            Total: {total}
          </Badge>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {loadError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("all");
              refreshApplications(1, "all", search);
            }}
            className="text-xs h-8 px-3"
          >
            All
          </Button>
          {MENTORSHIP_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(status);
                  refreshApplications(1, status, search);
                }}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <Icon className="h-3 w-3" />
                <span>{config.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search applicant or interest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                refreshApplications(1, statusFilter, search);
              }
            }}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {isPending && (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading applications...</span>
          </div>
        )}

        {!isPending && applications.length === 0 && (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-sans text-sm font-medium text-foreground">No applications found</p>
            <p className="font-sans text-xs text-muted-foreground">
              {statusFilter !== "all"
                ? `No applications with status "${statusFilter}".`
                : "No mentorship applications have been submitted yet."}
            </p>
          </div>
        )}

        {!isPending && applications.length > 0 && (
          <div className="divide-y divide-border">
            {applications.map((app) => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;
              const StatusIcon = config.icon;
              return (
                <div
                  key={app.id}
                  onClick={() => openDetailSheet(app)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-bold text-foreground truncate">
                        {app.full_name}
                      </span>
                      <Badge
                        variant={config.variant}
                        className="text-[10px] font-mono uppercase font-semibold gap-1 px-1.5 py-0"
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        <span>{config.label}</span>
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span className="capitalize">{app.interest_area.replace("_", " ")}</span>
                      </span>
                      <span>•</span>
                      <span className="capitalize">{app.experience_level}</span>
                      <span>•</span>
                      <span className="font-mono">{app.location}</span>
                    </div>

                    <p className="font-sans text-xs text-muted-foreground line-clamp-1 pt-1">
                      {app.goals}
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0 font-mono text-[11px] text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || isPending}
              onClick={() => refreshApplications(page - 1, statusFilter, search)}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || isPending}
              onClick={() => refreshApplications(page + 1, statusFilter, search)}
              className="h-8 px-2.5"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Application Detail Sheet */}
      <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto space-y-6">
          {selectedApp && (
            <>
              <SheetHeader className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={STATUS_CONFIG[selectedApp.status]?.variant || "default"}
                    className="text-[10px] font-mono uppercase"
                  >
                    {STATUS_CONFIG[selectedApp.status]?.label || selectedApp.status}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(selectedApp.created_at).toLocaleString("en-NG")}
                  </span>
                </div>
                <SheetTitle className="text-lg font-bold text-foreground">
                  {selectedApp.full_name}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground capitalize">
                  {selectedApp.interest_area.replace("_", " ")} — {selectedApp.location}
                </SheetDescription>
              </SheetHeader>

              {/* Status Update Actions */}
              <div className="space-y-1.5 border-y border-border py-4">
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Update Application Status
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {MENTORSHIP_STATUSES.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedApp.status === status ? "default" : "outline"}
                      disabled={isPending || selectedApp.status === status}
                      onClick={() => handleStatusChange(selectedApp.id, status)}
                      className="text-xs h-8"
                    >
                      {STATUS_CONFIG[status].label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Applicant Details */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      Email Address
                    </span>
                    <a
                      href={`mailto:${selectedApp.email}`}
                      className="font-medium text-primary hover:underline block"
                    >
                      {selectedApp.email}
                    </a>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      Phone / WhatsApp
                    </span>
                    <a
                      href={`tel:${selectedApp.phone}`}
                      className="font-medium text-foreground block"
                    >
                      {selectedApp.phone}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Location
                    </span>
                    <p className="font-medium text-foreground">{selectedApp.location}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Current Status
                    </span>
                    <p className="font-medium text-foreground capitalize">
                      {selectedApp.current_status.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      Area of Interest
                    </span>
                    <p className="font-medium text-foreground capitalize">
                      {selectedApp.interest_area.replace("_", " ")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      Experience Level
                    </span>
                    <p className="font-medium text-foreground capitalize">
                      {selectedApp.experience_level}
                    </p>
                  </div>
                </div>

                {selectedApp.institution && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Educational Institution</span>
                    <p className="font-medium text-foreground">{selectedApp.institution}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Availability
                    </span>
                    <p className="font-medium text-foreground">{selectedApp.availability}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground">Preferred Format</span>
                    <p className="font-medium text-foreground capitalize">
                      {selectedApp.preferred_format.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Goals &amp; What They Hope to Learn
                  </span>
                  <div className="rounded-lg bg-secondary/30 p-3.5 border border-border text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedApp.goals}
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Admin Notes
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleSaveNotes(selectedApp.id)}
                      className="text-[11px] h-7 px-2 gap-1"
                    >
                      <Save className="h-3 w-3" />
                      <span>Save Notes</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Add private internal notes about this applicant..."
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background p-3 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed resize-y"
                  />
                </div>
              </div>

              {/* Danger Zone: Delete */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5 h-9"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Application</span>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Mentorship Application
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete the application from{" "}
              <strong>{selectedApp?.full_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isPending}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => selectedApp && handleDelete(selectedApp.id)}
              className="text-xs h-8 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

