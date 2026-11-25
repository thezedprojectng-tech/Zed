"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Ban,
  CheckCircle2,
  Loader2,
  Receipt,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminListCertificateOrdersAction,
  adminListIssuedCertificatesAction,
  adminReviewCertificateOrderAction,
  adminRevokeCertificateAction,
  type AdminCertificateOrder,
  type AdminIssuedCertificate,
} from "@/lib/skill/admin-actions";
import { AdminPageHeader } from "@/components/admin/primitives/AdminPageHeader";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { EmptyState } from "@/components/admin/primitives/EmptyState";
import { StatusPill } from "@/components/admin/people/StatusPill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MainTab = "orders" | "issued";
type OrderStatus = "pending" | "approved" | "rejected";

interface AdminSkillCertificatesClientProps {
  initialPendingOrders: AdminCertificateOrder[];
  initialOrdersError: string | null;
  initialIssuedCertificates: AdminIssuedCertificate[];
  initialIssuedError: string | null;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateLabel(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function AdminSkillCertificatesClient({
  initialPendingOrders,
  initialOrdersError,
  initialIssuedCertificates,
  initialIssuedError,
}: AdminSkillCertificatesClientProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("orders");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending");
  const [orders, setOrders] =
    useState<AdminCertificateOrder[]>(initialPendingOrders);
  const [ordersError, setOrdersError] = useState<string | null>(
    initialOrdersError
  );
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [issuedList, setIssuedList] = useState<AdminIssuedCertificate[]>(
    initialIssuedCertificates
  );
  const [issuedError, setIssuedError] = useState<string | null>(
    initialIssuedError
  );

  const [isPending, startTransition] = useTransition();

  // Order review dialog state
  const [reviewOrder, setReviewOrder] = useState<AdminCertificateOrder | null>(
    null
  );
  const [reviewApprove, setReviewApprove] = useState(true);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Revoke dialog state
  const [revokingCert, setRevokingCert] =
    useState<AdminIssuedCertificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const loadOrders = async (status: OrderStatus) => {
    setLoadingOrders(true);
    setOrdersError(null);
    const res = await adminListCertificateOrdersAction(status);
    setLoadingOrders(false);
    if (!res.ok) {
      setOrdersError(res.error);
      setOrders([]);
      return;
    }
    setOrders(res.data ?? []);
  };

  const handleOrderStatusChange = (nextStatus: OrderStatus) => {
    setOrderStatus(nextStatus);
    void loadOrders(nextStatus);
  };

  const openReviewDialog = (
    order: AdminCertificateOrder,
    approve: boolean
  ) => {
    setReviewOrder(order);
    setReviewApprove(approve);
    setReviewReason("");
    setReviewError(null);
  };

  const handleConfirmReview = () => {
    if (!reviewOrder) return;
    setReviewError(null);

    if (!reviewApprove && reviewReason.trim().length === 0) {
      setReviewError("Please provide a reason for rejecting this order.");
      return;
    }

    startTransition(async () => {
      const res = await adminReviewCertificateOrderAction(
        reviewOrder.id,
        reviewApprove,
        reviewApprove ? null : reviewReason.trim()
      );

      if (!res.ok) {
        setReviewError(res.error);
        return;
      }

      toast.success(
        reviewApprove
          ? "Order approved and certificate issued"
          : "Certificate order rejected"
      );
      setReviewOrder(null);
      setReviewReason("");

      // Refresh both orders and issued list
      const [ordersRes, issuedRes] = await Promise.all([
        adminListCertificateOrdersAction(orderStatus),
        adminListIssuedCertificatesAction(),
      ]);
      if (ordersRes.ok) setOrders(ordersRes.data ?? []);
      if (issuedRes.ok) setIssuedList(issuedRes.data ?? []);
    });
  };

  const openRevokeDialog = (cert: AdminIssuedCertificate) => {
    setRevokingCert(cert);
    setRevokeReason("");
    setRevokeError(null);
  };

  const handleConfirmRevoke = () => {
    if (!revokingCert) return;
    setRevokeError(null);

    if (revokeReason.trim().length === 0) {
      setRevokeError("Please provide a reason for revoking this certificate.");
      return;
    }

    startTransition(async () => {
      const res = await adminRevokeCertificateAction(
        revokingCert.id,
        revokeReason.trim()
      );

      if (!res.ok) {
        setRevokeError(res.error);
        return;
      }

      toast.success("Certificate revoked");
      setRevokingCert(null);
      setRevokeReason("");

      const issuedRes = await adminListIssuedCertificatesAction();
      if (issuedRes.ok) {
        setIssuedList(issuedRes.data ?? []);
      }
    });
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-6 pb-16">
      <div className="space-y-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg -ml-2"
        >
          <Link href="/admin/skill">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to skill content</span>
          </Link>
        </Button>

        <AdminPageHeader
          title="Certificates"
          description="Review manual certificate payment orders and manage issued certificates."
          icon={Award}
          section="programs"
        />
      </div>

      {/* Top-level tabs + sub-filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl<MainTab>
          ariaLabel="Certificate sections"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { id: "orders", label: "Orders", icon: Receipt },
            {
              id: "issued",
              label: "Issued",
              icon: Award,
              count: issuedList.length,
            },
          ]}
        />

        {activeTab === "orders" && (
          <SegmentedControl<OrderStatus>
            ariaLabel="Order status filter"
            size="sm"
            value={orderStatus}
            onChange={handleOrderStatusChange}
            options={[
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ]}
          />
        )}
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {ordersError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
              <span>{ordersError}</span>
            </div>
          )}

          {loadingOrders ? (
            <div className="rounded-lg border border-border/70 bg-card p-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              <span>Loading orders…</span>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={`No ${orderStatus} certificate orders`}
              description={
                orderStatus === "pending"
                  ? "Manual payment submissions from learners will appear here for review."
                  : `There are no ${orderStatus} certificate orders yet.`
              }
            />
          ) : (
            <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-xs font-medium text-muted-foreground">
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payer name</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-muted/20 transition-colors duration-150 motion-reduce:transition-none"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-foreground">
                            {order.learner_name}
                          </div>
                          {order.learner_email && (
                            <div className="text-xs text-muted-foreground">
                              {order.learner_email}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-foreground">
                          {order.course_title}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-foreground tabular-nums">
                          {formatNaira(order.amount_ngn)}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {order.payer_name || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {order.payment_reference || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                          {formatDateLabel(order.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {orderStatus === "pending" ? (
                            <div className="inline-flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => openReviewDialog(order, false)}
                                className="h-8 text-xs rounded-lg border-border/70 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPending}
                                onClick={() => openReviewDialog(order, true)}
                                className="h-8 text-xs rounded-lg"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                            </div>
                          ) : orderStatus === "approved" ? (
                            <StatusPill variant="verified" />
                          ) : (
                            <div className="inline-flex flex-col items-end gap-1">
                              <StatusPill variant="rejected" />
                              {order.reason && (
                                <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                                  {order.reason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked rows */}
              <div className="md:hidden divide-y divide-border/60">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {order.learner_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.course_title}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground tabular-nums shrink-0">
                        {formatNaira(order.amount_ngn)}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Payer name</dt>
                        <dd className="font-medium text-foreground">
                          {order.payer_name || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Reference</dt>
                        <dd className="font-medium text-foreground break-all">
                          {order.payment_reference || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Date</dt>
                        <dd className="text-foreground">
                          {formatDateLabel(order.created_at)}
                        </dd>
                      </div>
                      {order.reason && (
                        <div>
                          <dt className="text-muted-foreground">Reason</dt>
                          <dd className="text-foreground">{order.reason}</dd>
                        </div>
                      )}
                    </dl>

                    {orderStatus === "pending" && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => openReviewDialog(order, false)}
                          className="flex-1 h-9 text-xs rounded-lg border-border/70 text-rose-700 dark:text-rose-400"
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending}
                          onClick={() => openReviewDialog(order, true)}
                          className="flex-1 h-9 text-xs rounded-lg"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Issued Tab */}
      {activeTab === "issued" && (
        <div className="space-y-4">
          {issuedError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
              <span>{issuedError}</span>
            </div>
          )}

          {issuedList.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No certificates issued yet"
              description="Certificates issued automatically for free courses or after approving paid orders will appear here."
            />
          ) : (
            <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-xs font-medium text-muted-foreground">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Remark</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {issuedList.map((cert) => {
                      const isRevoked = Boolean(cert.revoked_at);
                      return (
                        <tr
                          key={cert.id}
                          className="hover:bg-muted/20 transition-colors duration-150 motion-reduce:transition-none"
                        >
                          <td className="py-3.5 px-4 font-medium text-foreground tabular-nums">
                            {cert.code}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {cert.learner_name}
                          </td>
                          <td className="py-3.5 px-4 text-foreground">
                            {cert.course_title}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums text-foreground">
                            {cert.score}%
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {cert.remark || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                            {formatDateLabel(cert.issued_at)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isRevoked ? (
                              <div className="inline-flex flex-col items-end gap-1">
                                <span className="inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                                  Revoked
                                </span>
                                {cert.revoke_reason && (
                                  <span className="text-xs text-muted-foreground max-w-[180px] truncate">
                                    {cert.revoke_reason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => openRevokeDialog(cert)}
                                className="h-8 text-xs rounded-lg border-border/70 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Revoke
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked rows */}
              <div className="md:hidden divide-y divide-border/60">
                {issuedList.map((cert) => {
                  const isRevoked = Boolean(cert.revoked_at);
                  return (
                    <div key={cert.id} className="p-4 space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {cert.learner_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {cert.course_title}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground shrink-0">
                          {cert.code}
                        </span>
                      </div>

                      <dl className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Score</dt>
                          <dd className="font-medium text-foreground tabular-nums">
                            {cert.score}%
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Remark</dt>
                          <dd className="font-medium text-foreground">
                            {cert.remark || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Date</dt>
                          <dd className="text-foreground">
                            {formatDateLabel(cert.issued_at)}
                          </dd>
                        </div>
                      </dl>

                      {isRevoked ? (
                        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-400">
                          Revoked{cert.revoke_reason ? `: ${cert.revoke_reason}` : ""}
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => openRevokeDialog(cert)}
                          className="w-full h-9 text-xs rounded-lg border-border/70 text-rose-700 dark:text-rose-400"
                        >
                          <Ban className="h-3.5 w-3.5 mr-1.5" />
                          Revoke certificate
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve / Reject Order Confirm Dialog */}
      <Dialog
        open={Boolean(reviewOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewOrder(null);
            setReviewError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {reviewApprove
                ? "Approve certificate order"
                : "Reject certificate order"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {reviewOrder
                ? `${reviewOrder.learner_name} · ${reviewOrder.course_title} · ${formatNaira(reviewOrder.amount_ngn)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {reviewError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
                <span>{reviewError}</span>
              </div>
            )}

            {reviewOrder && (
              <dl className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div>
                  <dt className="text-muted-foreground">Payer name</dt>
                  <dd className="font-medium text-foreground">
                    {reviewOrder.payer_name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Payment reference</dt>
                  <dd className="font-medium text-foreground break-all">
                    {reviewOrder.payment_reference || "—"}
                  </dd>
                </div>
              </dl>
            )}

            {!reviewApprove && (
              <div className="space-y-1.5">
                <Label htmlFor="rejectReason" className="text-xs font-medium">
                  Rejection reason *
                </Label>
                <Textarea
                  id="rejectReason"
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => {
                    setReviewReason(e.target.value);
                    setReviewError(null);
                  }}
                  placeholder="Explain why this payment could not be verified…"
                  className="text-xs rounded-lg"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setReviewOrder(null)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={reviewApprove ? "default" : "destructive"}
              size="sm"
              disabled={
                isPending || (!reviewApprove && reviewReason.trim().length === 0)
              }
              onClick={handleConfirmReview}
              className="rounded-lg text-xs gap-1.5"
            >
              {isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              )}
              <span>
                {reviewApprove ? "Confirm approval" : "Confirm rejection"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Certificate Confirm Dialog */}
      <Dialog
        open={Boolean(revokingCert)}
        onOpenChange={(open) => {
          if (!open) {
            setRevokingCert(null);
            setRevokeError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Revoke certificate
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {revokingCert
                ? `${revokingCert.learner_name} · ${revokingCert.course_title} (${revokingCert.code})`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {revokeError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
                <span>{revokeError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="revokeReason" className="text-xs font-medium">
                Revocation reason *
              </Label>
              <Textarea
                id="revokeReason"
                rows={3}
                value={revokeReason}
                onChange={(e) => {
                  setRevokeReason(e.target.value);
                  setRevokeError(null);
                }}
                placeholder="State why this certificate is being revoked…"
                className="text-xs rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setRevokingCert(null)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending || revokeReason.trim().length === 0}
              onClick={handleConfirmRevoke}
              className="rounded-lg text-xs gap-1.5"
            >
              {isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              )}
              <span>Revoke certificate</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
