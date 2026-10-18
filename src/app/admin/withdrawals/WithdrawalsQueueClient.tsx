"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  Building2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ArrowUpDown,
  Coins,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { maskAccountNumber } from "@/lib/withdraw/helpers";
import { adminReviewWithdrawalAction } from "@/lib/withdraw/actions";
import type { WithdrawalRequest, WithdrawalStatus } from "@/lib/withdraw/types";
import { cn } from "@/lib/utils";

interface WithdrawalsQueueClientProps {
  initialRequests: WithdrawalRequest[];
}

export function WithdrawalsQueueClient({
  initialRequests,
}: WithdrawalsQueueClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [unmaskedIds, setUnmaskedIds] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // Dialog states for reject and mark paid
  const [rejectDialogTarget, setRejectDialogTarget] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const [paidDialogTarget, setPaidDialogTarget] = useState<WithdrawalRequest | null>(null);
  const [paidNote, setPaidNote] = useState<string>("");

  // Quick stats
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const paidRequests = requests.filter((r) => r.status === "paid");

  const totalPendingNaira = pendingRequests.reduce((sum, r) => sum + r.amount_ngn, 0);
  const totalApprovedNaira = approvedRequests.reduce((sum, r) => sum + r.amount_ngn, 0);
  const totalPaidNaira = paidRequests.reduce((sum, r) => sum + r.amount_ngn, 0);

  // Filtered requests
  const filteredRequests = requests.filter((req) => {
    if (statusFilter !== "all" && req.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = req.user_name?.toLowerCase().includes(q) ?? false;
      const matchBank = req.bank_name.toLowerCase().includes(q);
      const matchAccName = req.account_name.toLowerCase().includes(q);
      const matchAccNum = req.account_number.includes(q);
      return matchName || matchBank || matchAccName || matchAccNum;
    }
    return true;
  });

  const toggleMask = (id: string) => {
    setUnmaskedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = (req: WithdrawalRequest) => {
    startTransition(async () => {
      const res = await adminReviewWithdrawalAction(req.id, "approved");
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Request #${req.id.slice(0, 8)} approved.`);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "approved" as WithdrawalStatus } : r))
      );
      router.refresh();
    });
  };

  const handleConfirmReject = () => {
    if (!rejectDialogTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    startTransition(async () => {
      const res = await adminReviewWithdrawalAction(
        rejectDialogTarget.id,
        "rejected",
        undefined,
        rejectReason.trim()
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Request #${rejectDialogTarget.id.slice(0, 8)} rejected. ${rejectDialogTarget.amount_zed} ZED refunded to user.`
      );
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectDialogTarget.id
            ? {
                ...r,
                status: "rejected" as WithdrawalStatus,
                reject_reason: rejectReason.trim(),
              }
            : r
        )
      );
      setRejectDialogTarget(null);
      setRejectReason("");
      router.refresh();
    });
  };

  const handleConfirmPaid = () => {
    if (!paidDialogTarget) return;

    startTransition(async () => {
      const res = await adminReviewWithdrawalAction(
        paidDialogTarget.id,
        "paid",
        paidNote.trim() || undefined
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Request #${paidDialogTarget.id.slice(0, 8)} marked as paid.`);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === paidDialogTarget.id
            ? {
                ...r,
                status: "paid" as WithdrawalStatus,
                admin_note: paidNote.trim() || null,
              }
            : r
        )
      );
      setPaidDialogTarget(null);
      setPaidNote("");
      router.refresh();
    });
  };

  const renderStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px] uppercase font-semibold"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-mono text-[10px] uppercase font-semibold"
          >
            Approved
          </Badge>
        );
      case "paid":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-[10px] uppercase font-semibold"
          >
            Paid
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-rose-500/10 text-rose-500 font-mono text-[10px] uppercase font-semibold"
          >
            Rejected
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="border-muted bg-muted/20 text-muted-foreground font-mono text-[10px] uppercase font-semibold"
          >
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            ZED Withdrawals Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manual bank transfer queue. Approve requests and mark transfers completed.
          </p>
        </div>
      </div>

      {/* ── Metric Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Pending Queue
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {pendingRequests.length} requests
          </p>
          <p className="font-mono text-xs text-amber-500 mt-0.5">
            ₦{totalPendingNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Approved (Pending Transfer)
            </span>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {approvedRequests.length} requests
          </p>
          <p className="font-mono text-xs text-blue-500 mt-0.5">
            ₦{totalApprovedNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Total Paid Out
            </span>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {paidRequests.length} transfers
          </p>
          <p className="font-mono text-xs text-emerald-500 mt-0.5">
            ₦{totalPaidNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Total Requests
            </span>
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold text-foreground">
            {requests.length} total
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            Lifetime records
          </p>
        </Card>
      </div>

      {/* ── Filters & Search ──────────────────────────────────────────────── */}
      <Card className="p-4 border-border bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All", count: requests.length },
              { id: "pending", label: "Pending", count: pendingRequests.length },
              { id: "approved", label: "Approved", count: approvedRequests.length },
              { id: "paid", label: "Paid", count: paidRequests.length },
              {
                id: "rejected",
                label: "Rejected",
                count: requests.filter((r) => r.status === "rejected").length,
              },
              {
                id: "cancelled",
                label: "Cancelled",
                count: requests.filter((r) => r.status === "cancelled").length,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors border",
                  statusFilter === f.id
                    ? "bg-secondary text-foreground border-border shadow-xs font-semibold"
                    : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <span>{f.label}</span>
                <span className="text-[10px] opacity-70">({f.count})</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search citizen or bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>
      </Card>

      {/* ── Requests Table / List ─────────────────────────────────────────── */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Coins className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">No withdrawal requests found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground text-[10px] font-mono uppercase">
                  <th className="text-left px-4 py-3">Citizen</th>
                  <th className="text-left px-4 py-3">Amount (ZED / NGN)</th>
                  <th className="text-left px-4 py-3">Bank Destination</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Requested At</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRequests.map((req) => {
                  const isUnmasked = Boolean(unmaskedIds[req.id]);
                  const displayAcc = isUnmasked
                    ? req.account_number
                    : maskAccountNumber(req.account_number);

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      {/* Citizen */}
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-foreground text-xs">
                          {req.user_name || "Citizen"}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {req.user_email || req.user_id.slice(0, 8)}
                        </p>
                      </td>

                      {/* Amounts */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <p className="font-mono font-bold text-foreground">
                          {req.amount_zed.toLocaleString()} ZED
                        </p>
                        <p className="font-mono text-[11px] font-semibold text-emerald-500">
                          ₦{req.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="font-mono text-[9px] text-muted-foreground">
                          @ ₦{req.price_ngn_snapshot.toFixed(2)}/ZED
                        </p>
                      </td>

                      {/* Bank Details */}
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {req.bank_name}
                          </p>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                            <span>{displayAcc}</span>
                            <button
                              type="button"
                              onClick={() => toggleMask(req.id)}
                              title={isUnmasked ? "Mask account" : "Reveal full account"}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {isUnmasked ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(req.account_number, "Account number")
                              }
                              title="Copy account number"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {req.account_name}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {renderStatusBadge(req.status)}
                        {req.reject_reason && (
                          <p className="text-[10px] text-rose-500 font-mono mt-1 max-w-xs truncate" title={req.reject_reason}>
                            {req.reject_reason}
                          </p>
                        )}
                        {req.admin_note && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-1 max-w-xs truncate" title={req.admin_note}>
                            Note: {req.admin_note}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 align-top whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <br />
                        {new Date(req.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                                disabled={isPending}
                                onClick={() => handleApprove(req)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                                disabled={isPending}
                                onClick={() => {
                                  setRejectDialogTarget(req);
                                  setRejectReason("");
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {req.status === "approved" && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                disabled={isPending}
                                onClick={() => {
                                  setPaidDialogTarget(req);
                                  setPaidNote("");
                                }}
                              >
                                Mark Paid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                                disabled={isPending}
                                onClick={() => {
                                  setRejectDialogTarget(req);
                                  setRejectReason("");
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {req.status === "paid" && (
                            <span className="text-[11px] font-mono text-emerald-500 font-medium">
                              Completed ✓
                            </span>
                          )}

                          {(req.status === "rejected" || req.status === "cancelled") && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              Closed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Reject Modal ─────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(rejectDialogTarget)}
        onOpenChange={(open) => !open && setRejectDialogTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Reject Withdrawal Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rejecting will automatically refund{" "}
              <span className="font-mono font-semibold text-foreground">
                {rejectDialogTarget?.amount_zed.toLocaleString()} ZED
              </span>{" "}
              back into the citizen&apos;s wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason" className="text-xs">
              Rejection Reason (shared with citizen)
            </Label>
            <Input
              id="reject-reason"
              placeholder="e.g. Account name mismatch with NIN, invalid account number"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Confirm Rejection & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mark Paid Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(paidDialogTarget)}
        onOpenChange={(open) => !open && setPaidDialogTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Confirm Bank Transfer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirm that you have transferred{" "}
              <span className="font-mono font-bold text-emerald-500">
                ₦{paidDialogTarget?.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>{" "}
              to {paidDialogTarget?.bank_name} ({paidDialogTarget?.account_number}) - {paidDialogTarget?.account_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="paid-note" className="text-xs">
              Payment Reference / Admin Note (optional)
            </Label>
            <Input
              id="paid-note"
              placeholder="e.g. NIP reference 20261017001928"
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaidDialogTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmPaid}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Confirm Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
