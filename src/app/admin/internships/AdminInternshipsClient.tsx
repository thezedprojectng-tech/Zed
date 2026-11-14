"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  Trash2,
  XCircle,
  AlertTriangle,
  Edit,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Mail,
  Calendar,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminInternshipWithReview } from "@/lib/internships/types";
import {
  INTERNSHIP_FIELDS,
  INTERNSHIP_WORK_MODES,
  INTERNSHIP_TYPES,
  INTERNSHIP_PAID_STATUSES,
  detectSuspiciousFeeWords,
} from "@/lib/internships/constants";
import {
  adminPublishInternshipAction,
  adminRejectInternshipAction,
  adminUnpublishInternshipAction,
  adminDeleteInternshipAction,
  adminFetchInternshipsAction,
} from "@/lib/internships/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { AgePill } from "@/components/admin/people/AgePill";
import { PanelSection, FieldList, FieldItem } from "@/components/admin/primitives/PanelSection";

interface AdminInternshipsClientProps {
  initialInternships: AdminInternshipWithReview[];
}

export function AdminInternshipsClient({ initialInternships }: AdminInternshipsClientProps) {
  const router = useRouter();
  const [internships, setInternships] = useState<AdminInternshipWithReview[]>(initialInternships);
  const [activeTab, setActiveTab] = useState<"pending" | "published" | "rejected" | "expired">("pending");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Detail / Review drawer item
  const [selectedItem, setSelectedItem] = useState<AdminInternshipWithReview | null>(null);

  // Edit / Publish Modal
  const [editingItem, setEditingItem] = useState<AdminInternshipWithReview | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    organization: string;
    location: string;
    work_mode: string;
    field: string;
    type: string;
    paid_status: string;
    description: string;
    eligibility: string;
    apply_url: string;
    apply_email: string;
    deadline: string;
  }>({
    title: "",
    organization: "",
    location: "",
    work_mode: "remote",
    field: "tech",
    type: "internship",
    paid_status: "paid",
    description: "",
    eligibility: "",
    apply_url: "",
    apply_email: "",
    deadline: "",
  });

  // Rejection Modal
  const [rejectingItem, setRejectingItem] = useState<AdminInternshipWithReview | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Delete Modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const counts = useMemo(() => {
    let pending = 0;
    let published = 0;
    let rejected = 0;
    let expired = 0;

    for (const item of internships) {
      const isPastDeadline = item.deadline && item.deadline < today;
      if (item.status === "pending") pending++;
      else if (item.status === "rejected") rejected++;
      else if (item.status === "expired" || isPastDeadline) expired++;
      else if (item.status === "published") published++;
    }

    return { pending, published, rejected, expired };
  }, [internships, today]);

  const tabOptions = useMemo(
    () => [
      { id: "pending" as const, label: "Pending", count: counts.pending },
      { id: "published" as const, label: "Published", count: counts.published },
      { id: "rejected" as const, label: "Rejected", count: counts.rejected },
      { id: "expired" as const, label: "Expired", count: counts.expired },
    ],
    [counts]
  );

  const displayedInternships = useMemo(() => {
    return internships
      .filter((item) => {
        const isPastDeadline = item.deadline && item.deadline < today;
        let tabMatches = false;
        if (activeTab === "pending") tabMatches = item.status === "pending";
        else if (activeTab === "published") tabMatches = item.status === "published" && !isPastDeadline;
        else if (activeTab === "rejected") tabMatches = item.status === "rejected";
        else if (activeTab === "expired") tabMatches = item.status === "expired" || (item.status === "published" && Boolean(isPastDeadline));

        if (!tabMatches) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchOrg = item.organization.toLowerCase().includes(q);
          const matchLoc = item.location.toLowerCase().includes(q);
          const matchField = item.field.toLowerCase().includes(q);
          return matchTitle || matchOrg || matchLoc || matchField;
        }

        return true;
      })
      .sort((a, b) => {
        // Pending: FIFO oldest first for fairness
        if (activeTab === "pending") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        // Others: Newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [internships, activeTab, search, today]);

  const refreshList = async () => {
    const res = await adminFetchInternshipsAction();
    if (res.ok && res.data) {
      setInternships(res.data);
    }
    router.refresh();
  };

  const openEditModal = (item: AdminInternshipWithReview) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      organization: item.organization,
      location: item.location,
      work_mode: item.work_mode,
      field: item.field,
      type: item.type,
      paid_status: item.paid_status,
      description: item.description,
      eligibility: item.eligibility || "",
      apply_url: item.apply_url || "",
      apply_email: item.apply_email || "",
      deadline: item.deadline ? item.deadline.split("T")[0] : "",
    });
  };

  const advanceToNext = (currentId: string) => {
    const currentIndex = displayedInternships.findIndex((i) => i.id === currentId);
    if (currentIndex !== -1 && currentIndex + 1 < displayedInternships.length) {
      setSelectedItem(displayedInternships[currentIndex + 1]);
    } else {
      setSelectedItem(null);
    }
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setActionLoading(editingItem.id);
    try {
      const res = await adminPublishInternshipAction({
        id: editingItem.id,
        ...editForm,
        apply_url: editForm.apply_url || null,
        apply_email: editForm.apply_email || null,
        deadline: editForm.deadline || null,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to publish");
        return;
      }

      toast.success("Opportunity published successfully");
      const currentId = editingItem.id;
      setEditingItem(null);
      advanceToNext(currentId);
      await refreshList();
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (rejectionReason.trim().length < 5) {
      toast.error("Rejection reason must be at least 5 characters");
      return;
    }

    setActionLoading(rejectingItem.id);
    try {
      const res = await adminRejectInternshipAction({
        id: rejectingItem.id,
        reason: rejectionReason.trim(),
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to reject");
        return;
      }

      toast.success("Opportunity rejected");
      const currentId = rejectingItem.id;
      setRejectingItem(null);
      setRejectionReason("");
      advanceToNext(currentId);
      await refreshList();
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await adminUnpublishInternshipAction(id);
      if (!res.ok) {
        toast.error(res.error || "Failed to unpublish");
        return;
      }
      toast.success("Moved back to pending queue");
      if (selectedItem?.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: "pending" } : null));
      }
      await refreshList();
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await adminDeleteInternshipAction(id);
      if (!res.ok) {
        toast.error(res.error || "Failed to delete");
        return;
      }
      toast.success("Listing deleted permanently");
      setDeletingId(null);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      await refreshList();
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Internship Radar Moderation"
        description="Verify legitimate student internships, audit suspicious fee keywords, and curate the verified opportunities board."
        icon={Briefcase}
        section="programs"
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg border-border h-8 text-xs">
            <Link href="/internships" target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Board</span>
            </Link>
          </Button>
        }
      />

      {/* Toolbar: Segmented tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
          ariaLabel="Internship status filter"
        />

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search role, company, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs rounded-lg bg-card border-border"
          />
        </div>
      </div>

      {/* Internships Table */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {displayedInternships.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No opportunities found"
            description={
              search
                ? `No results matching "${search}" in ${activeTab}.`
                : `No internships currently in the "${activeTab}" queue.`
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-sans text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Title & Organization</th>
                  <th className="py-3 px-4 font-semibold">Type & Compensation</th>
                  <th className="py-3 px-4 font-semibold">Deadline</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Submitted</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {displayedInternships.map((item) => {
                  const suspicious = detectSuspiciousFeeWords(item.description);
                  const isPastDeadline = item.deadline && item.deadline < today;
                  const isActioning = actionLoading === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      {/* Title & Organization */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                              {item.title}
                            </span>
                            {suspicious.length > 0 && (
                              <span className="font-sans text-[10px] px-1.5 py-0.5 rounded-sm bg-[color:var(--data-negative-subtle)] text-[color:var(--data-negative-ink)] border border-[color:var(--data-negative-border)] flex items-center gap-1 font-medium">
                                <ShieldAlert className="h-3 w-3" />
                                Suspect
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground truncate max-w-[200px] text-[11px] flex items-center gap-1.5 font-sans">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span>{item.organization}</span>
                            <span>•</span>
                            <span>{item.location}</span>
                          </div>
                        </div>
                      </td>

                      {/* Type & Compensation */}
                      <td className="py-3 px-4">
                        <div className="text-foreground font-medium capitalize">
                          {item.type.replace("-", " ")} ({item.work_mode})
                        </div>
                        <div className="text-muted-foreground capitalize text-[11px]">
                          {item.paid_status === "paid" ? "Paid" : item.paid_status === "stipend" ? "Stipend" : item.paid_status}
                        </div>
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.deadline ? (
                          <span
                            className={
                              isPastDeadline
                                ? "font-sans tabular-nums text-xs text-[color:var(--data-negative-ink)] font-semibold"
                                : "font-sans tabular-nums text-xs text-foreground"
                            }
                          >
                            {new Date(item.deadline).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {isPastDeadline && " (Passed)"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-sans">Rolling</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusPill variant={isPastDeadline && item.status === "published" ? "expired" : (item.status as any)} />
                      </td>

                      {/* Submitted Date / Age */}
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-xs">
                        {item.status === "pending" ? (
                          <AgePill submittedAt={item.created_at} />
                        ) : (
                          new Date(item.created_at).toLocaleDateString()
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openEditModal(item)}
                                disabled={isActioning}
                                className="h-7 px-2.5 text-xs rounded-lg gap-1"
                              >
                                Review &amp; Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectingItem(item);
                                  setRejectionReason("");
                                }}
                                disabled={isActioning}
                                className="h-7 px-2 text-xs rounded-lg text-[color:var(--data-negative-ink)] hover:bg-[color:var(--data-negative-subtle)] border-border"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {item.status === "published" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(item)}
                                disabled={isActioning}
                                className="h-7 px-2 text-xs rounded-lg border-border"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnpublish(item.id)}
                                disabled={isActioning}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <EyeOff className="h-3 w-3 mr-1" />
                                Unpublish
                              </Button>
                            </>
                          )}

                          {item.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(item)}
                              disabled={isActioning}
                              className="h-7 px-2 text-xs rounded-lg border-border"
                            >
                              Reconsider
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(item.id)}
                            disabled={isActioning}
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

      {/* Detail / Review Drawer */}
      <AdminDrawer
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        title={selectedItem?.title || "Opportunity Details"}
        subtitle={
          selectedItem
            ? `${selectedItem.organization} • ${selectedItem.location}`
            : undefined
        }
        badge={
          selectedItem && (
            <StatusPill variant={selectedItem.status as any} />
          )
        }
        timestamp={
          selectedItem && (
            <span className="tabular-nums font-sans text-xs text-muted-foreground">
              {new Date(selectedItem.created_at).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )
        }
        footer={
          selectedItem && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingId(selectedItem.id)}
                className="text-xs text-[color:var(--data-negative-ink)] border-[color:var(--data-negative-border)] hover:bg-[color:var(--data-negative-subtle)] gap-1.5 h-8 rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>

              <div className="flex items-center gap-2">
                {selectedItem.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectingItem(selectedItem);
                        setRejectionReason("");
                      }}
                      className="text-xs h-8 rounded-lg text-[color:var(--data-negative-ink)] hover:bg-[color:var(--data-negative-subtle)] border-border"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openEditModal(selectedItem)}
                      className="text-xs h-8 rounded-lg gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Review &amp; Publish
                    </Button>
                  </>
                )}

                {selectedItem.status === "published" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnpublish(selectedItem.id)}
                      className="text-xs h-8 rounded-lg border-border"
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Unpublish
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openEditModal(selectedItem)}
                      className="text-xs h-8 rounded-lg gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit Opportunity
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedItem && (
          <div className="space-y-5 text-xs">
            {/* Suspicious Fee Warning */}
            {detectSuspiciousFeeWords(selectedItem.description).length > 0 && (
              <div className="p-3.5 rounded-lg border border-[color:var(--data-negative-border)] bg-[color:var(--data-negative-subtle)] space-y-1.5 text-[color:var(--data-negative-ink)]">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Fee Warning: Suspicious keywords found</span>
                </div>
                <p className="leading-relaxed">
                  Keywords matched:{" "}
                  <strong>{detectSuspiciousFeeWords(selectedItem.description).join(", ")}</strong>. Verify this opportunity is 100% free for student applicants.
                </p>
              </div>
            )}

            {/* Submitter & Reviewer Meta */}
            <PanelSection title="Submission source">
              <FieldList columns={2}>
                <FieldItem label="Submitted by">
                  <span className="font-sans font-semibold text-foreground">
                    {selectedItem.submitter_name || selectedItem.submitter_email || "Anonymous Student"}
                  </span>
                  {selectedItem.submitter_email && (
                    <span className="text-muted-foreground text-[11px] block font-sans">
                      {selectedItem.submitter_email}
                    </span>
                  )}
                </FieldItem>
                <FieldItem label="Review status">
                  <span className="font-sans text-foreground capitalize">{selectedItem.status}</span>
                  {selectedItem.rejection_reason && (
                    <p className="text-[color:var(--data-negative-ink)] text-[11px] mt-1 font-sans">
                      Reason: {selectedItem.rejection_reason}
                    </p>
                  )}
                </FieldItem>
                <FieldItem label="Work mode & field">
                  <span className="font-sans text-foreground capitalize">
                    {selectedItem.work_mode} • {selectedItem.field}
                  </span>
                </FieldItem>
                <FieldItem label="Compensation">
                  <span className="font-sans text-foreground capitalize">
                    {selectedItem.paid_status} ({selectedItem.type.replace("-", " ")})
                  </span>
                </FieldItem>
              </FieldList>
            </PanelSection>

            {/* Description */}
            <div className="border-t border-border/60 pt-6">
              <PanelSection title="Opportunity description">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedItem.description}
                </p>
              </PanelSection>
            </div>

            {/* Eligibility */}
            {selectedItem.eligibility && (
              <div className="border-t border-border/60 pt-6">
                <PanelSection title="Eligibility criteria">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedItem.eligibility}
                  </p>
                </PanelSection>
              </div>
            )}

            {/* Application Links */}
            {(selectedItem.apply_url || selectedItem.apply_email) && (
              <div className="border-t border-border/60 pt-6">
                <PanelSection title="Application channels">
                  <FieldList columns={2}>
                    {selectedItem.apply_url && (
                      <FieldItem label="Apply portal">
                        <a
                          href={selectedItem.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline block truncate font-sans"
                        >
                          {selectedItem.apply_url}
                        </a>
                      </FieldItem>
                    )}
                    {selectedItem.apply_email && (
                      <FieldItem label="Apply email">
                        <a
                          href={`mailto:${selectedItem.apply_email}`}
                          className="font-medium text-primary hover:underline block truncate font-sans"
                        >
                          {selectedItem.apply_email}
                        </a>
                      </FieldItem>
                    )}
                  </FieldList>
                </PanelSection>
              </div>
            )}
          </div>
        )}
      </AdminDrawer>

      {/* Edit / Publish Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
          <form onSubmit={handlePublishSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Review &amp; Edit Opportunity
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sanitize role descriptions, verify stipends, and publish directly to the live board.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Job Title *</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Organization / Company *</label>
                  <Input
                    value={editForm.organization}
                    onChange={(e) => setEditForm((f) => ({ ...f, organization: e.target.value }))}
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Work Mode</label>
                  <select
                    value={editForm.work_mode}
                    onChange={(e) => setEditForm((f) => ({ ...f, work_mode: e.target.value }))}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground capitalize"
                  >
                    {INTERNSHIP_WORK_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Opportunity Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground capitalize"
                  >
                    {INTERNSHIP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Compensation</label>
                  <select
                    value={editForm.paid_status}
                    onChange={(e) => setEditForm((f) => ({ ...f, paid_status: e.target.value }))}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground capitalize"
                  >
                    {INTERNSHIP_PAID_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Field / Domain</label>
                  <select
                    value={editForm.field}
                    onChange={(e) => setEditForm((f) => ({ ...f, field: e.target.value }))}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground capitalize"
                  >
                    {INTERNSHIP_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Location (City, State) *</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    className="h-8 text-xs rounded-lg bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Job Description *</label>
                <Textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="text-xs rounded-lg bg-background border-border leading-relaxed"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Eligibility Criteria (Optional)</label>
                <Textarea
                  rows={2}
                  value={editForm.eligibility}
                  onChange={(e) => setEditForm((f) => ({ ...f, eligibility: e.target.value }))}
                  className="text-xs rounded-lg bg-background border-border leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Apply Portal URL</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={editForm.apply_url}
                    onChange={(e) => setEditForm((f) => ({ ...f, apply_url: e.target.value }))}
                    className="h-8 text-xs rounded-lg bg-background border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Apply Email</label>
                  <Input
                    type="email"
                    placeholder="careers@..."
                    value={editForm.apply_email}
                    onChange={(e) => setEditForm((f) => ({ ...f, apply_email: e.target.value }))}
                    className="h-8 text-xs rounded-lg bg-background border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Application Deadline</label>
                  <Input
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="h-8 text-xs rounded-lg bg-background border-border"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
                disabled={actionLoading !== null}
                className="text-xs h-8 rounded-lg border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={actionLoading !== null}
                className="text-xs h-8 rounded-lg gap-1.5"
              >
                {actionLoading !== null ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve &amp; Publish</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={!!rejectingItem} onOpenChange={(open) => !open && setRejectingItem(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <form onSubmit={handleRejectSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Reject Opportunity Lead
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provide a reason for moderation review (e.g., fee detected, broken link, not student-friendly).
              </DialogDescription>
            </DialogHeader>

            <div className="py-3">
              <Textarea
                rows={3}
                placeholder="Reason for rejection (at least 5 characters)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs rounded-lg bg-background border-border leading-relaxed"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectingItem(null)}
                disabled={actionLoading !== null}
                className="text-xs h-8 rounded-lg border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={actionLoading !== null || rejectionReason.trim().length < 5}
                className="text-xs h-8 rounded-lg gap-1.5"
              >
                {actionLoading !== null ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Opportunity Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this opportunity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingId(null)}
              disabled={actionLoading !== null}
              className="text-xs h-8 rounded-lg border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={actionLoading !== null}
              onClick={() => deletingId && handleDelete(deletingId)}
              className="text-xs h-8 rounded-lg gap-1.5"
            >
              {actionLoading !== null ? (
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
