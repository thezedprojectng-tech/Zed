"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  Mail,
  Phone,
  Share2,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  type AmbassadorApplicationRow,
  type AmbassadorStatus,
} from "@/lib/ambassadors/schema";
import {
  adminGetAmbassadorApplications,
  adminSetAmbassadorStatus,
  adminDeleteAmbassadorApplication,
} from "@/lib/ambassadors/actions";
import { Input } from "@/components/ui/input";
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
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { AdminDrawer } from "@/components/admin/primitives/AdminDrawer";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { StatusPill } from "@/components/admin/people/StatusPill";
import { AgePill } from "@/components/admin/people/AgePill";
import { PanelSection, FieldList, FieldItem } from "@/components/admin/primitives/PanelSection";

interface AdminAmbassadorsClientProps {
  initialApplications: AmbassadorApplicationRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialStatus: string;
  initialSearch: string;
  loadError?: string | null;
}

const TAB_OPTIONS = [
  { id: "new", label: "New" },
  { id: "reviewing", label: "Reviewing" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminAmbassadorsClient({
  initialApplications,
  initialTotal,
  initialPage,
  initialPageSize,
  initialStatus,
  initialSearch,
  loadError,
}: AdminAmbassadorsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<AmbassadorApplicationRow[]>(initialApplications);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedApp, setSelectedApp] = useState<AmbassadorApplicationRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / initialPageSize));

  const updateUrl = useCallback(
    (newParams: { page?: number; status?: string; search?: string }) => {
      const current = new URLSearchParams(searchParams.toString());
      if (newParams.page !== undefined) current.set("page", String(newParams.page));
      if (newParams.status !== undefined) current.set("status", newParams.status);
      if (newParams.search !== undefined) {
        if (newParams.search) current.set("search", newParams.search);
        else current.delete("search");
      }
      current.set("pageSize", String(initialPageSize));
      router.push(`${pathname}?${current.toString()}`);
    },
    [pathname, router, searchParams, initialPageSize]
  );

  const fetchApplications = useCallback(
    (targetPage: number, targetStatus: string, targetSearch: string) => {
      startTransition(async () => {
        const res = await adminGetAmbassadorApplications({
          page: targetPage,
          pageSize: initialPageSize,
          status: targetStatus,
          search: targetSearch,
        });

        if (res.ok && res.data) {
          setApplications(res.data);
          setTotal(res.total ?? 0);
          setPage(res.page ?? targetPage);
          setStatusFilter(targetStatus);
        } else {
          toast.error(res.error || "Failed to load ambassador applications");
        }
      });
    },
    [initialPageSize]
  );

  const handleTabChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    updateUrl({ page: 1, status: newStatus, search });
    fetchApplications(1, newStatus, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl({ page: 1, status: statusFilter, search });
    fetchApplications(1, statusFilter, search);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage, status: statusFilter, search });
    fetchApplications(newPage, statusFilter, search);
  };

  // Find next pending/actionable application for auto-advance
  const advanceToNext = (currentId: string) => {
    const currentIndex = applications.findIndex((a) => a.id === currentId);
    if (currentIndex !== -1 && currentIndex + 1 < applications.length) {
      setSelectedApp(applications[currentIndex + 1]);
    } else {
      setSelectedApp(null);
    }
  };

  const handleStatusChange = (appId: string, newStatus: AmbassadorStatus) => {
    startTransition(async () => {
      const res = await adminSetAmbassadorStatus(appId, newStatus);
      if (res.ok) {
        toast.success(`Application marked as ${newStatus}`);
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        );
        advanceToNext(appId);
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
        const nextTarget = applications.find((a) => a.id !== appId);
        setSelectedApp(nextTarget || null);
        fetchApplications(page, statusFilter, search);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete application");
      }
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Campus Ambassadors"
        description="Review student ambassador applications across Nigerian tertiary institutions."
        icon={GraduationCap}
        section="programs"
        badge={
          <span className="font-sans tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full bg-[color:var(--data-signups-subtle)] text-[color:var(--data-signups-ink)] border border-[color:var(--data-signups-border)]">
            {total} total
          </span>
        }
      />

      {loadError && (
        <div className="rounded-lg border border-[color:var(--data-negative-border)] bg-[color:var(--data-negative-subtle)] p-4 text-xs font-medium text-[color:var(--data-negative-ink)]">
          {loadError}
        </div>
      )}

      {/* Toolbar: Segmented status tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={statusFilter}
          onChange={handleTabChange}
          ariaLabel="Ambassador application status filter"
        />

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, school, course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs rounded-lg bg-card border-border"
          />
        </form>
      </div>

      {/* Applications Table */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {isPending ? (
          <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No applications found"
            description={
              statusFilter !== "all"
                ? `No ambassador applications currently in "${statusFilter}".`
                : "No campus ambassador applications have been submitted yet."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-sans text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Applicant</th>
                  <th className="py-3 px-4 font-semibold">Institution & State</th>
                  <th className="py-3 px-4 font-semibold">Course & Level</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Submitted</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {applications.map((app) => {
                  const initials = getInitials(app.full_name);
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      {/* Applicant */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[color:var(--data-signups-subtle)] border border-[color:var(--data-signups-border)] text-[color:var(--data-signups-ink)] flex items-center justify-center font-sans font-semibold text-[11px] shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-none">
                              {app.full_name}
                            </div>
                            <div className="text-muted-foreground truncate max-w-[180px] sm:max-w-none">
                              {app.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Institution & State */}
                      <td className="py-3 px-4">
                        <div className="text-foreground font-medium truncate max-w-[200px]">
                          {app.institution}
                        </div>
                        <div className="text-muted-foreground font-sans text-xs">
                          {app.state}
                        </div>
                      </td>

                      {/* Course & Level */}
                      <td className="py-3 px-4">
                        <div className="text-foreground truncate max-w-[180px]">
                          {app.course}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {app.level}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusPill variant={app.status as any} />
                      </td>

                      {/* Submitted Date / Age */}
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-xs">
                        {app.status === "new" || app.status === "reviewing" ? (
                          <AgePill submittedAt={app.created_at} />
                        ) : (
                          new Date(app.created_at).toLocaleDateString()
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="h-7 px-2.5 text-xs text-muted-foreground group-hover:text-foreground"
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>
            Page {page} of {totalPages} ({total} applications)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || isPending}
              onClick={() => handlePageChange(page - 1)}
              className="h-8 px-2.5 rounded-lg border-border"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || isPending}
              onClick={() => handlePageChange(page + 1)}
              className="h-8 px-2.5 rounded-lg border-border"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Application Detail Drawer */}
      <AdminDrawer
        open={!!selectedApp}
        onOpenChange={(open) => !open && setSelectedApp(null)}
        title={selectedApp?.full_name || "Applicant Detail"}
        subtitle={
          selectedApp
            ? `${selectedApp.institution} • ${selectedApp.state}`
            : undefined
        }
        badge={
          selectedApp && (
            <StatusPill variant={selectedApp.status as any} />
          )
        }
        timestamp={
          selectedApp && (
            <span className="tabular-nums font-sans text-xs text-muted-foreground">
              {new Date(selectedApp.created_at).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )
        }
        footer={
          selectedApp && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-xs text-[color:var(--data-negative-ink)] border-[color:var(--data-negative-border)] hover:bg-[color:var(--data-negative-subtle)] gap-1.5 h-8 rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending || selectedApp.status === "rejected"}
                  onClick={() => handleStatusChange(selectedApp.id, "rejected")}
                  className="text-xs h-8 rounded-lg text-[color:var(--data-negative-ink)] hover:bg-[color:var(--data-negative-subtle)] border-border"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isPending || selectedApp.status === "approved"}
                  onClick={() => handleStatusChange(selectedApp.id, "approved")}
                  className="text-xs h-8 rounded-lg gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve & Advance
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedApp && (
          <div className="space-y-6 text-xs">
            {/* Quick Status Bar */}
            <PanelSection title="Set status">
              <div className="flex flex-wrap gap-1.5">
                {(["new", "reviewing", "approved", "rejected"] as AmbassadorStatus[]).map(
                  (st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={selectedApp.status === st ? "default" : "outline"}
                      disabled={isPending || selectedApp.status === st}
                      onClick={() => handleStatusChange(selectedApp.id, st)}
                      className="text-xs h-8 px-2.5 rounded-md border-border font-sans"
                    >
                      {st === "new"
                        ? "New"
                        : st === "reviewing"
                        ? "Reviewing"
                        : st === "approved"
                        ? "Approved"
                        : "Rejected"}
                    </Button>
                  )
                )}
              </div>
            </PanelSection>

            {/* Candidate details */}
            <div className="border-t border-border/60 pt-6">
              <PanelSection title="Candidate profile">
                <FieldList columns={2}>
                  <FieldItem label="Email">
                    <a
                      href={`mailto:${selectedApp.email}`}
                      className="font-medium text-primary hover:underline block truncate font-sans"
                    >
                      {selectedApp.email}
                    </a>
                  </FieldItem>
                  <FieldItem label="Phone / WhatsApp">
                    <a
                      href={`tel:${selectedApp.phone}`}
                      className="font-medium text-foreground hover:underline block truncate font-sans"
                    >
                      {selectedApp.phone}
                    </a>
                  </FieldItem>
                </FieldList>
              </PanelSection>
            </div>

            {/* Academic details */}
            <div className="border-t border-border/60 pt-6">
              <PanelSection title="Academic profile">
                <FieldList columns={2}>
                  <FieldItem label="Institution" value={selectedApp.institution} />
                  <FieldItem label="State" value={selectedApp.state} />
                  <FieldItem label="Course" value={selectedApp.course} />
                  <FieldItem label="Level" value={selectedApp.level} />
                  <FieldItem label="Social handle" value={selectedApp.social_handle || undefined} />
                  <FieldItem label="Referral code" value={selectedApp.referral_code || undefined} mono />
                </FieldList>
              </PanelSection>
            </div>

            {/* Statement of Purpose */}
            <div className="border-t border-border/60 pt-6">
              <PanelSection title="Why campus ambassador">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedApp.why_ambassador || <span className="text-muted-foreground italic font-sans">Not provided</span>}
                </p>
              </PanelSection>
            </div>
          </div>
        )}
      </AdminDrawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Ambassador Application
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete the application from{" "}
              <strong>{selectedApp?.full_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isPending}
              className="text-xs h-8 rounded-lg border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => selectedApp && handleDelete(selectedApp.id)}
              className="text-xs h-8 rounded-lg gap-1.5"
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
