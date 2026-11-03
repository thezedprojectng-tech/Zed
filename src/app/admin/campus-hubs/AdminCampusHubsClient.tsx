"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface AdminCampusHubsClientProps {
  initialHubs: CampusHub[];
  loadError?: string | null;
}

const STATUS_CONFIG: Record<
  CampusHubStatus,
  { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }
> = {
  published: { label: "Published", variant: "default", icon: CheckCircle2 },
  draft: { label: "Draft", variant: "secondary", icon: Clock },
  archived: { label: "Archived", variant: "outline", icon: Archive },
};

export function AdminCampusHubsClient({
  initialHubs,
  loadError,
}: AdminCampusHubsClientProps) {
  const router = useRouter();
  const [hubs, setHubs] = useState<CampusHub[]>(initialHubs);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Create / Edit Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingHub, setDeletingHub] = useState<CampusHub | null>(null);

  const openCreateSheet = () => {
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
    setSheetOpen(true);
  };

  const openEditSheet = (hub: CampusHub) => {
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
    setSheetOpen(true);
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
      setSheetOpen(false);

      // Refresh list
      const fresh = await adminGetCampusHubs({ status: "all" });
      if (fresh.ok && fresh.data) {
        setHubs(fresh.data);
      }
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

      toast.success(`Hub status updated to ${STATUS_CONFIG[newStatus].label}`);
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
      if (search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        const matchName = hub.name.toLowerCase().includes(q);
        const matchSlug = hub.slug.toLowerCase().includes(q);
        const matchState = hub.state.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchState) {
          return false;
        }
      }
      return true;
    });
  }, [hubs, activeTab, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Campus Hubs</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground">
            Manage university student clearance, hostel accommodation, and departmental guides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
            Total: {hubs.length}
          </Badge>
          <Button
            size="sm"
            onClick={openCreateSheet}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Add Campus Hub</span>
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {loadError}
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className="text-xs h-8 px-3"
          >
            All ({hubs.length})
          </Button>
          {(["published", "draft", "archived"] as const).map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const count = hubs.filter((h) => h.status === status).length;
            return (
              <Button
                key={status}
                size="sm"
                variant={activeTab === status ? "default" : "outline"}
                onClick={() => setActiveTab(status)}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <Icon className="h-3 w-3" />
                <span>
                  {config.label} ({count})
                </span>
              </Button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search hub name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Hubs List */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {filteredHubs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-sans text-sm font-medium text-foreground">
              No campus hubs found
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              {hubs.length === 0
                ? "No campus hubs exist yet. Click \"Add Campus Hub\" to create the first one."
                : `No campus hubs match the selected filter "${activeTab}".`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredHubs.map((hub) => {
              const statusCfg = STATUS_CONFIG[hub.status];
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={hub.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-sans text-sm font-bold text-foreground">
                        {hub.name}
                      </h2>
                      <Badge
                        variant={statusCfg.variant}
                        className="text-[10px] font-mono uppercase font-semibold gap-1 px-1.5 py-0"
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        <span>{statusCfg.label}</span>
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        /{hub.slug}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span>{hub.state} State</span>
                      </span>
                      <span>•</span>
                      <span>
                        Clearance: {hub.clearance_guide ? "Provided" : "Empty"}
                      </span>
                      <span>•</span>
                      <span>Hostel: {hub.hostel_guide ? "Provided" : "Empty"}</span>
                      <span>•</span>
                      <span>
                        Depts: {hub.departments_guide ? "Provided" : "Empty"}
                      </span>
                    </div>

                    {hub.summary && (
                      <p className="font-sans text-xs text-muted-foreground line-clamp-1">
                        {hub.summary}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {hub.status === "published" && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                      >
                        <Link
                          href={`/campus-hubs/${hub.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSheet(hub)}
                      className="h-8 px-2.5 text-xs gap-1"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>

                    {hub.status !== "published" && (
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(hub.id, "published")}
                        className="h-8 px-2.5 text-xs gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Publish</span>
                      </Button>
                    )}

                    {hub.status === "published" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(hub.id, "draft")}
                        className="h-8 px-2.5 text-xs gap-1"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Draft</span>
                      </Button>
                    )}

                    {hub.status !== "archived" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(hub.id, "archived")}
                        className="h-8 px-2 text-xs text-muted-foreground"
                      >
                        Archive
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingHub(hub);
                        setDeleteConfirmOpen(true);
                      }}
                      className="h-8 px-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto space-y-6">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-lg font-bold text-foreground">
              {editingHubId ? "Edit Campus Hub" : "Create Campus Hub"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Provide accurate clearance checklists, hostel procedures, and departmental notes.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 text-xs">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Institution Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. University of Lagos"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`text-xs ${formErrors.name ? "border-destructive" : ""}`}
              />
              {formErrors.name && (
                <p className="text-destructive text-[11px]">{formErrors.name}</p>
              )}
            </div>

            {/* Slug & State row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">
                    URL Slug <span className="text-destructive">*</span>
                  </label>
                  {!editingHubId && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasManuallyEditedSlug(false);
                        setFormData((prev) => ({
                          ...prev,
                          slug: generateSlug(prev.name),
                        }));
                      }}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Reset to auto
                    </button>
                  )}
                </div>
                <Input
                  placeholder="e.g. university-of-lagos"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`text-xs font-mono ${
                    formErrors.slug ? "border-destructive" : ""
                  }`}
                />
                <p className="text-[10px] text-muted-foreground">
                  URL: /campus-hubs/{formData.slug || "..."}
                </p>
                {formErrors.slug && (
                  <p className="text-destructive text-[11px]">{formErrors.slug}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  State <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.state}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, state: val }))
                  }
                >
                  <SelectTrigger className="w-full text-xs h-9">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {NIGERIAN_STATES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.state && (
                  <p className="text-destructive text-[11px]">{formErrors.state}</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">
                  Overview Summary
                </label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formData.summary.length} / 300
                </span>
              </div>
              <textarea
                rows={2}
                placeholder="A concise 1-2 sentence overview of this university campus..."
                value={formData.summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, summary: e.target.value }))
                }
                className="w-full rounded-lg border border-input bg-background p-2.5 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {formErrors.summary && (
                <p className="text-destructive text-[11px]">
                  {formErrors.summary}
                </p>
              )}
            </div>

            {/* Section 1: Clearance Guide */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Clearance Guide (plain text)</span>
                </label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formData.clearance_guide.length} / 8,000
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Document checklists, administrative offices to visit, step-by-step clearance sequence.
              </p>
              <textarea
                rows={5}
                placeholder="Document Requirements:&#10;1. JAMB admission letter&#10;2. O'Level statement of result&#10;3. Birth certificate / Age declaration&#10;&#10;Procedure:&#10;Visit the faculty office for document vetting..."
                value={formData.clearance_guide}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clearance_guide: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-input bg-background p-2.5 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {formErrors.clearance_guide && (
                <p className="text-destructive text-[11px]">
                  {formErrors.clearance_guide}
                </p>
              )}
            </div>

            {/* Section 2: Hostel Guide */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-blue-600" />
                  <span>Hostel &amp; Accommodation Guide (plain text)</span>
                </label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formData.hostel_guide.length} / 8,000
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                On-campus hostel allocation procedures, payment portal, and off-campus housing guidelines.
              </p>
              <textarea
                rows={5}
                placeholder="On-Campus Hostels:&#10;Hostel portal opens 2 weeks before session resumption.&#10;&#10;Off-Campus Accommodation:&#10;Common student hubs near campus gates..."
                value={formData.hostel_guide}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hostel_guide: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-input bg-background p-2.5 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {formErrors.hostel_guide && (
                <p className="text-destructive text-[11px]">
                  {formErrors.hostel_guide}
                </p>
              )}
            </div>

            {/* Section 3: Departments Guide */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
                  <span>Departments &amp; Faculty Guide (plain text)</span>
                </label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formData.departments_guide.length} / 8,000
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Faculty breakdown, department locations, course registration requirements.
              </p>
              <textarea
                rows={5}
                placeholder="Faculty of Engineering:&#10;Civil, Electrical, Mechanical, and Systems Engineering.&#10;&#10;Course Registration:&#10;Ensure HOD signs your green file before exams..."
                value={formData.departments_guide}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    departments_guide: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-input bg-background p-2.5 font-sans text-xs text-foreground placeholder:text-muted-foreground/60 leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {formErrors.departments_guide && (
                <p className="text-destructive text-[11px]">
                  {formErrors.departments_guide}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSheetOpen(false)}
                disabled={isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending}
                className="text-xs font-semibold gap-1.5"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{editingHubId ? "Save Changes" : "Create Hub"}</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Campus Hub
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <strong>{deletingHub?.name}</strong>? This will remove all associated
              guides and cannot be undone.
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
              onClick={handleDelete}
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

