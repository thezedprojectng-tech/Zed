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
  AlertCircle,
  Loader2,
  User,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { StatusPill } from "@/components/admin/people/StatusPill";
import { AgePill } from "@/components/admin/people/AgePill";

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
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" style={{ color: "var(--data-verified)" }} />
            Bank verifications queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
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
        <div
          onClick={() => setStatusFilter("pending")}
          className={`bg-card border border-border/80 rounded-lg p-4 cursor-pointer transition-colors ${
            statusFilter === "pending"
              ? "border-[color:var(--data-flows-border)] bg-[color:var(--data-flows-subtle)]"
              : "hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending review</span>
            <Clock className="h-4 w-4" style={{ color: "var(--data-flows)" }} />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{pendingCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Oldest requests prioritized first</p>
        </div>

        <div
          onClick={() => setStatusFilter("approved")}
          className={`bg-card border border-border/80 rounded-lg p-4 cursor-pointer transition-colors ${
            statusFilter === "approved"
              ? "border-[color:var(--data-verified-border)] bg-[color:var(--data-verified-subtle)]"
              : "hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Approved accounts</span>
            <CheckCircle2 className="h-4 w-4" style={{ color: "var(--data-verified)" }} />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{approvedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Granted verified citizen badge</p>
        </div>

        <div
          onClick={() => setStatusFilter("rejected")}
          className={`bg-card border border-border/80 rounded-lg p-4 cursor-pointer transition-colors ${
            statusFilter === "rejected"
              ? "border-[color:var(--data-negative-border)] bg-[color:var(--data-negative-subtle)]"
              : "hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Rejected requests</span>
            <XCircle className="h-4 w-4" style={{ color: "var(--data-negative)" }} />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{rejectedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting user resubmission</p>
        </div>
      </div>

      {/* ── Filters & Search ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tab group */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-secondary/60 border border-border w-fit">
          {(["pending", "approved", "rejected", "all"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all capitalize ${
                statusFilter === status
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "pending" && `Pending (${pendingCount})`}
              {status === "approved" && `Approved (${approvedCount})`}
              {status === "rejected" && `Rejected (${rejectedCount})`}
              {status === "all" && `All (${requests.length})`}
            </button>
          ))}
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
        <div className="rounded-lg border border-border/80 bg-card p-10 text-center space-y-3">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-secondary/80 border border-border/60 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              {statusFilter === "pending"
                ? "Nothing waiting for review"
                : statusFilter === "approved"
                ? "No approved verifications yet"
                : statusFilter === "rejected"
                ? "No rejected verifications yet"
                : "No verification records found"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? "No records matched your search query. Try clearing the search."
                : statusFilter === "pending"
                ? "All submitted bank accounts have been reviewed"
                : "When users submit bank accounts, they will appear here"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const match = isNameMatch(req.profile_full_name, req.account_name);
            return (
              <Card
                key={req.id}
                className="p-5 transition-shadow hover:shadow-sm border border-border bg-card space-y-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Side-by-Side Name Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {/* Profile Name */}
                    <div className="rounded-lg bg-secondary/40 p-3 border border-border/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>Profile name</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {req.profile_full_name || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {req.user_email || req.user_phone || "User ID: " + req.user_id.slice(0, 8)}
                      </p>
                    </div>

                    {/* Bank Account Name */}
                    <div className="rounded-lg bg-secondary/40 p-3 border border-border/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Bank account name</span>
                        </div>
                        {match ? (
                          <StatusPill variant="verified" label="Names match" size="sm" />
                        ) : (
                          <StatusPill variant="pending" label="Check name" size="sm" />
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

                  {/* Right: Bank Details & Masked Account Number */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2 min-w-[220px]">
                    <div className="text-left lg:text-right space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        {req.bank_name}{" "}
                        <span className="text-muted-foreground">({req.bank_code})</span>
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                          {/* Privacy: show only last 4 digits */}
                          {"•••• " + req.account_number.slice(-4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(req.account_number, req.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Copy full account number"
                        >
                          {copiedId === req.id ? (
                            <Check className="h-3.5 w-3.5" style={{ color: "var(--data-verified)" }} />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] text-muted-foreground">
                          Submitted:
                        </p>
                        <AgePill submittedAt={req.created_at} />
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="pt-1">
                      {req.status === "pending" && <StatusPill variant="pending" />}
                      {req.status === "approved" && <StatusPill variant="approved" />}
                      {req.status === "rejected" && <StatusPill variant="rejected" />}
                    </div>
                  </div>
                </div>

                {/* Rejection reason display if rejected */}
                {req.status === "rejected" && req.reject_reason && (
                  <div
                    className="rounded-md p-2.5 text-xs"
                    style={{
                      background: "var(--data-negative-subtle)",
                      color: "var(--data-negative-ink)",
                      border: "1px solid var(--data-negative-border)",
                    }}
                  >
                    <strong>Rejection reason:</strong> {req.reject_reason}
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
                      className="text-xs"
                      style={{
                        borderColor: "var(--data-negative-border)",
                        color: "var(--data-negative-ink)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "var(--data-negative-subtle)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "";
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(req)}
                      disabled={isPending}
                      className="text-xs text-white"
                      style={{ background: "var(--data-verified)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                      }}
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      Approve &amp; verify
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
        <DialogContent className="sm:max-w-md border-border/80 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2"
              style={{ color: "var(--data-negative-ink)" }}
            >
              <XCircle className="h-5 w-5" />
              Reject bank verification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a clear reason for rejecting this verification. This reason will be shown
              to the citizen so they can correct and resubmit.
            </DialogDescription>
          </DialogHeader>

          {rejectDialogTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-secondary/60 p-3 text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">User: </span>
                  <span className="font-semibold">{rejectDialogTarget.profile_full_name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Account name: </span>
                  <span className="font-semibold">{rejectDialogTarget.account_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bank &amp; account: </span>
                  <span>
                    {rejectDialogTarget.bank_name} (••••{" "}
                    {rejectDialogTarget.account_number.slice(-4)})
                  </span>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Quick reason presets:
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
                      className="rounded bg-secondary px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rejectReasonInput" className="text-xs font-medium">
                    Rejection reason (required)
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
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--data-negative-ink)" }}>
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
                "Confirm rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
