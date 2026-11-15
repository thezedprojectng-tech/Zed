"use client";

import { useState, useTransition, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Banknote,
  Clock,
  Building2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Coins,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
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
import { AgePill } from "@/components/admin/people/AgePill";
import { maskAccountNumber } from "@/lib/withdraw/helpers";
import { adminReviewWithdrawalAction } from "@/lib/withdraw/actions";
import type { WithdrawalRequest, WithdrawalStatus } from "@/lib/withdraw/types";
import { cn } from "@/lib/utils";

interface WithdrawalsQueueClientProps {
  initialRequests: WithdrawalRequest[];
  loadError?: string | null;
}

type TabKey = "action-needed" | "approved" | "paid" | "rejected" | "cancelled" | "all";

export function WithdrawalsQueueClient({
  initialRequests,
  loadError,
}: WithdrawalsQueueClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [requests, setRequests] = useState<WithdrawalRequest[]>(initialRequests);
  const [unmaskedIds, setUnmaskedIds] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // Read URL parameters
  const initialTabParam = (searchParams.get("tab") as TabKey) || "action-needed";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTabParam);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") || "");

  // Selection / Detail Drawer
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(() => {
    const targetId = searchParams.get("id");
    if (targetId) {
      return initialRequests.find((r) => r.id === targetId) || null;
    }
    return null;
  });

  // Dialog targets
  const [approveDialogTarget, setApproveDialogTarget] = useState<WithdrawalRequest | null>(null);
  const [rejectDialogTarget, setRejectDialogTarget] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [paidDialogTarget, setPaidDialogTarget] = useState<WithdrawalRequest | null>(null);
  const [paidNote, setPaidNote] = useState<string>("");

  // Sync URL state
  const updateUrl = useCallback(
    (newTab: TabKey, newQuery: string, newId: string | null) => {
      const params = new URLSearchParams();
      if (newTab !== "action-needed") params.set("tab", newTab);
      if (newQuery.trim()) params.set("q", newQuery.trim());
      if (newId) params.set("id", newId);
      const str = params.toString();
      router.replace(str ? `${pathname}?${str}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  // Focus search with '/' shortcut
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

  // Quick stats
  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const approvedRequests = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const paidRequests = useMemo(() => requests.filter((r) => r.status === "paid"), [requests]);
  const rejectedRequests = useMemo(() => requests.filter((r) => r.status === "rejected"), [requests]);
  const cancelledRequests = useMemo(() => requests.filter((r) => r.status === "cancelled"), [requests]);

  const totalPendingNaira = useMemo(
    () => pendingRequests.reduce((sum, r) => sum + r.amount_ngn, 0),
    [pendingRequests]
  );
  const totalApprovedNaira = useMemo(
    () => approvedRequests.reduce((sum, r) => sum + r.amount_ngn, 0),
    [approvedRequests]
  );
  const totalPaidNaira = useMemo(
    () => paidRequests.reduce((sum, r) => sum + r.amount_ngn, 0),
    [paidRequests]
  );

  // Tab options with counts
  const tabOptions = useMemo(
    () => [
      { id: "action-needed" as TabKey, label: "Action needed", count: pendingRequests.length },
      { id: "approved" as TabKey, label: "Approved (Transfer pending)", count: approvedRequests.length },
      { id: "paid" as TabKey, label: "Paid", count: paidRequests.length },
      { id: "rejected" as TabKey, label: "Rejected", count: rejectedRequests.length },
      { id: "cancelled" as TabKey, label: "Cancelled", count: cancelledRequests.length },
      { id: "all" as TabKey, label: "All records", count: requests.length },
    ],
    [
      pendingRequests.length,
      approvedRequests.length,
      paidRequests.length,
      rejectedRequests.length,
      cancelledRequests.length,
      requests.length,
    ]
  );

  // Filtered & sorted requests
  const filteredRequests = useMemo(() => {
    let list = requests.filter((req) => {
      if (activeTab === "action-needed") {
        if (req.status !== "pending") return false;
      } else if (activeTab !== "all") {
        if (req.status !== activeTab) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = req.user_name?.toLowerCase().includes(q) ?? false;
        const matchEmail = req.user_email?.toLowerCase().includes(q) ?? false;
        const matchBank = req.bank_name.toLowerCase().includes(q);
        const matchAccName = req.account_name.toLowerCase().includes(q);
        const matchAccNum = req.account_number.includes(q);
        const matchId = req.id.toLowerCase().includes(q);
        return matchName || matchEmail || matchBank || matchAccName || matchAccNum || matchId;
      }
      return true;
    });

    // Action-needed tab sorts oldest first (FIFO - oldest awaiting payouts first)
    if (activeTab === "action-needed") {
      list = [...list].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }, [requests, activeTab, searchQuery]);

  // Auto-advance helper
  const advanceToNext = useCallback(
    (currentId: string, updatedList: WithdrawalRequest[]) => {
      const currentIndex = updatedList.findIndex((r) => r.id === currentId);
      if (currentIndex !== -1 && currentIndex + 1 < updatedList.length) {
        setSelectedRequest(updatedList[currentIndex + 1]);
        updateUrl(activeTab, searchQuery, updatedList[currentIndex + 1].id);
      } else if (currentIndex > 0) {
        setSelectedRequest(updatedList[currentIndex - 1]);
        updateUrl(activeTab, searchQuery, updatedList[currentIndex - 1].id);
      } else {
        setSelectedRequest(null);
        updateUrl(activeTab, searchQuery, null);
      }
    },
    [activeTab, searchQuery, updateUrl]
  );

  const toggleMask = (id: string) => {
    setUnmaskedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleConfirmApprove = () => {
    if (!approveDialogTarget) return;
    const target = approveDialogTarget;

    startTransition(async () => {
      const res = await adminReviewWithdrawalAction(target.id, "approved");
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Request #${target.id.slice(0, 8)} approved for payout.`);
      const updated = requests.map((r) =>
        r.id === target.id ? { ...r, status: "approved" as WithdrawalStatus } : r
      );
      setRequests(updated);
      setApproveDialogTarget(null);

      // Auto advance
      if (selectedRequest?.id === target.id) {
        advanceToNext(target.id, updated.filter((r) => r.status === "pending"));
      }
      router.refresh();
    });
  };

  const handleConfirmReject = () => {
    if (!rejectDialogTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    const target = rejectDialogTarget;

    startTransition(async () => {
      const res = await adminReviewWithdrawalAction(
        target.id,
        "rejected",
        undefined,
        rejectReason.trim()
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Request #${target.id.slice(0, 8)} rejected. ${target.amount_zed.toLocaleString()} ZED refunded.`
      );
      const updated = requests.map((r) =>
        r.id === target.id
          ? {
              ...r,
              status: "rejected" as WithdrawalStatus,
              reject_reason: rejectReason.trim(),
            }
          : r
      );
      setRequests(updated);
      setRejectDialogTarget(null);
      setRejectReason("");

      // Auto advance
      if (selectedRequest?.id === target.id) {
        advanceToNext(target.id, updated.filter((r) => r.status === "pending"));
      }
      router.refresh();
    });
  };

  const handleConfirmPaid = () => {
    if (!paidDialogTarget) return;
    const target = paidDialogTarget;

    startTransition(async () => {
      const res = await adminReviewWithdrawalAction(
        target.id,
        "paid",
        paidNote.trim() || undefined
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Request #${target.id.slice(0, 8)} marked as completed bank transfer.`);
      const updated = requests.map((r) =>
        r.id === target.id
          ? {
              ...r,
              status: "paid" as WithdrawalStatus,
              admin_note: paidNote.trim() || null,
            }
          : r
      );
      setRequests(updated);
      setPaidDialogTarget(null);
      setPaidNote("");

      // Auto advance
      if (selectedRequest?.id === target.id) {
        advanceToNext(target.id, updated.filter((r) => r.status === "approved"));
      }
      router.refresh();
    });
  };

  const handleSelectRow = (req: WithdrawalRequest) => {
    setSelectedRequest(req);
    updateUrl(activeTab, searchQuery, req.id);
  };

  const handleCloseDrawer = () => {
    setSelectedRequest(null);
    updateUrl(activeTab, searchQuery, null);
  };

  const renderStatus = (status: WithdrawalStatus) => {
    switch (status) {
      case "pending":
        return <StatusPill variant="pending" label="Pending" />;
      case "approved":
        return <StatusPill variant="reviewing" label="Approved (Transfer pending)" />;
      case "paid":
        return <StatusPill variant="verified" label="Paid" />;
      case "rejected":
        return <StatusPill variant="rejected" label="Rejected" />;
      case "cancelled":
        return <StatusPill variant="neutral" label="Cancelled" />;
      default:
        return <StatusPill variant="neutral" label={status} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Withdrawals Queue"
        description="Review, approve, and execute bank transfers for citizen ZED token redemptions."
        icon={Banknote}
        section="money"
      />

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Failed to load withdrawal requests</p>
            <p className="text-muted-foreground">{loadError}</p>
          </div>
        </div>
      )}

      {/* ── Metric Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Action Needed</span>
            <Clock className="h-4 w-4 text-[color:var(--data-flows)]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-sans tabular-nums text-foreground">
            {pendingRequests.length}
          </p>
          <p className="font-sans tabular-nums text-xs text-[color:var(--data-flows-ink)] mt-0.5">
            ₦{totalPendingNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })} awaiting review
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Approved (Payout Pending)</span>
            <CheckCircle2 className="h-4 w-4 text-[color:var(--data-users)]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-sans tabular-nums text-foreground">
            {approvedRequests.length}
          </p>
          <p className="font-sans tabular-nums text-xs text-[color:var(--data-users-ink)] mt-0.5">
            ₦{totalApprovedNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })} ready to transfer
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Paid Out</span>
            <Banknote className="h-4 w-4 text-[color:var(--data-verified)]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-sans tabular-nums text-foreground">
            {paidRequests.length}
          </p>
          <p className="font-sans tabular-nums text-xs text-[color:var(--data-verified-ink)] mt-0.5">
            ₦{totalPaidNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })} successfully disbursed
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Requests</span>
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold font-sans tabular-nums text-foreground">
            {requests.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lifetime recorded redemptions
          </p>
        </div>
      </div>

      {/* ── Toolbar: Tabs + Search ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            updateUrl(tab, searchQuery, selectedRequest?.id || null);
          }}
          ariaLabel="Withdrawal status filter"
        />

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search citizen, bank, account..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateUrl(activeTab, e.target.value, selectedRequest?.id || null);
            }}
            className="pl-9 pr-8 text-xs h-9 rounded-lg bg-card border-border"
          />
          <kbd className="absolute right-2.5 top-2.5 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border/80 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* ── Requests Table ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No withdrawal requests found"
            description={
              searchQuery
                ? "No records match your active search and status filter."
                : activeTab === "action-needed"
                ? "All clear! There are currently no pending withdrawal requests requiring admin action."
                : "No requests recorded under this status."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" role="table">
              <thead>
                <tr className="border-b border-border/70 bg-secondary/30 text-muted-foreground text-xs font-medium">
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Amount (ZED / NGN)</th>
                  <th className="py-3 px-4">Bank Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waiting Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredRequests.map((req) => {
                  const isUnmasked = Boolean(unmaskedIds[req.id]);
                  const displayAcc = isUnmasked
                    ? req.account_number
                    : maskAccountNumber(req.account_number);
                  const isSelected = selectedRequest?.id === req.id;

                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleSelectRow(req)}
                      className={cn(
                        "hover:bg-secondary/30 transition-colors cursor-pointer group",
                        isSelected && "bg-secondary/40 font-medium"
                      )}
                    >
                      {/* Citizen */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-foreground text-xs">
                          {req.user_name || "Citizen"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {req.user_email || req.user_id.slice(0, 8)}
                        </p>
                      </td>

                      {/* Amounts */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <p className="font-sans font-bold tabular-nums text-foreground">
                          {req.amount_zed.toLocaleString()} ZED
                        </p>
                        <p className="font-sans tabular-nums text-xs text-foreground font-semibold">
                          ₦{req.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-sans tabular-nums">
                          @ ₦{req.price_ngn_snapshot.toFixed(2)}/ZED
                        </p>
                      </td>

                      {/* Bank Details */}
                      <td className="py-3.5 px-4 align-top" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {req.bank_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <span className="font-mono">{displayAcc}</span>
                            <button
                              type="button"
                              onClick={() => toggleMask(req.id)}
                              title={isUnmasked ? "Mask account" : "Reveal full account"}
                              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
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
                              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
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
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {renderStatus(req.status)}
                        {req.reject_reason && (
                          <p className="text-[11px] text-destructive mt-1 max-w-xs truncate" title={req.reject_reason}>
                            {req.reject_reason}
                          </p>
                        )}
                        {req.admin_note && (
                          <p className="text-[11px] text-muted-foreground mt-1 max-w-xs truncate" title={req.admin_note}>
                            Ref: {req.admin_note}
                          </p>
                        )}
                      </td>

                      {/* Age */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <AgePill submittedAt={req.created_at} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs rounded-lg border-border"
                                disabled={isPending}
                                onClick={() => setApproveDialogTarget(req)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
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
                                className="h-7 px-2.5 text-xs rounded-lg font-medium"
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
                                className="h-7 px-2 text-xs rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
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

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => handleSelectRow(req)}
                          >
                            <ChevronRight className="h-4 w-4" />
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

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      <AdminDrawer
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => !open && handleCloseDrawer()}
        title={
          selectedRequest
            ? `Withdrawal #${selectedRequest.id.slice(0, 8)}`
            : "Withdrawal Details"
        }
        subtitle={selectedRequest?.user_name || "Citizen payout request"}
        badge={selectedRequest ? renderStatus(selectedRequest.status) : undefined}
        timestamp={
          selectedRequest ? (
            <AgePill submittedAt={selectedRequest.created_at} />
          ) : undefined
        }
        footer={
          selectedRequest && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseDrawer}
                className="rounded-lg text-xs"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedRequest.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={isPending}
                      onClick={() => {
                        setRejectDialogTarget(selectedRequest);
                        setRejectReason("");
                      }}
                    >
                      Reject &amp; Refund
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg text-xs"
                      disabled={isPending}
                      onClick={() => setApproveDialogTarget(selectedRequest)}
                    >
                      Approve Payout
                    </Button>
                  </>
                )}

                {selectedRequest.status === "approved" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={isPending}
                      onClick={() => {
                        setRejectDialogTarget(selectedRequest);
                        setRejectReason("");
                      }}
                    >
                      Reject &amp; Refund
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg text-xs"
                      disabled={isPending}
                      onClick={() => {
                        setPaidDialogTarget(selectedRequest);
                        setPaidNote("");
                      }}
                    >
                      Mark as Paid
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Amount details */}
            <PanelSection title="Redemption amounts">
              <FieldList columns={2}>
                <FieldItem label="Amount in ZED">
                  <span className="font-sans font-bold tabular-nums text-foreground text-sm">
                    {selectedRequest.amount_zed.toLocaleString()} ZED
                  </span>
                </FieldItem>
                <FieldItem label="Naira payout amount">
                  <span className="font-sans font-bold tabular-nums text-foreground text-sm">
                    ₦{selectedRequest.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </FieldItem>
                <FieldItem label="Conversion rate snapshot">
                  <span className="font-sans tabular-nums text-muted-foreground">
                    ₦{selectedRequest.price_ngn_snapshot.toFixed(4)} per 1 ZED
                  </span>
                </FieldItem>
                <FieldItem label="Current status">
                  {renderStatus(selectedRequest.status)}
                </FieldItem>
              </FieldList>
            </PanelSection>

            {/* Destination Bank Details */}
            <PanelSection title="Bank destination account">
              <FieldList columns={2}>
                <FieldItem label="Bank name">
                  <span className="font-medium text-foreground">{selectedRequest.bank_name}</span>
                </FieldItem>
                <FieldItem label="Account name">
                  <span className="font-medium text-foreground">{selectedRequest.account_name}</span>
                </FieldItem>
                <FieldItem label="Account number" span={2}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {unmaskedIds[selectedRequest.id]
                        ? selectedRequest.account_number
                        : maskAccountNumber(selectedRequest.account_number)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => toggleMask(selectedRequest.id)}
                    >
                      {unmaskedIds[selectedRequest.id] ? "Mask" : "Reveal"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(selectedRequest.account_number, "Account number")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </FieldItem>
              </FieldList>
            </PanelSection>

            {/* Citizen Details */}
            <PanelSection title="Citizen identity">
              <FieldList columns={2}>
                <FieldItem label="Full name">
                  <span className="text-foreground">{selectedRequest.user_name || "Citizen"}</span>
                </FieldItem>
                <FieldItem label="Email address">
                  <span className="text-foreground">{selectedRequest.user_email || "Not specified"}</span>
                </FieldItem>
                <FieldItem label="User identifier" span={2}>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {selectedRequest.user_id}
                  </span>
                </FieldItem>
              </FieldList>
            </PanelSection>

            {/* Timestamps & Audit */}
            <PanelSection title="Audit & history">
              <FieldList columns={1}>
                <FieldItem label="Request submitted">
                  <span className="font-sans tabular-nums text-muted-foreground">
                    {new Date(selectedRequest.created_at).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </FieldItem>
                {selectedRequest.reject_reason && (
                  <FieldItem label="Rejection reason">
                    <span className="text-destructive font-medium">{selectedRequest.reject_reason}</span>
                  </FieldItem>
                )}
                {selectedRequest.admin_note && (
                  <FieldItem label="Payment reference / admin note">
                    <span className="text-foreground font-mono">{selectedRequest.admin_note}</span>
                  </FieldItem>
                )}
              </FieldList>
            </PanelSection>
          </div>
        )}
      </AdminDrawer>

      {/* ── Confirm Approve Modal ─────────────────────────────────────────── */}
      <Dialog
        open={Boolean(approveDialogTarget)}
        onOpenChange={(open) => !open && setApproveDialogTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Confirm Withdrawal Approval
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review payout details before approving this request for bank transfer.
            </DialogDescription>
          </DialogHeader>

          {approveDialogTarget && (
            <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Citizen:</span>
                <span className="font-medium text-foreground">
                  {approveDialogTarget.user_name || approveDialogTarget.user_email || approveDialogTarget.user_id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-sans font-bold tabular-nums text-foreground">
                  {approveDialogTarget.amount_zed.toLocaleString()} ZED (₦{approveDialogTarget.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-medium text-foreground text-right">
                  {approveDialogTarget.bank_name} · {approveDialogTarget.account_number} ({approveDialogTarget.account_name})
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveDialogTarget(null)}
              disabled={isPending}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmApprove}
              disabled={isPending}
              className="rounded-lg text-xs"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Reject Modal ──────────────────────────────────────────── */}
      <Dialog
        open={Boolean(rejectDialogTarget)}
        onOpenChange={(open) => !open && setRejectDialogTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Reject Withdrawal &amp; Refund
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rejecting will automatically refund{" "}
              <span className="font-sans font-bold tabular-nums text-foreground">
                {rejectDialogTarget?.amount_zed.toLocaleString()} ZED
              </span>{" "}
              to the citizen&apos;s wallet balance.
            </DialogDescription>
          </DialogHeader>

          {rejectDialogTarget && (
            <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Citizen:</span>
                <span className="font-medium text-foreground">
                  {rejectDialogTarget.user_name || rejectDialogTarget.user_email || rejectDialogTarget.user_id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-sans font-semibold tabular-nums text-foreground">
                  ₦{rejectDialogTarget.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason" className="text-xs font-medium">
              Rejection reason (visible to citizen)
            </Label>
            <Input
              id="reject-reason"
              placeholder="e.g. Account name mismatch with registered KYC name"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs rounded-lg"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogTarget(null)}
              disabled={isPending}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isPending || !rejectReason.trim()}
              className="rounded-lg text-xs"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Confirm Rejection &amp; Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Mark Paid Modal ───────────────────────────────────────── */}
      <Dialog
        open={Boolean(paidDialogTarget)}
        onOpenChange={(open) => !open && setPaidDialogTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Confirm Bank Transfer Disbursed
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirm that you have transferred{" "}
              <span className="font-sans font-bold tabular-nums text-foreground">
                ₦{paidDialogTarget?.amount_ngn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>{" "}
              to {paidDialogTarget?.bank_name} ({paidDialogTarget?.account_number}) - {paidDialogTarget?.account_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="paid-note" className="text-xs font-medium">
              Payment reference or bank session ID (optional)
            </Label>
            <Input
              id="paid-note"
              placeholder="e.g. NIP session 100004202611150001"
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
              className="text-xs rounded-lg"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaidDialogTarget(null)}
              disabled={isPending}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPaid}
              disabled={isPending}
              className="rounded-lg text-xs"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Confirm Transfer Executed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
