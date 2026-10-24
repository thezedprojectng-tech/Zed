"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldAlert,
  Search,
  ExternalLink,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Flag,
  UserCheck,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  CATEGORY_DEFINITIONS,
  STATUS_LABELS,
  CONDITION_LABELS,
  formatNgnPrice,
} from "@/lib/market/helpers";
import {
  adminRemoveListing,
  adminRestoreListing,
} from "@/lib/market/admin-actions";
import type {
  MarketListing,
  MarketListingWithReports,
  MarketStatus,
} from "@/lib/market/types";

interface AdminMarketClientProps {
  reportedListings: MarketListingWithReports[];
  allListings: MarketListing[];
}

export function AdminMarketClient({
  reportedListings: initialReported,
  allListings: initialAll,
}: AdminMarketClientProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "all">("reports");
  const [reportedListings, setReportedListings] = useState<MarketListingWithReports[]>(initialReported);
  const [allListings, setAllListings] = useState<MarketListing[]>(initialAll);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MarketStatus | "all">("all");

  const [removeModalTarget, setRemoveModalTarget] = useState<MarketListing | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredAll = allListings.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchLoc = l.location.toLowerCase().includes(q);
      const matchSeller = l.seller_name_masked.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchSeller) return false;
    }
    return true;
  });

  const handleOpenRemoveModal = (listing: MarketListing) => {
    setRemoveModalTarget(listing);
    setRemoveReason("");
    setActionError(null);
  };

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeModalTarget) return;

    if (removeReason.trim().length < 3) {
      setActionError("Removal reason must be at least 3 characters.");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    const res = await adminRemoveListing({
      listing_id: removeModalTarget.id,
      reason: removeReason.trim(),
    });

    setActionLoading(false);

    if (!res.success) {
      setActionError(res.error || "Failed to remove listing.");
      return;
    }

    // Update state locally
    const targetId = removeModalTarget.id;
    const reasonText = removeReason.trim();

    setReportedListings((prev) =>
      prev.map((l) => (l.id === targetId ? { ...l, status: "removed", removed_reason: reasonText } : l))
    );
    setAllListings((prev) =>
      prev.map((l) => (l.id === targetId ? { ...l, status: "removed", removed_reason: reasonText } : l))
    );

    setRemoveModalTarget(null);
  };

  const handleRestore = async (listingId: string) => {
    if (!confirm("Are you sure you want to restore this listing to active status?")) return;

    setActionLoading(true);
    const res = await adminRestoreListing(listingId);
    setActionLoading(false);

    if (!res.success) {
      alert(res.error || "Failed to restore listing.");
      return;
    }

    setReportedListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: "active", report_count: 0, removed_reason: null } : l))
    );
    setAllListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: "active", report_count: 0, removed_reason: null } : l))
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace Moderation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review reported listings, moderate prohibited items, and inspect all marketplace activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs">
            <Link href="/market" target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live Marketplace</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "reports"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          <span>Reported Listings</span>
          <Badge
            variant={reportedListings.length > 0 ? "destructive" : "secondary"}
            className="text-[10px] ml-1 h-5 px-1.5"
          >
            {reportedListings.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>All Listings ({allListings.length})</span>
        </button>
      </div>

      {/* ── Tab 1: Reported Listings Queue ─────────────────────────────────── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {reportedListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold">Clean moderation queue</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                There are no open reports from verified users awaiting moderator review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportedListings.map((listing) => {
                const statusMeta = STATUS_LABELS[listing.status];
                const hasImages = listing.image_paths && listing.image_paths.length > 0;
                const primaryImage = hasImages
                  ? `/api/market/image?path=${encodeURIComponent(listing.image_paths[0])}`
                  : null;

                return (
                  <div
                    key={listing.id}
                    className="rounded-xl border border-rose-500/30 bg-card p-4 sm:p-5 space-y-4"
                  >
                    {/* Top Row: Listing overview & action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="relative h-18 w-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                          {primaryImage ? (
                            <Image src={primaryImage} alt="" fill sizes="80px" className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-[10px]">
                              No Photo
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <Flag className="h-3 w-3" />
                              {listing.report_count} {listing.report_count === 1 ? "report" : "reports"}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${statusMeta.badgeClass}`}>
                              {statusMeta.label}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {CATEGORY_DEFINITIONS[listing.category]?.label || listing.category}
                            </span>
                          </div>

                          <Link
                            href={`/market/${listing.id}`}
                            target="_blank"
                            className="font-bold text-sm sm:text-base hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span>{listing.title}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          </Link>

                          <div className="text-xs font-semibold text-foreground">
                            {formatNgnPrice(listing.price_ngn)} •{" "}
                            <span className="text-muted-foreground font-normal">
                              Seller: {listing.seller_name_masked} ({listing.location})
                            </span>
                          </div>

                          {listing.removed_reason && (
                            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                              Removal note: {listing.removed_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                        {listing.status !== "removed" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenRemoveModal(listing)}
                            className="h-8 gap-1.5 text-xs shadow-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove listing</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleRestore(listing.id)}
                            className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Restore listing</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Breakdown of reports submitted */}
                    {listing.reports && listing.reports.length > 0 && (
                      <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-2 text-xs">
                        <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider text-muted-foreground">
                          User Reports ({listing.reports.length})
                        </span>
                        <div className="space-y-1.5 divide-y divide-border/60">
                          {listing.reports.map((rep) => (
                            <div key={rep.id} className="pt-1.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                              <div>
                                <span className="font-semibold uppercase text-rose-600 dark:text-rose-400 mr-2">
                                  [{rep.reason}]
                                </span>
                                <span className="text-foreground/90">{rep.note || "No specific note provided"}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(rep.created_at).toLocaleString("en-NG", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: All Listings ───────────────────────────────────────────── */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Search & Status Filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, location, or seller..."
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Status:</span>
              {(["all", "active", "sold", "removed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Table / Cards */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Item Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Seller</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reports</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAll.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No listings found matching active criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAll.map((item) => {
                      const stMeta = STATUS_LABELS[item.status];
                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium max-w-[220px]">
                            <Link
                              href={`/market/${item.id}`}
                              target="_blank"
                              className="hover:underline flex items-center gap-1 truncate"
                            >
                              <span className="truncate">{item.title}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                            </Link>
                            <span className="text-[10px] text-muted-foreground block truncate">{item.location}</span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {CATEGORY_DEFINITIONS[item.category]?.label || item.category}
                          </td>
                          <td className="p-3 font-semibold">{formatNgnPrice(item.price_ngn)}</td>
                          <td className="p-3 text-muted-foreground">{item.seller_name_masked}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[10px] ${stMeta.badgeClass}`}>
                              {stMeta.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {item.report_count > 0 ? (
                              <Badge variant="destructive" className="text-[10px]">
                                {item.report_count}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {item.status !== "removed" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRemoveModal(item)}
                                className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestore(item.id)}
                                className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              >
                                Restore
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Remove Listing Modal ────────────────────────────────────── */}
      <Dialog open={!!removeModalTarget} onOpenChange={(open) => !open && setRemoveModalTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-rose-600 dark:text-rose-400">
              <Trash2 className="h-4 w-4" />
              <span>Remove Listing</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Removing &ldquo;{removeModalTarget?.title}&rdquo; hides it from public marketplace queries. An audit log
              entry will be recorded.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRemove} className="space-y-4 py-2">
            {actionError && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="admin-remove-reason" className="text-xs font-semibold">
                Reason for Removal <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="admin-remove-reason"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="e.g. Prohibited item listed (weapons/counterfeit), confirmed scam..."
                minLength={3}
                maxLength={500}
                required
                className="text-xs resize-none h-24"
              />
              <span className="text-[10px] text-muted-foreground">{removeReason.length}/500 (min 3 chars)</span>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => setRemoveModalTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={actionLoading || removeReason.trim().length < 3}
              >
                {actionLoading ? "Removing..." : "Confirm Removal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
