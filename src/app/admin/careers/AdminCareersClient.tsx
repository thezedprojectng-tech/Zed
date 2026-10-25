"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Archive,
  ExternalLink,
  Flame,
  Search,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { CareerRoleRow, CareerRoleStatus } from "@/data/careers";
import {
  adminSetRoleStatusAction,
  adminDeleteRoleAction,
} from "@/lib/careers/admin-actions";

interface AdminCareersClientProps {
  initialRoles: CareerRoleRow[];
}

const statusBadgeStyles: Record<CareerRoleStatus, string> = {
  published:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  draft:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  closed:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
};

export function AdminCareersClient({ initialRoles }: AdminCareersClientProps) {
  const [roles, setRoles] = useState<CareerRoleRow[]>(initialRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CareerRoleRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : role.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = roles.length;
  const publishedCount = roles.filter((r) => r.status === "published").length;
  const draftCount = roles.filter((r) => r.status === "draft").length;
  const closedCount = roles.filter((r) => r.status === "closed").length;

  const handleStatusChange = async (
    role: CareerRoleRow,
    newStatus: CareerRoleStatus
  ) => {
    setIsUpdatingId(role.id);
    try {
      const res = await adminSetRoleStatusAction({
        roleId: role.id,
        status: newStatus,
        slug: role.slug,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      setRoles((prev) =>
        prev.map((r) =>
          r.id === role.id
            ? {
                ...r,
                status: newStatus,
                posted_at: res.data?.posted_at ?? r.posted_at,
              }
            : r
        )
      );

      toast.success(
        `Role "${role.title}" status changed to ${newStatus}.`
      );
    } catch {
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await adminDeleteRoleAction({
        roleId: deleteTarget.id,
        slug: deleteTarget.slug,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success(`Role "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete role.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Careers & Roles
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {totalCount} total
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create, publish, and manage job openings displayed on the public careers portal.
          </p>
        </div>

        <Link
          href="/admin/careers/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          <Plus className="size-4" />
          <span>New role</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total roles
          </span>
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Published
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Drafts
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {draftCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Closed
          </span>
          <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
            {closedCount}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, department, or slug..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "published", "draft", "closed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                statusFilter === st
                  ? "bg-foreground text-background shadow-xs font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Roles Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {filteredRoles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Title & Slug</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Location / Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Posted Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Title & Slug */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {role.title}
                          </span>
                          {role.featured && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                              <Flame className="size-2.5" />
                              Hot
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <span>/{role.slug}</span>
                          {role.status === "published" && (
                            <Link
                              href={`/careers/${role.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-0.5 ml-1"
                              title="View live role page"
                            >
                              <ExternalLink className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-foreground font-medium">
                      {role.department}
                    </td>

                    {/* Location & Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {role.location}
                        </span>
                        <span className="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {role.type}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeStyles[role.status]}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            role.status === "published"
                              ? "bg-emerald-500"
                              : role.status === "draft"
                              ? "bg-amber-500"
                              : "bg-zinc-400"
                          }`}
                        />
                        {role.status}
                      </span>
                    </td>

                    {/* Posted Date */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {role.posted_at
                        ? new Date(role.posted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Not published"}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <Link
                          href={`/admin/careers/${role.id}/edit`}
                          className="inline-flex items-center gap-1 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          title="Edit role"
                        >
                          <Edit2 className="size-3.5" />
                        </Link>

                        {role.status === "draft" && (
                          <button
                            type="button"
                            disabled={isUpdatingId === role.id}
                            onClick={() => handleStatusChange(role, "published")}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                            title="Publish role"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Publish</span>
                          </button>
                        )}

                        {role.status === "published" && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdatingId === role.id}
                              onClick={() => handleStatusChange(role, "draft")}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                              title="Set to draft"
                            >
                              <XCircle className="size-3.5" />
                              <span>Unpublish</span>
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingId === role.id}
                              onClick={() => handleStatusChange(role, "closed")}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                              title="Close role"
                            >
                              <Archive className="size-3.5" />
                              <span>Close</span>
                            </button>
                          </>
                        )}

                        {role.status === "closed" && (
                          <button
                            type="button"
                            disabled={isUpdatingId === role.id}
                            onClick={() => handleStatusChange(role, "published")}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                            title="Re-publish role"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Publish</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(role)}
                          className="inline-flex items-center p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer ml-1"
                          title="Delete role"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Briefcase className="size-5" />
            </span>
            <p className="text-base font-semibold text-foreground">
              No roles found
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {searchQuery || statusFilter !== "all"
                ? "No roles match your search or filter criteria. Try resetting filters."
                : "No career roles have been created yet. Click 'New role' to create the first opportunity."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link
                href="/admin/careers/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg"
              >
                <Plus className="size-3.5" />
                <span>Create first role</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete Career Role?
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-foreground font-semibold">
                &ldquo;{deleteTarget.title}&rdquo;
              </strong>{" "}
              (slug: <code className="font-mono text-xs">{deleteTarget.slug}</code>)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
