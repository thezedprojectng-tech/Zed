"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  Loader2,
  ExternalLink,
  MapPin,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Home,
  GraduationCap,
  Globe,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import type { CampusHub, CampusHubStatus } from "@/lib/campus-hubs/types";
import { NIGERIAN_STATES } from "@/lib/campus-hubs/constants";
import { generateSlug } from "@/lib/campus-hubs/validation";
import {
  adminGetCampusHubs,
  adminSaveCampusHub,
  adminSetCampusHubStatus,
  adminDeleteCampusHub,
} from "@/lib/campus-hubs/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { AdminDrawer } from "@/components/admin/primitives/AdminDrawer";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { StatusPill } from "@/components/admin/people/StatusPill";

interface AdminCampusHubsClientProps {
  initialHubs: CampusHub[];
  initialStatus: string;
  initialState: string;
  initialSearch: string;
  loadError?: string | null;
}

const TAB_OPTIONS = [
  { id: "all", label: "All Hubs" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "archived", label: "Archived" },
];

export function AdminCampusHubsClient({
  initialHubs,
  initialStatus,
  initialState,
  initialSearch,
  loadError,
}: AdminCampusHubsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [hubs, setHubs] = useState<CampusHub[]>(initialHubs);
  const [activeTab, setActiveTab] = useState<string>(initialStatus);
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  // Create / Edit Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingHubId, setEditingHubId] = useState<string | null>(null);
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    state: string;
    summary: string;
    clearance_guide: string;
    hostel_guide: string;
    departments_guide: string;
  }>({
    name: "",
    slug: "",
    state: "Lagos",
    summary: "",
    clearance_guide: "",
    hostel_guide: "",
    departments_guide: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete modal state
  const [deletingHub, setDeletingHub] = useState<CampusHub | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const updateUrl = useCallback(
    (newParams: { status?: string; state?: string; search?: string }) => {
      const current = new URLSearchParams(searchParams.toString());
      if (newParams.status !== undefined) current.set("status", newParams.status);
      if (newParams.state !== undefined) current.set("state", newParams.state);
      if (newParams.search !== undefined) {
        if (newParams.search) current.set("search", newParams.search);
        else current.delete("search");
      }
      router.push(`${pathname}?${current.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const refreshHubs = useCallback(
    (targetStatus: string, targetState: string, targetSearch: string) => {
      startTransition(async () => {
        const res = await adminGetCampusHubs({
          status: targetStatus,
          state: targetState,
          search: targetSearch,
        });
        if (res.ok && res.data) {
          setHubs(res.data);
        } else {
          toast.error(res.error || "Failed to load campus hubs");
        }
      });
    },
    []
  );

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    updateUrl({ status: val, state: selectedState, search });
    refreshHubs(val, selectedState, search);
  };

  const handleStateChange = (val: string) => {
    setSelectedState(val);
    updateUrl({ status: activeTab, state: val, search });
    refreshHubs(activeTab, val, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ status: activeTab, state: selectedState, search });
    refreshHubs(activeTab, selectedState, search);
  };

  const openCreateDrawer = () => {
    setEditingHubId(null);
    setHasManuallyEditedSlug(false);
    setFormData({
      name: "",
      slug: "",
      state: "Lagos",
      summary: "",
      clearance_guide: "",
      hostel_guide: "",
      departments_guide: "",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (hub: CampusHub) => {
    setEditingHubId(hub.id);
    setHasManuallyEditedSlug(true);
    setFormData({
      name: hub.name,
      slug: hub.slug,
      state: hub.state,
      summary: hub.summary || "",
      clearance_guide: hub.clearance_guide || "",
      hostel_guide: hub.hostel_guide || "",
      departments_guide: hub.departments_guide || "",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const handleNameChange = (newName: string) => {
    setFormData((prev) => {
      const updated = { ...prev, name: newName };
      if (!hasManuallyEditedSlug && !editingHubId) {
        updated.slug = generateSlug(newName);
      }
      return updated;
    });
    if (formErrors.name) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setHasManuallyEditedSlug(true);
    setFormData((prev) => ({ ...prev, slug: newSlug.toLowerCase().trim() }));
    if (formErrors.slug) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  };

  const handleSave = () => {
    setFormErrors({});

    startTransition(async () => {
      const res = await adminSaveCampusHub({
        id: editingHubId || undefined,
        name: formData.name,
        slug: formData.slug,
        state: formData.state,
        summary: formData.summary || null,
        clearance_guide: formData.clearance_guide || null,
        hostel_guide: formData.hostel_guide || null,
        departments_guide: formData.departments_guide || null,
      });

      if (!res.ok) {
        if (res.fieldErrors) {
          setFormErrors(res.fieldErrors);
        }
        toast.error(res.error || "Failed to save campus hub");
        return;
      }

      toast.success(editingHubId ? "Campus hub updated" : "Campus hub created");
      setDrawerOpen(false);
      refreshHubs(activeTab, selectedState, search);
      router.refresh();
    });
  };

  const handleStatusChange = (hubId: string, newStatus: CampusHubStatus) => {
    startTransition(async () => {
      const res = await adminSetCampusHubStatus(hubId, newStatus);
      if (!res.ok) {
        toast.error(res.error || "Failed to update status");
        return;
      }

      toast.success(`Hub status updated to ${newStatus}`);
      setHubs((prev) =>
        prev.map((h) => (h.id === hubId ? { ...h, status: newStatus } : h))
      );
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deletingHub) return;
    startTransition(async () => {
      const res = await adminDeleteCampusHub(deletingHub.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to delete campus hub");
        return;
      }

      toast.success("Campus hub deleted");
      setHubs((prev) => prev.filter((h) => h.id !== deletingHub.id));
      setDeleteConfirmOpen(false);
      setDeletingHub(null);
      router.refresh();
    });
  };

  const filteredHubs = useMemo(() => {
    return hubs.filter((hub) => {
      if (activeTab !== "all" && hub.status !== activeTab) {
        return false;
      }
      if (selectedState !== "all" && hub.state !== selectedState) {
        return false;
      }
      if (search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        const matchName = hub.name.toLowerCase().includes(q);
        const matchSlug = hub.slug.toLowerCase().includes(q);
        const matchState = hub.state.toLowerCase().includes(q);
        return matchName || matchSlug || matchState;
      }
      return true;
    });
  }, [hubs, activeTab, selectedState, search]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Campus Hubs Moderation"
        description="Curate verified university walkthroughs, clearance procedures, and hostel accommodation guides."
        icon={Building2}
        section="programs"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg border-border h-8 text-xs">
              <Link href="/campus-hubs" target="_blank">
                <Globe className="h-3.5 w-3.5" />
                <span>Public Directory</span>
              </Link>
            </Button>
            <Button
              onClick={openCreateDrawer}
              size="sm"
              variant="default"
              className="gap-1.5 rounded-lg h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New campus hub</span>
            </Button>
          </div>
        }
      />

      {loadError && (
        <div className="rounded-lg border border-[color:var(--data-negative-border)] bg-[color:var(--data-negative-subtle)] p-4 text-xs font-medium text-[color:var(--data-negative-ink)]">
          {loadError}
        </div>
      )}

      {/* Toolbar: Segmented tabs + State filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={handleTabChange}
          ariaLabel="Campus hub status filter"
        />

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Nigerian State select filter */}
          <div className="w-40 shrink-0">
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="h-9 text-xs rounded-lg bg-card border-border">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-lg">
                <SelectItem value="all">All States</SelectItem>
                {NIGERIAN_STATES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hub name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs rounded-lg bg-card border-border"
            />
          </form>
        </div>
      </div>

      {/* Campus Hubs Table */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {isPending ? (
          <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading campus hubs...</span>
          </div>
        ) : filteredHubs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No campus hubs found"
            description={
              search || selectedState !== "all"
                ? "No campus hubs match your active filter criteria."
                : "No campus guides have been created yet."
            }
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={openCreateDrawer}
                className="gap-1.5 rounded-lg border-border h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create first campus hub</span>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Campus Hub & Slug</th>
                  <th className="py-3 px-4 font-semibold">State</th>
                  <th className="py-3 px-4 font-semibold">Guides Included</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Last Reviewed</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredHubs.map((hub) => {
                  const hasClearance = Boolean(hub.clearance_guide);
                  const hasHostel = Boolean(hub.hostel_guide);
                  const hasDepts = Boolean(hub.departments_guide);

                  return (
                    <tr
                      key={hub.id}
                      onClick={() => openEditDrawer(hub)}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Slug */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate max-w-[220px] sm:max-w-none">
                            {hub.name}
                          </div>
                          <div className="font-mono text-muted-foreground text-[11px] truncate max-w-[220px]">
                            /{hub.slug}
                          </div>
                        </div>
                      </td>

                      {/* State */}
                      <td className="py-3 px-4 font-medium text-foreground">
                        {hub.state}
                      </td>

                      {/* Guides Included */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            title="Clearance Guide"
                            className={`h-5 px-1.5 rounded-md font-mono text-[10px] flex items-center gap-1 border ${
                              hasClearance
                                ? "bg-[color:var(--data-verified-subtle)] text-[color:var(--data-verified-ink)] border-[color:var(--data-verified-border)]"
                                : "bg-muted/40 text-muted-foreground/50 border-border/40"
                            }`}
                          >
                            <FileCheck2 className="h-3 w-3" />
                            Clearance
                          </span>
                          <span
                            title="Hostel Guide"
                            className={`h-5 px-1.5 rounded-md font-mono text-[10px] flex items-center gap-1 border ${
                              hasHostel
                                ? "bg-[color:var(--data-verified-subtle)] text-[color:var(--data-verified-ink)] border-[color:var(--data-verified-border)]"
                                : "bg-muted/40 text-muted-foreground/50 border-border/40"
                            }`}
                          >
                            <Home className="h-3 w-3" />
                            Hostel
                          </span>
                          <span
                            title="Departments Guide"
                            className={`h-5 px-1.5 rounded-md font-mono text-[10px] flex items-center gap-1 border ${
                              hasDepts
                                ? "bg-[color:var(--data-verified-subtle)] text-[color:var(--data-verified-ink)] border-[color:var(--data-verified-border)]"
                                : "bg-muted/40 text-muted-foreground/50 border-border/40"
                            }`}
                          >
                            <GraduationCap className="h-3 w-3" />
                            Depts
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusPill variant={hub.status as any} />
                      </td>

                      {/* Last Reviewed / Published */}
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {hub.last_reviewed_at || hub.published_at
                          ? new Date(hub.last_reviewed_at || hub.published_at || "").toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Never"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDrawer(hub)}
                            className="h-7 px-2 text-xs rounded-lg border-border"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>

                          {hub.status === "published" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(hub.id, "draft")}
                              disabled={isPending}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Draft
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStatusChange(hub.id, "published")}
                              disabled={isPending}
                              className="h-7 px-2 text-xs rounded-lg"
                            >
                              Publish
                            </Button>
                          )}

                          {hub.status === "published" && (
                            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              <Link href={`/campus-hubs/${hub.slug}`} target="_blank">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDeletingHub(hub);
                              setDeleteConfirmOpen(true);
                            }}
                            disabled={isPending}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-[color:var(--data-negative-ink)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Create / Edit Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        widthClassName="sm:max-w-xl md:max-w-2xl"
        title={editingHubId ? "Edit Campus Hub" : "Create New Campus Hub"}
        subtitle="Manage official school walkthroughs and student relocation guides."
        badge={
          editingHubId && (
            <span className="font-mono text-[11px] text-muted-foreground">
              /{formData.slug}
            </span>
          )
        }
        footer={
          <div className="flex items-center justify-between w-full gap-2">
            {editingHubId ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = hubs.find((h) => h.id === editingHubId);
                  if (target) {
                    setDeletingHub(target);
                    setDeleteConfirmOpen(true);
                  }
                }}
                className="text-xs text-[color:var(--data-negative-ink)] border-[color:var(--data-negative-border)] hover:bg-[color:var(--data-negative-subtle)] gap-1.5 h-8 rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDrawerOpen(false)}
                disabled={isPending}
                className="text-xs h-8 rounded-lg border-border"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isPending}
                onClick={handleSave}
                className="text-xs h-8 rounded-lg gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>{editingHubId ? "Update Hub" : "Create Hub"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-xs p-5">
          {/* Institution Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">
              Institution Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. University of Lagos (UNILAG)"
              className="h-8 text-xs rounded-lg bg-background border-border"
            />
            <p className="text-[11px] text-muted-foreground">
              Official university name with acronym.
            </p>
            {formErrors.name && (
              <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)]">
                {formErrors.name}
              </p>
            )}
          </div>

          {/* URL Slug & Nigerian State */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">URL Slug *</label>
              <div className="flex items-center rounded-lg border border-border bg-background px-2.5 h-8 focus-within:ring-1 focus-within:ring-primary">
                <span className="font-mono text-muted-foreground text-[11px] select-none">
                  /campus-hubs/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="unilag"
                  className="w-full bg-transparent font-mono text-xs text-foreground focus:outline-none pl-0.5"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Lowercase letters, numbers, and hyphens.
              </p>
              {formErrors.slug && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)]">
                  {formErrors.slug}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">State *</label>
              <Select
                value={formData.state}
                onValueChange={(val) => setFormData((p) => ({ ...p, state: val }))}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-lg">
                  {NIGERIAN_STATES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Nigerian state location.</p>
              {formErrors.state && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)]">
                  {formErrors.state}
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">Short Summary</label>
            <Textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Brief overview of the institution, location, and student life..."
              className="text-xs rounded-lg bg-background border-border leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">Max 300 characters.</p>
            {formErrors.summary && (
              <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)]">
                {formErrors.summary}
              </p>
            )}
          </div>

          {/* Clearance Guide */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-primary" />
              <span>Freshers Clearance Guide (Markdown)</span>
            </label>
            <Textarea
              rows={5}
              value={formData.clearance_guide}
              onChange={(e) => setFormData((p) => ({ ...p, clearance_guide: e.target.value }))}
              placeholder="Step-by-step checklist of screening requirements, medical tests, and faculty verification..."
              className="font-mono text-xs rounded-lg bg-background border-border leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">Markdown supported. Up to 8,000 characters.</p>
          </div>

          {/* Hostel Guide */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-primary" />
              <span>Hostel &amp; Accommodation Guide (Markdown)</span>
            </label>
            <Textarea
              rows={5}
              value={formData.hostel_guide}
              onChange={(e) => setFormData((p) => ({ ...p, hostel_guide: e.target.value }))}
              placeholder="Hall allocations, private off-campus lodge prices, and safety recommendations..."
              className="font-mono text-xs rounded-lg bg-background border-border leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">Markdown supported. Up to 8,000 characters.</p>
          </div>

          {/* Departments Guide */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <span>Faculties &amp; Departments Walkthrough (Markdown)</span>
            </label>
            <Textarea
              rows={5}
              value={formData.departments_guide}
              onChange={(e) => setFormData((p) => ({ ...p, departments_guide: e.target.value }))}
              placeholder="List of faculties, common course codes, department buildings, and key faculty contacts..."
              className="font-mono text-xs rounded-lg bg-background border-border leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">Markdown supported. Up to 8,000 characters.</p>
          </div>
        </div>
      </AdminDrawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Campus Hub
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete the campus hub for{" "}
              <strong>{deletingHub?.name}</strong>? All guides associated with this hub will be
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeletingHub(null);
              }}
              disabled={isPending}
              className="text-xs h-8 rounded-lg border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
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
