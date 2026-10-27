"use client";

import { useState, useMemo } from "react";
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

interface AdminInternshipsClientProps {
  initialInternships: AdminInternshipWithReview[];
}

export function AdminInternshipsClient({ initialInternships }: AdminInternshipsClientProps) {
  const [internships, setInternships] = useState<AdminInternshipWithReview[]>(initialInternships);
  const [activeTab, setActiveTab] = useState<"pending" | "published" | "rejected" | "expired">("pending");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const displayedInternships = useMemo(() => {
    return internships.filter((item) => {
      const isPastDeadline = item.deadline && item.deadline < today;

      if (activeTab === "pending") {
        if (item.status !== "pending") return false;
      } else if (activeTab === "published") {
        if (item.status !== "published" || isPastDeadline) return false;
      } else if (activeTab === "rejected") {
        if (item.status !== "rejected") return false;
      } else if (activeTab === "expired") {
        if (item.status !== "expired" && !isPastDeadline) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOrg = item.organization.toLowerCase().includes(q);
        const matchesSubmitter = item.submitter_email?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOrg && !matchesSubmitter) return false;
      }

      return true;
    });
  }, [internships, activeTab, search, today]);

  const refreshList = async () => {
    const res = await adminFetchInternshipsAction();
    if (res.ok && res.data) {
      setInternships(res.data);
    }
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
      deadline: item.deadline || "",
    });
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
      setEditingItem(null);
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
      setRejectingItem(null);
      setRejectionReason("");
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
      await refreshList();
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Internship Radar Moderation</h1>
          <p className="text-xs text-muted-foreground">
            Review community submissions, enforce zero-fee compliance, and manage published opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/internships"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            <span>Live Radar</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Tabs & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "pending"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground"
            }`}
          >
            <span>Pending Queue</span>
            {counts.pending > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "pending" ? "bg-white text-primary" : "bg-primary text-primary-foreground"
              }`}>
                {counts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("published")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "published"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground"
            }`}
          >
            <span>Published</span>
            <span className="text-[10px] opacity-75">({counts.published})</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "rejected"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground"
            }`}
          >
            <span>Rejected</span>
            <span className="text-[10px] opacity-75">({counts.rejected})</span>
          </button>

          <button
            onClick={() => setActiveTab("expired")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "expired"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground"
            }`}
          >
            <span>Expired</span>
            <span className="text-[10px] opacity-75">({counts.expired})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-md text-xs bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* ── Listings Table / List ── */}
      {displayedInternships.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-border bg-card/40 space-y-2">
          <Briefcase className="h-8 w-8 text-muted-foreground mx-auto stroke-[1.5]" />
          <p className="text-xs text-muted-foreground">No listings found in this tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedInternships.map((item) => {
            const suspiciousTerms = detectSuspiciousFeeWords(
              `${item.title} ${item.description} ${item.eligibility || ""}`
            );

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-3 shadow-2xs"
              >
                {/* ── Requirement 9: Visible Warning When Text Matches Fee Words ── */}
                {suspiciousTerms.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-2.5 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Fee warning detected:</strong> Matched terms{" "}
                      <span className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">
                        {suspiciousTerms.join(", ")}
                      </span>
                      . Verify this lead does not ask applicants to pay money.
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {item.field}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary/60 text-muted-foreground capitalize">
                        {item.type.replace("-", " ")}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary/80 text-foreground">
                        {item.paid_status}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-foreground">
                      {item.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{item.organization}</span>
                      <span>•</span>
                      <span>{item.location} ({item.work_mode})</span>
                      {item.deadline && (
                        <>
                          <span>•</span>
                          <span>Deadline: {item.deadline}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Review &amp; Publish</span>
                        </button>
                        <button
                          onClick={() => {
                            setRejectingItem(item);
                            setRejectionReason("");
                          }}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {activeTab === "published" && (
                      <>
                        <Link
                          href={`/internships/${item.id}`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Link>
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleUnpublish(item.id)}
                          disabled={actionLoading === item.id}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                        >
                          Unpublish
                        </button>
                      </>
                    )}

                    {(activeTab === "rejected" || activeTab === "expired") && (
                      <button
                        onClick={() => setDeletingId(item.id)}
                        disabled={actionLoading === item.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>

                {/* Submitter & Reviewer Meta */}
                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <div>
                    Submitted {new Date(item.created_at).toLocaleDateString()}
                    {item.submitter_email && (
                      <span> by <span className="font-mono text-foreground">{item.submitter_email}</span></span>
                    )}
                  </div>

                  {item.rejection_reason && (
                    <div className="text-red-600 dark:text-red-400 font-medium">
                      Rejected: {item.rejection_reason}
                    </div>
                  )}

                  {item.apply_url && (
                    <a
                      href={item.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                    >
                      <span>{item.apply_url.slice(0, 40)}...</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {item.apply_email && (
                    <span className="font-mono text-foreground">
                      Email: {item.apply_email}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Review & Publish Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Review &amp; Edit Opportunity
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Organization</label>
                  <input
                    type="text"
                    value={editForm.organization}
                    onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Work Mode</label>
                  <select
                    value={editForm.work_mode}
                    onChange={(e) => setEditForm({ ...editForm, work_mode: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  >
                    {INTERNSHIP_WORK_MODES.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Field</label>
                  <select
                    value={editForm.field}
                    onChange={(e) => setEditForm({ ...editForm, field: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  >
                    {INTERNSHIP_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  >
                    {INTERNSHIP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Compensation</label>
                  <select
                    value={editForm.paid_status}
                    onChange={(e) => setEditForm({ ...editForm, paid_status: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  >
                    {INTERNSHIP_PAID_STATUSES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Eligibility (Optional)</label>
                <textarea
                  rows={2}
                  value={editForm.eligibility}
                  onChange={(e) => setEditForm({ ...editForm, eligibility: e.target.value })}
                  className="w-full p-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Apply URL</label>
                  <input
                    type="url"
                    value={editForm.apply_url}
                    onChange={(e) => setEditForm({ ...editForm, apply_url: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Apply Email</label>
                  <input
                    type="email"
                    value={editForm.apply_email}
                    onChange={(e) => setEditForm({ ...editForm, apply_email: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Deadline</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-secondary text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === editingItem.id}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
                >
                  {actionLoading === editingItem.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Approve &amp; Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Rejection Modal ── */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-foreground">Reject Opportunity Lead</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Please enter the reason for rejection. This note will be visible to the submitter in their submission tracker.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <textarea
                rows={3}
                placeholder="e.g. Broken application URL, duplicate listing, or requires application fee."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                className="w-full p-3 rounded-lg text-xs bg-secondary border border-border text-foreground"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-secondary text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectingItem.id || rejectionReason.trim().length < 5}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading === rejectingItem.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl text-center">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Delete Opportunity?</h3>
            <p className="text-xs text-muted-foreground">
              This action cannot be undone. The listing and all moderation records will be deleted permanently.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-secondary text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={actionLoading === deletingId}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
              >
                {actionLoading === deletingId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
