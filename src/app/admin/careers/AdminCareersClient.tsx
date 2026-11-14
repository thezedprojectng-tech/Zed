"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Globe,
  Archive,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import type { CareerRoleRow, CareerRoleStatus } from "@/data/careers";
import {
  adminSetRoleStatusAction,
  adminDeleteRoleAction,
} from "@/lib/careers/admin-actions";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { StatusPill } from "@/components/admin/people/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminCareersClientProps {
  initialRoles: CareerRoleRow[];
}

export function AdminCareersClient({ initialRoles }: AdminCareersClientProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [roles, setRoles] = useState<CareerRoleRow[]>(initialRoles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated_desc" | "updated_asc" | "title_asc">("updated_desc");
  const [isPending, startTransition] = useTransition();

  // Deletion modal state
  const [deletingRole, setDeletingRole] = useState<CareerRoleRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Counts
  const totalCount = roles.length;
  const publishedCount = roles.filter((r) => r.status === "published").length;
  const draftCount = roles.filter((r) => r.status === "draft").length;
  const closedCount = roles.filter((r) => r.status === "closed").length;

  const tabOptions = useMemo(
    () => [
      { id: "all", label: `All (${totalCount})` },
      { id: "published", label: `Published (${publishedCount})` },
      { id: "draft", label: `Draft (${draftCount})` },
      { id: "closed", label: `Closed (${closedCount})` },
    ],
    [totalCount, publishedCount, draftCount, closedCount]
  );

  const filteredRoles = useMemo(() => {
    let list = roles.filter((role) => {
      const matchesStatus =
        statusFilter === "all" ? true : role.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        role.title.toLowerCase().includes(q) ||
        role.department.toLowerCase().includes(q) ||
        role.slug.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    list.sort((a, b) => {
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      const timeA = new Date(a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.updated_at || b.created_at).getTime();
      return sortBy === "updated_asc" ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [roles, statusFilter, search, sortBy]);

  const handleStatusChange = async (
    role: CareerRoleRow,
    newStatus: CareerRoleStatus
  ) => {
    startTransition(async () => {
      try {
        const res = await adminSetRoleStatusAction({
          roleId: role.id,
          status: newStatus,
          slug: role.slug,
        });

        if (!res.ok) {
          toast.error(res.error || "Failed to update role status");
          return;
        }

        setRoles((prev) =>
          prev.map((r) =>
            r.id === role.id
              ? {
                  ...r,
                  status: newStatus,
                  posted_at: res.data?.posted_at ?? r.posted_at,
                  updated_at: new Date().toISOString(),
                }
              : r
          )
        );

        toast.success(`Role "${role.title}" marked as ${newStatus}`);
        router.refresh();
      } catch {
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);

    try {
      const res = await adminDeleteRoleAction({
        roleId: deletingRole.id,
        slug: deletingRole.slug,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to delete role");
        setIsDeleting(false);
        return;
      }

      setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id));
      toast.success(`Role "${deletingRole.title}" deleted`);
      setDeleteConfirmOpen(false);
      setDeletingRole(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("updated_desc");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Careers"
        description={`${totalCount} ${totalCount === 1 ? "role" : "roles"} · ${draftCount} ${draftCount === 1 ? "draft" : "drafts"}`}
        icon={Briefcase}
        section="programs"
        actions={
          <Button asChild size="sm" variant="default" className="gap-1.5 rounded-lg h-9 text-xs">
            <Link href="/admin/careers/new">
              <Plus className="h-4 w-4" />
              <span>New role</span>
            </Link>
          </Button>
        }
      />

      {/* Toolbar: Status Tabs + Sort + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          options={tabOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Careers status filter"
        />

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Sort selector */}
          <div className="w-36 shrink-0">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-9 text-xs rounded-lg bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="updated_desc">Recently updated</SelectItem>
                <SelectItem value="updated_asc">Oldest updated</SelectItem>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search with '/' shortcut hint */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search title, dept, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-lg bg-card border-border"
            />
            <kbd className="absolute right-2.5 top-2.5 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border/80 rounded">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {roles.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No career roles yet"
            description="Create job opportunities to recruit students and early-career talent to Zed."
            action={
              <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-lg border-border h-8 text-xs">
                <Link href="/admin/careers/new">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create first role</span>
                </Link>
              </Button>
            }
          />
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching roles"
            description="No career openings match your active search and status filter."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="rounded-lg border-border h-8 text-xs"
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-sans text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Role & Department</th>
                  <th className="py-3 px-4 font-semibold">Location & Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Updated</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRoles.map((role) => {
                  const statusVariant =
                    role.status === "published"
                      ? "verified"
                      : role.status === "draft"
                      ? "pending"
                      : "rejected";

                  return (
                    <tr
                      key={role.id}
                      onClick={() => router.push(`/admin/careers/${role.id}/edit`)}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      {/* Title & Department */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate max-w-[240px] sm:max-w-none">
                              {role.title}
                            </span>
                            {role.featured && (
                              <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-medium border border-primary/20">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground font-sans text-xs truncate max-w-[240px]">
                            {role.department}
                          </div>
                        </div>
                      </td>

                      {/* Location & Type */}
                      <td className="py-3 px-4">
                        <div className="text-foreground font-medium font-sans">
                          {role.location}
                        </div>
                        <div className="text-muted-foreground font-sans text-[11px]">
                          {role.type}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusPill variant={statusVariant as any} />
                      </td>

                      {/* Updated Date */}
                      <td className="py-3 px-4 font-sans tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(role.updated_at || role.created_at).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs rounded-md border-border"
                          >
                            <Link href={`/admin/careers/${role.id}/edit`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-md"
                                aria-label="Role actions"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-md">
                              {role.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(role, "published")}
                                  className="text-xs gap-2"
                                >
                                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Publish role</span>
                                </DropdownMenuItem>
                              )}
                              {role.status === "published" && (
                                <>
                                  <DropdownMenuItem asChild className="text-xs gap-2">
                                    <Link href={`/careers/${role.slug}`} target="_blank">
                                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>View public page</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(role, "draft")}
                                    className="text-xs gap-2"
                                  >
                                    <Archive className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Move to draft</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(role, "closed")}
                                    className="text-xs gap-2"
                                  >
                                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                    <span>Close opening</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {role.status === "closed" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(role, "published")}
                                    className="text-xs gap-2"
                                  >
                                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Reopen & publish</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(role, "draft")}
                                    className="text-xs gap-2"
                                  >
                                    <Archive className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Revert to draft</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingRole(role);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="text-xs gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete role</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground font-sans">
              Delete career role?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{deletingRole?.title}</strong>? If this role was
              previously published, external links will become invalid.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeletingRole(null);
              }}
              disabled={isDeleting}
              className="text-xs h-8 rounded-lg border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="text-xs h-8 rounded-lg gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
