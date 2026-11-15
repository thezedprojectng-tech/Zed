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
  MapPin,
  PackageX,
  ArrowLeft,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SegmentedControl, FilterOption } from "@/components/admin/primitives/SegmentedControl";
import {
  formatNgnPrice,
  STATUS_LABELS,
  CONDITION_LABELS,
  CATEGORY_DEFINITIONS,
} from "@/lib/market/helpers";
import { markListingSold, deleteMyListing } from "@/lib/market/actions";
import type { MarketListing, MarketStatus, MarketCategory } from "@/lib/market/types";

interface MyListingsClientProps {
  initialListings: MarketListing[];
}

function getHumanCategoryLabel(slug: string): string {
  if (CATEGORY_DEFINITIONS[slug as MarketCategory]?.label) {
    return CATEGORY_DEFINITIONS[slug as MarketCategory].label;
  }
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
      setListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      alert(res.error || "Failed to delete listing.");
    }
  };

  const tabOptions: FilterOption<MarketStatus | "all">[] = [
    { id: "all", label: "All", count: listings.length },
    { id: "active", label: "Active", count: listings.filter((l) => l.status === "active").length },
    { id: "sold", label: "Sold", count: listings.filter((l) => l.status === "sold").length },
    { id: "removed", label: "Removed", count: listings.filter((l) => l.status === "removed").length },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
            <Link href="/market">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to marketplace</span>
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              My listings
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your service listings, availability, and active offerings on Zed Market
            </p>
          </div>

          <Button size="sm" asChild className="h-9 gap-1.5 shadow-xs shrink-0 self-start sm:self-auto">
            <Link href="/market/new">
              <Plus className="h-4 w-4" />
              <span>Post a service</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Segmented Control Filter Tabs ───────────────────────────────── */}
      <div>
        <SegmentedControl<MarketStatus | "all">
          options={tabOptions}
          value={filterTab}
          onChange={(val) => setFilterTab(val)}
          size="sm"
          ariaLabel="Filter listings by status"
        />
      </div>

      {/* ── Flat Listings List ───────────────────────────────────────────── */}
      {filteredListings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
            <PackageX className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              {filterTab === "all"
                ? "No listings created yet"
                : filterTab === "active"
                ? "No active service listings"
                : filterTab === "sold"
                ? "No sold or completed listings"
                : "No removed listings"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {filterTab === "all"
                ? "You haven't posted any services on Zed Market yet. List your skills to connect with clients."
                : filterTab === "active"
                ? "You have no active services at this time. Post a new service to start offering your skills."
                : filterTab === "sold"
                ? "Completed services that you have marked as sold or delivered will appear here."
                : "Services that were removed or taken down by moderation will appear here."}
            </p>
          </div>
          {filterTab === "all" && (
            <div className="pt-1">
              <Button size="sm" asChild className="h-9 text-xs">
                <Link href="/market/new">Post a service</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card divide-y divide-border/60 overflow-hidden">
          {filteredListings.map((listing) => {
            const hasImages = listing.image_paths && listing.image_paths.length > 0;
            const primaryImage = hasImages
              ? `/api/market/image?path=${encodeURIComponent(listing.image_paths[0])}`
              : null;
            const statusMeta = STATUS_LABELS[listing.status];
            const categoryLabel = getHumanCategoryLabel(listing.category);

            return (
              <div
                key={listing.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="relative h-20 w-24 sm:h-22 sm:w-28 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={listing.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                        <ShoppingBag className="h-7 w-7 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        • {categoryLabel}
                      </span>
                    </div>

                    <Link
                      href={`/market/${listing.id}`}
                      className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1 block leading-snug"
                    >
                      {listing.title}
                    </Link>

                    <div className="text-sm font-semibold tabular-nums text-foreground">
                      {formatNgnPrice(listing.price_ngn)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 stroke-[1.5]" />
                        <span>{listing.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 stroke-[1.5]" />
                        <span>
                          {new Date(listing.created_at).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>

                    {listing.removed_reason && (
                      <div className="text-[11px] text-destructive font-medium pt-0.5">
                        Reason: {listing.removed_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Primary Edit + Dropdown More Menu) */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 w-full sm:w-auto justify-end">
                  {listing.status !== "removed" ? (
                    <Button variant="outline" size="sm" asChild className="h-8 gap-1 text-xs font-medium">
                      <Link href={`/market/${listing.id}/edit`}>
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                  ) : null}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href={`/market/${listing.id}`} className="cursor-pointer">
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          <span>View listing</span>
                        </Link>
                      </DropdownMenuItem>

                      {listing.status === "active" && (
                        <DropdownMenuItem
                          onClick={() => handleMarkSold(listing.id)}
                          disabled={updatingId === listing.id}
                          className="cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                          <span>Mark as sold</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(listing)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        <span>Delete listing</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete listing</span>
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
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
