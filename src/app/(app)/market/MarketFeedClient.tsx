"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  ShieldAlert,
  MapPin,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_DEFINITIONS,
  CONDITION_LABELS,
  formatNgnPrice,
  SAFETY_DISCLAIMER,
} from "@/lib/market/helpers";
import type { MarketCategory, MarketListing } from "@/lib/market/types";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";

interface MarketFeedClientProps {
  initialListings: MarketListing[];
  total: number;
  currentPage: number;
  totalPages: number;
  currentCategory: MarketCategory | "all";
  currentSearch: string;
}

export function MarketFeedClient({
  initialListings,
  total,
  currentPage,
  totalPages,
  currentCategory,
  currentSearch,
}: MarketFeedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | "all">(currentCategory);

  const applyFilters = (newCategory = selectedCategory, newSearch = searchTerm, page = 1) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newCategory && newCategory !== "all") {
        params.set("category", newCategory);
      } else {
        params.delete("category");
      }

      if (newSearch && newSearch.trim()) {
        params.set("search", newSearch.trim());
      } else {
        params.delete("search");
      }

      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }

      router.push(`/market?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(selectedCategory, searchTerm, 1);
  };

  const handleCategoryClick = (cat: MarketCategory | "all") => {
    setSelectedCategory(cat);
    applyFilters(cat, searchTerm, 1);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    startTransition(() => {
      router.push("/market");
    });
  };

  const categoriesList: Array<{ id: MarketCategory | "all"; label: string }> = [
    { id: "all", label: "All Items" },
    ...Object.values(CATEGORY_DEFINITIONS).map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* ── Top Safety Banner ──────────────────────────────────────────────── */}
      <section
        aria-label="Safety advice"
        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight">Marketplace Safety Notice</h2>
            <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              {SAFETY_DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Zed Market</h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs ml-1">
              v1 Verified
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Direct peer-to-peer listings for verified Nigerian youth. Contact sellers on WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link href="/market/mine">My Listings</Link>
          </Button>
          <Button size="sm" asChild className="h-9 gap-1.5 shadow-sm">
            <Link href="/market/new">
              <Plus className="h-4 w-4" />
              <span>Post an item</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* ── Search & Filters ──────────────────────────────────────────────── */}
      <section aria-label="Search and category filters" className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search phones, notes, fashion, services, location..."
            className="pl-9 pr-24 h-11 bg-card/80 border-border text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                applyFilters(selectedCategory, "", 1);
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
          >
            Search
          </Button>
        </form>

        {/* Category Pills (horizontally scrollable on mobile) */}
        <nav
          aria-label="Market Categories"
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {categoriesList.map(({ id, label }) => {
            const isSelected = selectedCategory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleCategoryClick(id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/70 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </section>

      {/* ── Active Filters Summary ────────────────────────────────────────── */}
      {(selectedCategory !== "all" || currentSearch) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
          <span>
            Showing results for{" "}
            <strong>{selectedCategory !== "all" ? CATEGORY_DEFINITIONS[selectedCategory].label : "All Categories"}</strong>
            {currentSearch ? ` matching "${currentSearch}"` : ""} ({total} {total === 1 ? "item" : "items"})
          </span>
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-primary hover:underline font-medium"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* ── Listings Grid ─────────────────────────────────────────────────── */}
      {initialListings.length === 0 ? (
        <section
          aria-label="Empty listings"
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <PackageX className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold">No listings found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
            {currentSearch || selectedCategory !== "all"
              ? "We couldn't find any items matching your active search filters. Try broadening your terms or category."
              : "No items have been listed in this marketplace yet. Be the first verified seller to post an item!"}
          </p>
          <div className="flex gap-2">
            {(currentSearch || selectedCategory !== "all") && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear filters
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href="/market/new">Post an item</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section
          aria-label="Market listings grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {initialListings.map((listing) => {
            const hasImages = listing.image_paths && listing.image_paths.length > 0;
            const primaryImage = hasImages
              ? `/api/market/image?path=${encodeURIComponent(listing.image_paths[0])}`
              : null;
            const conditionMeta = CONDITION_LABELS[listing.condition];
            const categoryMeta = CATEGORY_DEFINITIONS[listing.category];

            return (
              <article
                key={listing.id}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
              >
                <Link href={`/market/${listing.id}`} className="block">
                  {/* Image Thumbnail */}
                  <div className="relative aspect-video w-full bg-muted/60 overflow-hidden">
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        {categoryMeta ? (
                          <categoryMeta.icon className="h-10 w-10 stroke-[1.25] text-muted-foreground/60" />
                        ) : (
                          <ShoppingBag className="h-10 w-10 text-muted-foreground/60" />
                        )}
                      </div>
                    )}

                    {/* Condition badge overlay */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border backdrop-blur-sm ${conditionMeta.badgeClass}`}
                      >
                        {conditionMeta.label}
                      </span>
                    </div>

                    {/* Image counter if multiple */}
                    {hasImages && listing.image_paths.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white font-medium backdrop-blur-sm">
                        1/{listing.image_paths.length}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-2">
                    {/* Price and Category */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-bold text-foreground tracking-tight">
                        {formatNgnPrice(listing.price_ngn)}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px]">
                        {categoryMeta?.label || listing.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>

                    {/* Location & Seller Masked Name */}
                    <div className="pt-1 flex flex-col gap-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                        <span className="truncate">{listing.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1 border-t border-border/50">
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <span className="truncate">{listing.seller_name_masked}</span>
                          <VerifiedBadge isVerified={listing.seller_verified} />
                        </span>
                        <span className="text-[10px]">
                          {new Date(listing.created_at).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </section>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <nav aria-label="Pagination Navigation" className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isPending}
            onClick={() => applyFilters(selectedCategory, searchTerm, currentPage - 1)}
            className="h-8 gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>

          <span className="text-xs text-muted-foreground px-2">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isPending}
            onClick={() => applyFilters(selectedCategory, searchTerm, currentPage + 1)}
            className="h-8 gap-1 text-xs"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </nav>
      )}
    </div>
  );
}
