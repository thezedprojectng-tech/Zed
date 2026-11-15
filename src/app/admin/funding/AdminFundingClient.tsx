"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Loader2,
  Lightbulb,
  Briefcase,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AdminPageHeader,
  SegmentedControl,
  EmptyState,
  AdminDrawer,
} from "@/components/admin/primitives";
import {
  PanelSection,
  FieldList,
  FieldItem,
} from "@/components/admin/primitives/PanelSection";
import { StatusPill } from "@/components/admin/people/StatusPill";

interface AdminFundingClientProps {
  initialSubmissions: FundingSubmissionRow[];
  loadError?: string | null;
}

const STATUS_CONFIG: Record<
  FundingStatus,
  {
    label: string;
    icon: React.ElementType;
    pillVariant: "new" | "reviewing" | "accepted" | "declined";
  }
> = {
  new: { label: "New", icon: Star, pillVariant: "new" },
  reviewing: { label: "Reviewing", icon: Clock, pillVariant: "reviewing" },
  shortlisted: {
    label: "Shortlisted",
    icon: CheckCircle2,
    pillVariant: "accepted",
  },
  declined: { label: "Declined", icon: XCircle, pillVariant: "declined" },
};

export function AdminFundingClient({
  initialSubmissions,
  loadError,
}: AdminFundingClientProps) {
  const router = useRouter();
  const [submissions, setSubmissions] =
    useState<FundingSubmissionRow[]>(initialSubmissions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] =
    useState<FundingSubmissionRow | null>(null);

  // Detail drawer editing state
  const [editingStatus, setEditingStatus] = useState<FundingStatus>("new");
  const [editingNote, setEditingNote] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Confirm dialog state
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Search bar '/' shortcut ref
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Filtered submissions
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

  // SegmentedControl tab options
  const statusTabs = [
    { value: "all" as const, label: "All", count: submissions.length },
    ...FUNDING_STATUSES.map((s) => ({
      value: s as FundingStatus,
      label: STATUS_CONFIG[s]?.label ?? s,
      count: submissions.filter((sub) => sub.status === s).length,
    })),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <AdminPageHeader
        title="Idea funding"
        description="Review project proposals and track evaluation stages."
        icon={Lightbulb}
        section="money"
      />

      {loadError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchRef}
            placeholder="Search title, applicant, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 pr-9"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-sans bg-muted/60 px-1 py-0.5 rounded border border-border/60 leading-none pointer-events-none hidden sm:flex items-center">
            /
          </kbd>
        </div>

        {/* Status filter */}
        <SegmentedControl
          options={statusTabs}
          value={statusFilter as "all" | FundingStatus}
          onChange={(v) => setStatusFilter(v)}
          size="sm"
          ariaLabel="Filter by submission status"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-muted-foreground text-xs font-medium">
                <th className="py-3 px-4">Project &amp; category</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-0">
                    <EmptyState
                      icon={Lightbulb}
                      title="No submissions found"
                      description="No funding submissions match your current search or filter."
                      compact
                      className="border-0 rounded-none"
                    />
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.new;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-all duration-150 group"
                    >
                      {/* Project Title & Category */}
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-xs">
                        <div className="truncate font-semibold">
                          {item.project_title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.category}
                        </div>
                      </td>

                      {/* Applicant */}
                      <td className="py-3.5 px-4 text-xs max-w-xs">
                        <div className="font-medium text-foreground">
                          {item.full_name}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {item.email}
                        </div>
                        <div className="text-muted-foreground font-sans tabular-nums">
                          {item.phone}
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4 text-xs capitalize">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                          {item.stage}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-sans tabular-nums text-xs font-semibold text-foreground">
                        {formatNaira(item.funding_needed_ngn)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusPill variant={cfg.pillVariant} />
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap font-sans tabular-nums">
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
                          className="h-8 gap-1.5 text-xs text-primary hover:text-primary transition-all duration-150"
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

      {/* Detail Drawer */}
      <AdminDrawer
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        title={selectedItem?.project_title ?? ""}
        subtitle={
          selectedItem
            ? `${selectedItem.category} · ${selectedItem.stage}`
            : undefined
        }
        badge={
          selectedItem ? (
            <StatusPill
              variant={
                STATUS_CONFIG[selectedItem.status]?.pillVariant ?? "new"
              }
            />
          ) : undefined
        }
        timestamp={
          selectedItem
            ? new Date(selectedItem.created_at).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : undefined
        }
        footer={
          selectedItem ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => setShowSaveConfirm(true)}
                className="gap-2 transition-all duration-150"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save review
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedItem && (
          <>
            {/* Applicant info */}
            <PanelSection title="Applicant information">
              <FieldList columns={2}>
                <FieldItem label="Full name">
                  <span className="font-sans font-semibold text-foreground">
                    {selectedItem.full_name}
                  </span>
                </FieldItem>
                <FieldItem label="User identifier">
                  <span className="font-mono text-foreground text-[11px] truncate block">
                    {selectedItem.user_id || "Guest (Non-logged-in)"}
                  </span>
                </FieldItem>
                <FieldItem label="Email">
                  <a
                    href={`mailto:${selectedItem.email}`}
                    className="font-medium text-primary hover:underline truncate block font-sans"
                  >
                    {selectedItem.email}
                  </a>
                </FieldItem>
                <FieldItem label="Phone">
                  <span className="font-sans tabular-nums text-foreground">
                    {selectedItem.phone}
                  </span>
                </FieldItem>
                <FieldItem label="Funding needed">
                  <span className="text-base font-bold font-sans tabular-nums text-primary block">
                    {formatNaira(selectedItem.funding_needed_ngn)}
                  </span>
                </FieldItem>
                <FieldItem label="Pitch / Demo link">
                  {selectedItem.link ? (
                    <a
                      href={selectedItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs truncate max-w-full font-sans"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedItem.link}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic font-sans">
                      No link provided
                    </span>
                  )}
                </FieldItem>
              </FieldList>
            </PanelSection>

            {/* Pitch narrative */}
            <PanelSection title="One-paragraph summary">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {selectedItem.summary}
              </p>
            </PanelSection>

            <PanelSection title="The problem solved">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {selectedItem.problem}
              </p>
            </PanelSection>

            <PanelSection title="Execution plan for capital">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {selectedItem.plan}
              </p>
            </PanelSection>

            {/* Audit metadata */}
            <div className="text-[11px] text-muted-foreground font-sans tabular-nums space-y-1 border-t border-border/80 pt-3">
              <div>
                Submitted:{" "}
                {new Date(selectedItem.created_at).toLocaleString("en-NG")}
              </div>
              <div className="truncate font-sans">
                IP hash:{" "}
                <span className="font-mono">{selectedItem.ip_hash}</span>
              </div>
              {selectedItem.reviewed_at && (
                <div>
                  Reviewed at:{" "}
                  {new Date(selectedItem.reviewed_at).toLocaleString("en-NG")}
                </div>
              )}
            </div>

            {/* Admin evaluation controls */}
            <PanelSection title="Admin evaluation">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewStatus" className="text-xs">
                    Update status
                  </Label>
                  <Select
                    value={editingStatus}
                    onValueChange={(val) =>
                      setEditingStatus(val as FundingStatus)
                    }
                  >
                    <SelectTrigger id="reviewStatus" className="w-full capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNDING_STATUSES.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="capitalize"
                        >
                          {STATUS_CONFIG[status]?.label ?? status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNote" className="text-xs">
                    Internal admin notes{" "}
                    <span className="text-muted-foreground">
                      (visible only to admins)
                    </span>
                  </Label>
                  <Textarea
                    id="adminNote"
                    rows={3}
                    placeholder="Add team observations, reviewer rationale, interview feedback…"
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                    maxLength={3000}
                  />
                </div>
              </div>
            </PanelSection>
          </>
        )}
      </AdminDrawer>

      {/* Confirm: Save review */}
      {selectedItem && (
        <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save review?</DialogTitle>
              <DialogDescription>
                Save review for &ldquo;{selectedItem.project_title}&rdquo;? Set
                status to &ldquo;
                <span className="font-semibold capitalize text-foreground">
                  {STATUS_CONFIG[editingStatus]?.label ?? editingStatus}
                </span>
                &rdquo;.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={isPending}
                onClick={() => {
                  setShowSaveConfirm(false);
                  handleSaveReview();
                }}
                className="gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm &amp; save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
