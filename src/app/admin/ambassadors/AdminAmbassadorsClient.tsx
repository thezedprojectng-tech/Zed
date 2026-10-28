"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Share2,
  Calendar,
} from "lucide-react";
import {
  type AmbassadorApplicationRow,
  type AmbassadorStatus,
  AMBASSADOR_STATUSES,
} from "@/lib/ambassadors/schema";
import {
  adminGetAmbassadorApplications,
  adminSetAmbassadorStatus,
  adminDeleteAmbassadorApplication,
} from "@/lib/ambassadors/actions";
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

interface AdminAmbassadorsClientProps {
  initialApplications: AmbassadorApplicationRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  loadError?: string | null;
}

const STATUS_CONFIG: Record<
  AmbassadorStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }
> = {
  new: { label: "New", variant: "default", icon: Sparkles },
  reviewing: { label: "Reviewing", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "outline", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

export function AdminAmbassadorsClient({
  initialApplications,
  initialTotal,
  initialPage,
  initialPageSize,
  loadError,
}: AdminAmbassadorsClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<AmbassadorApplicationRow[]>(initialApplications);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<AmbassadorApplicationRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / initialPageSize));

  const refreshApplications = (
    targetPage: number = page,
    targetFilter: string = statusFilter,
    targetSearch: string = search
  ) => {
    startTransition(async () => {
      const res = await adminGetAmbassadorApplications({
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

  const handleStatusChange = (appId: string, newStatus: AmbassadorStatus) => {
    startTransition(async () => {
      const res = await adminSetAmbassadorStatus(appId, newStatus);
      if (res.ok) {
        toast.success(`Application marked as ${STATUS_CONFIG[newStatus].label}`);
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        );
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  const handleDelete = (appId: string) => {
    startTransition(async () => {
      const res = await adminDeleteAmbassadorApplication(appId);
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
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>Campus Ambassadors</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground">
            Manage incoming student ambassador applications across Nigerian tertiary institutions.
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
          {AMBASSADOR_STATUSES.map((status) => {
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
            placeholder="Search applicant or school..."
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
            <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-sans text-sm font-medium text-foreground">No applications found</p>
            <p className="font-sans text-xs text-muted-foreground">
              {statusFilter !== "all"
                ? `No applications with status "${statusFilter}".`
                : "No campus ambassador applications have been submitted yet."}
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
                  onClick={() => setSelectedApp(app)}
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
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>{app.institution}</span>
                      </span>
                      <span>•</span>
                      <span>{app.course} ({app.level})</span>
                      <span>•</span>
                      <span className="font-mono">{app.state}</span>
                    </div>

                    <p className="font-sans text-xs text-muted-foreground line-clamp-1 pt-1">
                      {app.why_ambassador}
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
                <SheetDescription className="text-xs text-muted-foreground">
                  {selectedApp.institution} — {selectedApp.state}
                </SheetDescription>
              </SheetHeader>

              {/* Status Update Actions */}
              <div className="space-y-1.5 border-y border-border py-4">
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Update Application Status
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {AMBASSADOR_STATUSES.map((status) => (
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
                      <BookOpen className="h-3.5 w-3.5" />
                      Course & Department
                    </span>
                    <p className="font-medium text-foreground">
                      {selectedApp.course}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Level / Year
                    </span>
                    <p className="font-medium text-foreground">
                      {selectedApp.level}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Share2 className="h-3.5 w-3.5" />
                      Social Handle
                    </span>
                    <p className="font-medium text-foreground">
                      {selectedApp.social_handle || "—"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Referral Code
                    </span>
                    <p className="font-mono font-medium text-foreground">
                      {selectedApp.referral_code || "—"}
                    </p>
                  </div>
                </div>

                {/* Why Ambassador Motivation */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Why They Want to Be an Ambassador
                  </span>
                  <div className="rounded-lg bg-secondary/30 p-3.5 border border-border text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedApp.why_ambassador}
                  </div>
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
              Delete Ambassador Application
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

