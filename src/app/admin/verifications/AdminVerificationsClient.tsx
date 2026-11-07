"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Copy,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  User,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  adminReviewBankVerificationAction,
  type AdminVerificationRow,
} from "./actions";

interface AdminVerificationsClientProps {
  initialRequests: AdminVerificationRow[];
  loadError?: string | null;
}

export function AdminVerificationsClient({
  initialRequests,
  loadError,
}: AdminVerificationsClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<AdminVerificationRow[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reject dialog state
  const [rejectDialogTarget, setRejectDialogTarget] = useState<AdminVerificationRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Quick stats
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  // Filter requests
  const filteredRequests = requests
    .filter((req) => {
      if (statusFilter !== "all" && req.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProfile = req.profile_full_name?.toLowerCase().includes(q) ?? false;
        const matchAccName = req.account_name.toLowerCase().includes(q);
        const matchBank = req.bank_name.toLowerCase().includes(q);
        const matchAccNum = req.account_number.includes(q);
        const matchEmail = req.user_email?.toLowerCase().includes(q) ?? false;
        return matchProfile || matchAccName || matchBank || matchAccNum || matchEmail;
      }
      return true;
    })
    .sort((a, b) => {
      // Pending list is strictly oldest first (FIFO)
      if (statusFilter === "pending") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Account number copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = (req: AdminVerificationRow) => {
    startTransition(async () => {
      const res = await adminReviewBankVerificationAction({
        verification_id: req.id,
        approve: true,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(`Verification approved for ${req.account_name}`);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                status: "approved",
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );
      router.refresh();
    });
  };

  const openRejectDialog = (req: AdminVerificationRow) => {
    setRejectDialogTarget(req);
    setRejectReason("");
    setRejectError(null);
  };

  const handleConfirmReject = () => {
    if (!rejectDialogTarget) return;

    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      setRejectError("Rejection reason must be at least 5 characters.");
      return;
    }
    if (trimmed.length > 200) {
      setRejectError("Rejection reason cannot exceed 200 characters.");
      return;
    }

    startTransition(async () => {
      const res = await adminReviewBankVerificationAction({
        verification_id: rejectDialogTarget.id,
        approve: false,
        reason: trimmed,
      });

      if (!res.ok) {
        setRejectError(res.error);
        toast.error(res.error);
        return;
      }

      toast.success("Verification request rejected");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectDialogTarget.id
            ? {
                ...r,
                status: "rejected",
                reject_reason: trimmed,
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );
      setRejectDialogTarget(null);
      router.refresh();
    });
  };

  const isNameMatch = (profileName: string | null, accountName: string) => {
    if (!profileName) return false;
    const cleanA = profileName.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
    const cleanB = accountName.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
    if (cleanA === cleanB) return true;

    // Check if parts intersect significantly
    const partsA = cleanA.split(/\s+/);
    const partsB = cleanB.split(/\s+/);
    const common = partsA.filter((p) => p.length > 2 && partsB.includes(p));
    return common.length >= 2;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ── Header & KPI Cards ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Bank Verifications Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Review submitted citizen bank accounts and approve them for identity verification and payouts.
          </p>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          onClick={() => setStatusFilter("pending")}
          className={`p-4 cursor-pointer transition-colors border ${
            statusFilter === "pending" ? "border-amber-500/50 bg-amber-500/5" : "hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{pendingCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Oldest requests prioritized first</p>
        </Card>

        <Card
          onClick={() => setStatusFilter("approved")}
          className={`p-4 cursor-pointer transition-colors border ${
            statusFilter === "approved" ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Approved Accounts</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{approvedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Granted verified citizen badge</p>
        </Card>

        <Card
          onClick={() => setStatusFilter("rejected")}
          className={`p-4 cursor-pointer transition-colors border ${
            statusFilter === "rejected" ? "border-destructive/50 bg-destructive/5" : "hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Rejected Requests</span>
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{rejectedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting user resubmission</p>
        </Card>
      </div>

      {/* ── Filters & Search ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border w-fit">
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "ghost"}
            onClick={() => setStatusFilter("pending")}
            className="text-xs h-8 px-3"
          >
            Pending ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "approved" ? "default" : "ghost"}
            onClick={() => setStatusFilter("approved")}
            className="text-xs h-8 px-3"
          >
            Approved ({approvedCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "rejected" ? "default" : "ghost"}
            onClick={() => setStatusFilter("rejected")}
            className="text-xs h-8 px-3"
          >
            Rejected ({rejectedCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "ghost"}
            onClick={() => setStatusFilter("all")}
            className="text-xs h-8 px-3"
          >
            All ({requests.length})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search name, bank, or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* ── Verifications List ───────────────────────────────────────── */}
      {filteredRequests.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {statusFilter === "pending"
              ? "All caught up! No pending bank verifications."
              : "No verification records found."}
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? "No records matched your search query. Try clearing the filter."
              : "When users submit bank accounts, they will appear here oldest first for review."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const match = isNameMatch(req.profile_full_name, req.account_name);
            return (
              <Card
                key={req.id}
                className="p-5 transition-shadow hover:shadow-sm border border-border space-y-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Side-by-Side Name Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {/* Profile Name */}
                    <div className="rounded-lg bg-muted/40 p-3 border border-border/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        <User className="h-3.5 w-3.5" />
                        <span>Profile Name</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {req.profile_full_name || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {req.user_email || req.user_phone || "User ID: " + req.user_id.slice(0, 8)}
                      </p>
                    </div>

                    {/* Bank Account Name */}
                    <div className="rounded-lg bg-muted/40 p-3 border border-border/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Bank Account Name</span>
                        </div>
                        {match ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Names similar
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Check Name
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {req.account_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Registered with bank
                      </p>
                    </div>
                  </div>

                  {/* Right: Bank Details & Full Account Number */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2 min-w-[220px]">
                    <div className="text-left lg:text-right space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        {req.bank_name} <span className="text-muted-foreground">({req.bank_code})</span>
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                          {req.account_number}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(req.account_number, req.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Copy account number"
                        >
                          {copiedId === req.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Submitted: {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-1">
                      {req.status === "pending" && (
                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Pending
                        </Badge>
                      )}
                      {req.status === "approved" && (
                        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Approved
                        </Badge>
                      )}
                      {req.status === "rejected" && (
                        <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
                          Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection reason display if rejected */}
                {req.status === "rejected" && req.reject_reason && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                    <strong>Rejection Reason:</strong> {req.reject_reason}
                  </div>
                )}

                {/* Actions for Pending */}
                {req.status === "pending" && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRejectDialog(req)}
                      disabled={isPending}
                      className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(req)}
                      disabled={isPending}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      Approve & Verify
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Reject Reason Dialog ──────────────────────────────────────── */}
      <Dialog
        open={Boolean(rejectDialogTarget)}
        onOpenChange={(open) => !open && setRejectDialogTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Bank Verification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a clear reason for rejecting this verification. This reason will be shown
              to the citizen so they can correct and resubmit.
            </DialogDescription>
          </DialogHeader>

          {rejectDialogTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted/60 p-3 text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">User: </span>
                  <span className="font-semibold">{rejectDialogTarget.profile_full_name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Name: </span>
                  <span className="font-semibold">{rejectDialogTarget.account_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bank & Account: </span>
                  <span>{rejectDialogTarget.bank_name} ({rejectDialogTarget.account_number})</span>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Quick Reason Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Account name does not match profile name",
                    "Third-party bank accounts are not permitted",
                    "Invalid bank account number or institution",
                    "Account details could not be validated",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setRejectReason(preset);
                        setRejectError(null);
                      }}
                      className="rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rejectReasonInput" className="text-xs font-medium">
                    Rejection Reason (Required)
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {rejectReason.trim().length}/200
                  </span>
                </div>
                <Textarea
                  id="rejectReasonInput"
                  placeholder="Explain why this bank account was not approved..."
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError(null);
                  }}
                  maxLength={200}
                  className="text-xs resize-none h-24"
                />
              </div>

              {rejectError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{rejectError}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogTarget(null)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isPending || rejectReason.trim().length < 5}
              className="text-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

