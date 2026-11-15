"use client";

import { useState, useCallback, useEffect, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ExternalLink,
  Trash2,
  RotateCcw,
  Flag,
  ShoppingBag,
  CheckCircle2,
  Copy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AdminPageHeader,
  AdminDrawer,
  SegmentedControl,
  EmptyState,
  StatusBadge,
} from "@/components/admin/primitives";
import {
  PanelSection,
  FieldList,
  FieldItem,
} from "@/components/admin/primitives/PanelSection";
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  tab: "reported" | "all";
  reportedListings: MarketListingWithReports[];
  allListings: MarketListing[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  searchQuery: string;
  statusFilter: MarketStatus | "all";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const REPORT_REASON_LABELS: Record<string, string> = {
  scam: "Scam",
  prohibited: "Prohibited content",
  duplicate: "Duplicate listing",
  other: "Other",
};

const STATUS_VARIANT_MAP: Record<
  MarketStatus,
  { variant: "success" | "warning" | "danger" | "neutral"; label: string }
> = {
  active: { variant: "success", label: "Active" },
  sold: { variant: "info" as never, label: "Sold" },
  removed: { variant: "danger", label: "Removed" },
};

// ─── AgePill ─────────────────────────────────────────────────────────────────

function AgePill({ createdAt }: { createdAt: string }) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const cls =
    hours > 72
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      : hours > 24
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
        : "bg-secondary/70 text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}
      title={new Date(createdAt).toLocaleString()}
    >
      {relativeTime(createdAt)}
    </span>
  );
}

// ─── Thumbnail ───────────────────────────────────────────────────────────────

function Thumbnail({ paths, size = 40 }: { paths: string[]; size?: number }) {
  const src = paths[0]
    ? `/api/market/image?path=${encodeURIComponent(paths[0])}`
    : null;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-md bg-muted border border-border"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-[9px]">
          No photo
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminMarketClient({
  tab,
  reportedListings: initialReported,
  allListings: initialAll,
  total,
  page,
  totalPages,
  limit,
  searchQuery,
  statusFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local list state (for optimistic updates after actions)
  const [reportedListings, setReportedListings] =
    useState<MarketListingWithReports[]>(initialReported);
  const [allListings, setAllListings] = useState<MarketListing[]>(initialAll);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Remove dialog state
  const [removeTarget, setRemoveTarget] = useState<MarketListing | MarketListingWithReports | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Restore confirm dialog
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  // Search debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local lists in sync when server props change (after navigation)
  useEffect(() => {
    setReportedListings(initialReported);
  }, [initialReported]);

  useEffect(() => {
    setAllListings(initialAll);
  }, [initialAll]);

  // The active listing in drawer
  const activeList: (MarketListing | MarketListingWithReports)[] =
    tab === "reported" ? reportedListings : allListings;
  const selectedListing = selectedId
    ? activeList.find((l) => l.id === selectedId) ?? null
    : null;

  // ── URL param helpers ────────────────────────────────────────────────────

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") {
          p.delete(k);
        } else {
          p.set(k, v);
        }
      }
      startTransition(() => {
        router.push(`?${p.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const handleTabChange = (newTab: "reported" | "all") => {
    pushParams({ tab: newTab, page: undefined, q: undefined, status: undefined });
    setDrawerOpen(false);
    setSelectedId(null);
  };

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      pushParams({ q: value || undefined, page: undefined });
    }, 300);
  };

  const handleStatusFilter = (s: MarketStatus | "all") => {
    pushParams({ status: s === "all" ? undefined : s, page: undefined });
  };

  const handleLimitChange = (l: string) => {
    pushParams({ limit: l, page: undefined });
  };

  const handlePage = (newPage: number) => {
    pushParams({ page: String(newPage) });
  };

  // ── Row open ─────────────────────────────────────────────────────────────

  const openRow = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      if (e.key === "j" || e.key === "k") {
        const list = activeList;
        if (!list.length) return;
        const idx = selectedId ? list.findIndex((l) => l.id === selectedId) : -1;
        const nextIdx =
          e.key === "j"
            ? Math.min(idx + 1, list.length - 1)
            : Math.max(idx - 1, 0);
        setSelectedId(list[nextIdx].id);
        if (!drawerOpen) setDrawerOpen(true);
      }
      if (e.key === "Enter" && selectedId && !drawerOpen) {
        setDrawerOpen(true);
      }
      if (e.key === "Escape" && drawerOpen) {
        closeDrawer();
      }
      if (e.key === "/" && tab === "all") {
        e.preventDefault();
        document.getElementById("market-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeList, selectedId, drawerOpen, tab]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleOpenRemove = (listing: MarketListing | MarketListingWithReports) => {
    setRemoveTarget(listing);
    setRemoveReason("");
    setActionError(null);
  };

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTarget) return;
    if (removeReason.trim().length < 3) {
      setActionError("Removal reason must be at least 3 characters.");
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const res = await adminRemoveListing({
      listing_id: removeTarget.id,
      reason: removeReason.trim(),
    });
    setActionLoading(false);

    if (!res.success) {
      setActionError(res.error || "Failed to remove listing.");
      return;
    }

    const targetId = removeTarget.id;
    const reasonText = removeReason.trim();

    setReportedListings((prev) =>
      prev.map((l) =>
        l.id === targetId ? { ...l, status: "removed" as MarketStatus, removed_reason: reasonText } : l
      )
    );
    setAllListings((prev) =>
      prev.map((l) =>
        l.id === targetId ? { ...l, status: "removed" as MarketStatus, removed_reason: reasonText } : l
      )
    );

    setRemoveTarget(null);
    toast.success("Listing removed");

    // Auto-advance in drawer
    if (drawerOpen && selectedId === targetId) {
      const list = activeList;
      const idx = list.findIndex((l) => l.id === targetId);
      const next = list[idx + 1] ?? list[idx - 1] ?? null;
      if (next) setSelectedId(next.id);
      else closeDrawer();
    }
  };

  const handleOpenRestore = (listingId: string) => {
    setRestoreTarget(listingId);
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setActionLoading(true);
    const res = await adminRestoreListing(restoreTarget);
    setActionLoading(false);

    if (!res.success) {
      toast.error(res.error || "Failed to restore listing.");
      setRestoreTarget(null);
      return;
    }

    const id = restoreTarget;
    setReportedListings((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: "active" as MarketStatus, report_count: 0, removed_reason: null } : l
      )
    );
    setAllListings((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: "active" as MarketStatus, report_count: 0, removed_reason: null } : l
      )
    );
    setRestoreTarget(null);
    toast.success("Listing restored");

    if (drawerOpen && selectedId === id) {
      const list = activeList;
      const idx = list.findIndex((l) => l.id === id);
      const next = list[idx + 1] ?? list[idx - 1] ?? null;
      if (next) setSelectedId(next.id);
      else closeDrawer();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const tabOptions: { value: "reported" | "all"; label: string; count: number }[] = [
    { value: "reported", label: "Reported", count: reportedListings.length },
    { value: "all", label: "All listings", count: total },
  ];

  return (
    <main className="space-y-6 max-w-[1400px] mx-auto">
      <AdminPageHeader
        section="marketplace"
        icon={ShoppingBag}
        title="Marketplace"
        description="Review reported listings and moderate marketplace activity."
        badge={
          reportedListings.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              {reportedListings.length} pending
            </span>
          ) : undefined
        }
        actions={
          <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs">
            <Link href="/market" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live marketplace</span>
            </Link>
          </Button>
        }
      />

      {/* Tabs */}
      <SegmentedControl
        options={tabOptions.map((o) => ({
          value: o.value,
          label: o.label,
          count: o.count,
          icon: o.value === "reported" ? Flag : undefined,
        }))}
        value={tab}
        onChange={handleTabChange}
        ariaLabel="Marketplace tabs"
      />

      {/* ── Reported tab ─────────────────────────────────────────────────── */}
      {tab === "reported" && (
        <section>
          {reportedListings.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Queue is clear"
              description="No listings with open reports."
            />
          ) : (
            <div
              className={`rounded-lg border border-border bg-card overflow-hidden transition-opacity duration-150 ${isPending ? "opacity-60" : "opacity-100"}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/20 border-b border-border text-[11px] text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3 w-10" aria-label="Thumbnail" />
                      <th className="p-3">Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Reports</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Age</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {reportedListings.map((listing, i) => (
                      <tr
                        key={listing.id}
                        onClick={() => openRow(listing.id)}
                        className={`cursor-pointer transition-colors duration-100 hover:bg-muted/40 ${selectedId === listing.id && drawerOpen ? "bg-muted/50" : ""} ${i < 12 ? "" : ""}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") openRow(listing.id);
                        }}
                        aria-label={`Open details for ${listing.title}`}
                      >
                        <td className="p-3">
                          <Thumbnail paths={listing.image_paths ?? []} size={40} />
                        </td>
                        <td className="p-3 max-w-[200px]">
                          <div className="font-medium truncate">{listing.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{listing.location}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {CATEGORY_DEFINITIONS[listing.category]?.label || listing.category}
                        </td>
                        <td className="p-3 font-semibold tabular-nums">
                          {formatNgnPrice(listing.price_ngn)}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                            <Flag className="h-2.5 w-2.5" />
                            {listing.report_count}
                          </span>
                        </td>
                        <td className="p-3">
                          <StatusBadge
                            status={listing.status}
                            variantMap={{
                              active: { variant: "success", label: "Active" },
                              sold: { variant: "info", label: "Sold" },
                              removed: { variant: "danger", label: "Removed" },
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <AgePill createdAt={listing.created_at} />
                        </td>
                        <td
                          className="p-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {listing.status !== "removed" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRemove(listing)}
                              className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRestore(listing.id)}
                              className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              Restore
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── All listings tab ───────────────────────────────────────────────── */}
      {tab === "all" && (
        <section className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="market-search"
                defaultValue={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search listings… (press / to focus)"
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status filter */}
              <div className="flex items-center gap-1">
                {(["all", "active", "sold", "removed"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                      statusFilter === st
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {st === "all" ? "All" : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
              {/* Page size */}
              <Select value={String(limit)} onValueChange={handleLimitChange}>
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips */}
          {(searchQuery || statusFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-1.5">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button
                    type="button"
                    onClick={() => pushParams({ q: undefined, page: undefined })}
                    aria-label="Clear search"
                    className="ml-0.5 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  Status: {statusFilter}
                  <button
                    type="button"
                    onClick={() => pushParams({ status: undefined, page: undefined })}
                    aria-label="Clear status filter"
                    className="ml-0.5 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => pushParams({ q: undefined, status: undefined, page: undefined })}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Table */}
          <div
            className={`rounded-lg border border-border bg-card overflow-hidden transition-opacity duration-150 ${isPending ? "opacity-60" : "opacity-100"}`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/20 border-b border-border text-[11px] text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3 w-10" aria-label="Thumbnail" />
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Reports</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {allListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-muted-foreground">
                        No listings found.
                      </td>
                    </tr>
                  ) : (
                    allListings.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => openRow(item.id)}
                        className={`cursor-pointer transition-colors duration-100 hover:bg-muted/40 ${selectedId === item.id && drawerOpen ? "bg-muted/50" : ""}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") openRow(item.id);
                        }}
                        aria-label={`Open details for ${item.title}`}
                      >
                        <td className="p-3">
                          <Thumbnail paths={item.image_paths ?? []} size={40} />
                        </td>
                        <td className="p-3 max-w-[200px]">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{item.location}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {CATEGORY_DEFINITIONS[item.category]?.label || item.category}
                        </td>
                        <td className="p-3 font-semibold tabular-nums">
                          {formatNgnPrice(item.price_ngn)}
                        </td>
                        <td className="p-3">
                          {item.report_count > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                              {item.report_count}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-3">
                          <StatusBadge
                            status={item.status}
                            variantMap={{
                              active: { variant: "success", label: "Active" },
                              sold: { variant: "info", label: "Sold" },
                              removed: { variant: "danger", label: "Removed" },
                            }}
                          />
                        </td>
                        <td
                          className="p-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.status !== "removed" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRemove(item)}
                              className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRestore(item.id)}
                              className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              Restore
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>
                {total.toLocaleString()} listing{total !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1 || isPending}
                  onClick={() => handlePage(page - 1)}
                >
                  Previous
                </Button>
                <span className="tabular-nums">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page >= totalPages || isPending}
                  onClick={() => handlePage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      <AdminDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        title={selectedListing?.title ?? "Listing detail"}
        subtitle={
          selectedListing
            ? CATEGORY_DEFINITIONS[selectedListing.category]?.label
            : undefined
        }
        badge={
          selectedListing ? (
            <StatusBadge
              status={selectedListing.status}
              variantMap={{
                active: { variant: "success", label: "Active" },
                sold: { variant: "info", label: "Sold" },
                removed: { variant: "danger", label: "Removed" },
              }}
            />
          ) : undefined
        }
        timestamp={
          selectedListing ? relativeTime(selectedListing.created_at) : undefined
        }
        footer={
          selectedListing ? (
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                asChild
              >
                <Link
                  href={`/market/${selectedListing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View listing
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <div className="flex-1" />
              {selectedListing.status !== "removed" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleOpenRemove(selectedListing)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove listing
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => handleOpenRestore(selectedListing.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore listing
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedListing && (
          <>
            {/* Listing details */}
            <PanelSection title="Listing details">
              <FieldList columns={2}>
                <FieldItem
                  label="Price"
                  value={formatNgnPrice(selectedListing.price_ngn)}
                />
                <FieldItem
                  label="Category"
                  value={CATEGORY_DEFINITIONS[selectedListing.category]?.label}
                />
                <FieldItem
                  label="Condition"
                  value={CONDITION_LABELS[selectedListing.condition]?.label}
                />
                <FieldItem label="Location" value={selectedListing.location} />
                <FieldItem
                  label="Created"
                  value={new Date(selectedListing.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <FieldItem
                  label="Expires"
                  value={new Date(selectedListing.expires_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
                {selectedListing.removed_reason && (
                  <FieldItem
                    label="Removal reason"
                    value={selectedListing.removed_reason}
                    span={2}
                  />
                )}
              </FieldList>
            </PanelSection>

            {/* Image gallery */}
            {selectedListing.image_paths?.length > 0 && (
              <PanelSection title="Images">
                <div className="flex gap-2 flex-wrap">
                  {selectedListing.image_paths.slice(0, 4).map((path, i) => (
                    <a
                      key={i}
                      href={`/api/market/image?path=${encodeURIComponent(path)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-20 w-20 rounded-md overflow-hidden border border-border shrink-0"
                    >
                      <Image
                        src={`/api/market/image?path=${encodeURIComponent(path)}`}
                        alt={`Image ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    </a>
                  ))}
                  {selectedListing.image_paths.length > 4 && (
                    <div className="h-20 w-20 rounded-md border border-border bg-secondary/50 flex items-center justify-center text-xs text-muted-foreground">
                      +{selectedListing.image_paths.length - 4} more
                    </div>
                  )}
                </div>
              </PanelSection>
            )}

            {/* Seller */}
            <PanelSection title="Seller">
              <FieldList columns={2}>
                <FieldItem label="Provider" value={selectedListing.seller_name_masked} />
                <FieldItem
                  label="Verified"
                  value={
                    selectedListing.seller_verified ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )
                  }
                />
                {selectedListing.seller_id && (
                  <FieldItem
                    label="Profile"
                    span={2}
                    value={
                      <Link
                        href={`/admin/users?q=${selectedListing.seller_id}`}
                        className="text-primary hover:underline underline-offset-2 text-xs"
                      >
                        View seller in users directory
                      </Link>
                    }
                  />
                )}
              </FieldList>
            </PanelSection>

            {/* Reports section */}
            {(tab === "reported" ||
              (selectedListing as MarketListingWithReports).reports?.length ||
              selectedListing.report_count > 0) && (
              <PanelSection title={`Reports (${selectedListing.report_count})`}>
                {(selectedListing as MarketListingWithReports).reports?.length ? (
                  <div className="space-y-2">
                    {(selectedListing as MarketListingWithReports).reports!.map(
                      (rep) => (
                        <div
                          key={rep.id}
                          className="rounded-md border border-border/70 bg-secondary/30 p-3 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">
                              {REPORT_REASON_LABELS[rep.reason] ?? rep.reason}
                            </span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {new Date(rep.created_at).toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          {rep.note && (
                            <p className="text-muted-foreground">{rep.note}</p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No detailed reports available.
                  </p>
                )}
              </PanelSection>
            )}
          </>
        )}
      </AdminDrawer>

      {/* ── Remove confirm dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-rose-600 dark:text-rose-400">
              <Trash2 className="h-4 w-4" />
              <span>Remove listing</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Removing &ldquo;{removeTarget?.title}&rdquo; hides it from public
              marketplace queries. An audit log entry will be recorded.
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
                Reason for removal <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="admin-remove-reason"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="e.g. Prohibited service (academic dishonesty, escort), physical goods listing, confirmed scam..."
                minLength={3}
                maxLength={500}
                required
                className="text-xs resize-none h-24"
              />
              <span className="text-[10px] text-muted-foreground">
                {removeReason.length}/500 (min 3 chars)
              </span>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => setRemoveTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={actionLoading || removeReason.trim().length < 3}
              >
                {actionLoading ? "Removing…" : "Confirm removal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Restore confirm dialog ────────────────────────────────────────── */}
      <Dialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-emerald-600 dark:text-emerald-400">
              <RotateCcw className="h-4 w-4" />
              <span>Restore listing</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will restore the listing to active status and reset the report
              count. An audit log entry will be recorded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => setRestoreTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
              onClick={handleConfirmRestore}
            >
              {actionLoading ? "Restoring…" : "Confirm restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
