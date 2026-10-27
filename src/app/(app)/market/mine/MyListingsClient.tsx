"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  ShoppingBag,
  ExternalLink,
  Edit,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Clock,
  MapPin,
  PackageX,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  formatNgnPrice,
  STATUS_LABELS,
  CONDITION_LABELS,
  CATEGORY_DEFINITIONS,
} from "@/lib/market/helpers";
import { markListingSold, deleteMyListing } from "@/lib/market/actions";
import type { MarketListing, MarketStatus } from "@/lib/market/types";

interface MyListingsClientProps {
  initialListings: MarketListing[];
}

export function MyListingsClient({ initialListings }: MyListingsClientProps) {
  const [listings, setListings] = useState<MarketListing[]>(initialListings);
  const [filterTab, setFilterTab] = useState<MarketStatus | "all">("all");

  const [deleteTarget, setDeleteTarget] = useState<MarketListing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredListings = listings.filter((l) => {
    if (filterTab === "all") return true;
    return l.status === filterTab;
  });

  const handleMarkSold = async (id: string) => {
    setUpdatingId(id);
    const res = await markListingSold(id);
    setUpdatingId(null);
    if (res.success) {
      setListings((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "sold" } : item))
      );
    } else {
      alert(res.error || "Failed to mark listing as sold.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteMyListing(deleteTarget.id);
    setDeleting(false);

    if (res.success) {
      // If hard deleted remove from array, if soft-deleted update status to removed
      setListings((prev) =>
        prev.filter((l) => l.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
    } else {
      alert(res.error || "Failed to delete listing.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-muted-foreground hover:text-foreground -ml-2 mb-1">
            <Link href="/market">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Marketplace</span>
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-xs text-muted-foreground">Manage your service listings on Zed Market</p>
        </div>

        <Button size="sm" asChild className="h-9 gap-1.5 shadow-sm">
          <Link href="/market/new">
            <Plus className="h-4 w-4" />
            <span>Post a service</span>
          </Link>
        </Button>
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterTab === "all"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("active")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterTab === "active"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({listings.filter((l) => l.status === "active").length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("sold")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterTab === "sold"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sold ({listings.filter((l) => l.status === "sold").length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("removed")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterTab === "removed"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Removed ({listings.filter((l) => l.status === "removed").length})
        </button>
      </div>

      {/* ── Listings List ─────────────────────────────────────────────────── */}
      {filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
            <PackageX className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold">No listings in this tab</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {filterTab === "all"
              ? "You haven't posted any services on Zed Market yet."
              : `You have no ${filterTab} services at this time.`}
          </p>
          {filterTab === "all" && (
            <Button size="sm" asChild className="mt-2">
              <Link href="/market/new">Post a service</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredListings.map((listing) => {
            const hasImages = listing.image_paths && listing.image_paths.length > 0;
            const primaryImage = hasImages
              ? `/api/market/image?path=${encodeURIComponent(listing.image_paths[0])}`
              : null;
            const statusMeta = STATUS_LABELS[listing.status];
            const conditionMeta = CONDITION_LABELS[listing.condition];
            const categoryMeta = CATEGORY_DEFINITIONS[listing.category];

            return (
              <div
                key={listing.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-all"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-start gap-3.5">
                  <div className="relative h-20 w-24 sm:h-22 sm:w-28 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                    {primaryImage ? (
                      <Image src={primaryImage} alt="" fill sizes="112px" className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-7 w-7 opacity-50" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {conditionMeta.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        • {categoryMeta?.label || listing.category}
                      </span>
                    </div>

                    <Link
                      href={`/market/${listing.id}`}
                      className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1 block"
                    >
                      {listing.title}
                    </Link>

                    <div className="text-sm font-bold text-foreground">
                      {formatNgnPrice(listing.price_ngn)}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </span>
                      <span>•</span>
                      <span>
                        Posted on {new Date(listing.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {listing.removed_reason && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Reason: {listing.removed_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 w-full sm:w-auto justify-end">
                  <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-xs">
                    <Link href={`/market/${listing.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View</span>
                    </Link>
                  </Button>

                  {listing.status !== "removed" && (
                    <Button variant="outline" size="sm" asChild className="h-8 gap-1 text-xs">
                      <Link href={`/market/${listing.id}/edit`}>
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                  )}

                  {listing.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingId === listing.id}
                      onClick={() => handleMarkSold(listing.id)}
                      className="h-8 gap-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark sold</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(listing)}
                    className="h-8 p-2 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    aria-label="Delete listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Listing</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDeleteConfirm}
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
