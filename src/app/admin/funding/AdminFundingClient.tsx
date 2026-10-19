"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Sparkles,
  Loader2,
  DollarSign,
  Tag,
  Briefcase,
  Layers,
  Save,
} from "lucide-react";
import {
  type FundingSubmissionRow,
  type FundingStatus,
  FUNDING_STATUSES,
} from "@/lib/funding/schema";
import {
  adminUpdateFundingSubmission,
  adminGetFundingSubmissions,
} from "@/lib/funding/actions";
import { formatNaira } from "@/lib/funding/email";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

interface AdminFundingClientProps {
  initialSubmissions: FundingSubmissionRow[];
  loadError?: string | null;
}

const STATUS_CONFIG: Record<
  FundingStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }
> = {
  new: { label: "New", variant: "default", icon: Sparkles },
  reviewing: { label: "Reviewing", variant: "secondary", icon: Clock },
  shortlisted: { label: "Shortlisted", variant: "outline", icon: CheckCircle2 },
  declined: { label: "Declined", variant: "destructive", icon: XCircle },
};

export function AdminFundingClient({
  initialSubmissions,
  loadError,
}: AdminFundingClientProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FundingSubmissionRow[]>(initialSubmissions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<FundingSubmissionRow | null>(null);

  // Detail drawer editing state
  const [editingStatus, setEditingStatus] = useState<FundingStatus>("new");
  const [editingNote, setEditingNote] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Open drawer handler
  const handleOpenDrawer = (item: FundingSubmissionRow) => {
    setSelectedItem(item);
    setEditingStatus(item.status);
    setEditingNote(item.admin_note || "");
  };

  // Status/Note update handler
  const handleSaveReview = () => {
    if (!selectedItem) return;

    startTransition(async () => {
      // Rule 4: Always send the current admin_note together with status so note is never erased
      const res = await adminUpdateFundingSubmission({
        id: selectedItem.id,
        status: editingStatus,
        adminNote: editingNote.trim() || null,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to update review status");
        return;
      }

      toast.success("Submission review updated");

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedItem.id
            ? {
                ...s,
                status: editingStatus,
                admin_note: editingNote.trim() || null,
                reviewed_at: new Date().toISOString(),
              }
            : s
        )
      );

      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              status: editingStatus,
              admin_note: editingNote.trim() || null,
              reviewed_at: new Date().toISOString(),
            }
          : null
      );

      router.refresh();
    });
  };

  // Filtered submissions in table
  const filteredSubmissions = submissions.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.project_title.toLowerCase().includes(term) ||
      item.full_name.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Idea Funding Submissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Review project proposals, track evaluation stages, and manage notes.
          </p>
        </div>
        <div className="text-xs font-mono text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md self-start sm:self-auto">
          Total: {submissions.length} proposals
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── Filters Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, applicant, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="text-xs h-8"
          >
            All ({submissions.length})
          </Button>
          {FUNDING_STATUSES.map((status) => {
            const count = submissions.filter((s) => s.status === status).length;
            return (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className="text-xs h-8 capitalize"
              >
                {status} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── Table of Submissions ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border/80 text-xs font-medium text-muted-foreground uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4">Project Title & Category</th>
                <th className="py-3 px-4">Applicant (Admin Only)</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    No funding submissions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Project Title & Category */}
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-xs">
                        <div className="truncate font-semibold">{item.project_title}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.category}</div>
                      </td>

                      {/* Applicant details */}
                      <td className="py-3.5 px-4 text-xs max-w-xs">
                        <div className="font-medium text-foreground">{item.full_name}</div>
                        <div className="text-muted-foreground truncate">{item.email}</div>
                        <div className="text-muted-foreground font-mono">{item.phone}</div>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4 text-xs capitalize">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                          {item.stage}
                        </span>
                      </td>

                      {/* Funding Needed */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">
                        {formatNaira(item.funding_needed_ngn)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={cfg.variant} className="gap-1 text-[11px] capitalize">
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDrawer(item)}
                          className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 space-y-6">
          {selectedItem && (
            <>
              <SheetHeader className="space-y-2 border-b border-border/80 pb-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={STATUS_CONFIG[selectedItem.status].variant}
                    className="capitalize gap-1"
                  >
                    {STATUS_CONFIG[selectedItem.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {selectedItem.stage} stage
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground">
                  {selectedItem.project_title}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Category: {selectedItem.category} &bull; ID: {selectedItem.id}
                </SheetDescription>
              </SheetHeader>

              {/* Applicant contact section (Admins only) */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Applicant Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>{" "}
                    <span className="font-semibold text-foreground">{selectedItem.full_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User ID:</span>{" "}
                    <span className="font-mono text-foreground">
                      {selectedItem.user_id || "Guest (Non-logged-in)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${selectedItem.email}`}
                      className="text-primary hover:underline truncate"
                    >
                      {selectedItem.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-foreground">{selectedItem.phone}</span>
                  </div>
                </div>
              </div>

              {/* Funding summary & link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground">Funding Needed:</span>
                  <div className="text-lg font-bold font-mono text-primary pt-0.5">
                    {formatNaira(selectedItem.funding_needed_ngn)}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground">Pitch / Demo Link:</span>
                  <div className="pt-1 truncate">
                    {selectedItem.link ? (
                      <a
                        href={selectedItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs truncate max-w-full"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedItem.link}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">No link provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pitch narrative blocks */}
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1.5 text-muted-foreground">
                    One-Paragraph Summary
                  </h4>
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20 text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedItem.summary}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1.5 text-muted-foreground">
                    The Problem Solved
                  </h4>
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20 text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedItem.problem}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1.5 text-muted-foreground">
                    Execution Plan For Capital
                  </h4>
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20 text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedItem.plan}
                  </div>
                </div>
              </div>

              {/* Audit & Security metadata */}
              <div className="text-[11px] text-muted-foreground font-mono space-y-1 border-t border-border/80 pt-3">
                <div>Submitted: {new Date(selectedItem.created_at).toLocaleString("en-NG")}</div>
                <div className="truncate">Client IP Hash: {selectedItem.ip_hash}</div>
                {selectedItem.reviewed_at && (
                  <div>Reviewed at: {new Date(selectedItem.reviewed_at).toLocaleString("en-NG")}</div>
                )}
              </div>

              {/* ── Admin Decision Controls ─────────────────────────────────── */}
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Admin Evaluation Controls
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="reviewStatus" className="text-xs">
                    Update Status
                  </Label>
                  <Select
                    value={editingStatus}
                    onValueChange={(val) => setEditingStatus(val as FundingStatus)}
                  >
                    <SelectTrigger id="reviewStatus" className="w-full capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNDING_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNote" className="text-xs">
                    Internal Admin Notes <span className="text-muted-foreground">(visible only to admins)</span>
                  </Label>
                  <Textarea
                    id="adminNote"
                    rows={3}
                    placeholder="Add team observations, reviewer rationale, interview feedback..."
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                    maxLength={3000}
                  />
                </div>

                <Button
                  onClick={handleSaveReview}
                  disabled={isPending}
                  className="w-full gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Review...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Review &amp; Status
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
