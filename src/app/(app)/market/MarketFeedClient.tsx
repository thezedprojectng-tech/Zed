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
  ChevronLeft,
  ChevronRight,
  X,
  PackageX,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_DEFINITIONS,
  CONDITION_LABELS,
  formatNgnPrice,
  SAFETY_DISCLAIMER,
} from "@/lib/market/helpers";
import type { MarketCategory, MarketListing } from "@/lib/market/types";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import { pluralize } from "@/lib/utils";

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    { id: "all", label: "All services" },
    ...Object.values(CATEGORY_DEFINITIONS).map((c) => ({ id: c.id, label: c.label })),
  ];

  const hasActiveFilters = selectedCategory !== "all" || Boolean(currentSearch);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
              Zed Market
            </h1>
            <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Services
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            A peer services marketplace for Nigerian youth. Connect directly with designers, tutors, tech pros, and more.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" asChild className="h-9 px-3.5 text-xs font-medium border-border/70 hover:bg-secondary">
            <Link href="/market/mine">My listings</Link>
          </Button>
          <Button size="sm" asChild className="h-9 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/market/new">
              <Plus className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
              <span>Post a service</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* ── 2. Marketplace Safety Notice (Flat callout) ───────────── */}
      <aside
        aria-label="Marketplace safety disclaimer"
        className="rounded-lg border border-border border-l-2 border-l-[var(--data-flows)] bg-card p-4 text-xs text-foreground"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 stroke-[1.5]" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-semibold text-foreground">Safety notice</p>
            <p className="text-muted-foreground">{SAFETY_DISCLAIMER}</p>
          </div>
        </div>
      </aside>

      {/* ── 3. Search and Category Filters ────────────────────────── */}
      <section aria-label="Search and category filters" className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground stroke-[1.5] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search design, tutoring, tech, repairs…"
              className="w-full h-10 pl-9 pr-20 rounded-lg border border-border/70 bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  applyFilters(selectedCategory, "", 1);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search text"
              >
                <X className="h-3.5 w-3.5 stroke-[1.5]" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2.5 text-xs font-medium bg-primary text-primary-foreground"
            >
              Search
            </Button>
          </form>

          {/* Mobile Filters Trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            className="sm:hidden h-10 px-3 text-xs font-medium border-border/70 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Filters</span>
            {selectedCategory !== "all" && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Category Pills (Desktop inline) */}
        <nav
          aria-label="Market categories"
          className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        >
          {categoriesList.map(({ id, label }) => {
            const isSelected = selectedCategory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleCategoryClick(id)}
                className={`h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border/60"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </section>

      {/* ── 4. Active Filters as Removable Chips ──────────────────── */}
      {hasActiveFilters && (
        <section aria-label="Active filters" className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-secondary/50 px-2 py-1 text-xs font-medium text-foreground">
              <span>{CATEGORY_DEFINITIONS[selectedCategory]?.label || selectedCategory}</span>
              <button
                type="button"
                onClick={() => handleCategoryClick("all")}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${selectedCategory} filter`}
              >
                <X className="h-3 w-3 stroke-[1.5]" />
              </button>
            </span>
          )}

          {currentSearch && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-secondary/50 px-2 py-1 text-xs font-medium text-foreground">
              <span>&ldquo;{currentSearch}&rdquo;</span>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  applyFilters(selectedCategory, "", 1);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Remove search query"
              >
                <X className="h-3 w-3 stroke-[1.5]" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-primary hover:underline font-medium ml-1"
          >
            Clear all
          </button>
        </section>
      )}

      {/* ── 5. Mobile Filters Drawer / Bottom Sheet ───────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 sm:hidden bg-background/80 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-card border-t border-border/80 rounded-t-xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h2 className="text-sm font-semibold text-foreground">Category filter</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close filters drawer"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="space-y-1.5">
              {categoriesList.map(({ id, label }) => {
                const isSelected = selectedCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      handleCategoryClick(id);
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Listings Grid ──────────────────────────────────────── */}
      {initialListings.length === 0 ? (
        <section
          aria-label="No listings"
          className="rounded-lg border border-border/70 bg-card p-10 text-center space-y-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mx-auto">
            <PackageX className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No listings found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {hasActiveFilters
                ? "No services match your active search or category filters. Try clearing your filters or using different keywords."
                : "No services have been posted yet. Be the first to list a service on Zed Market!"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="h-9 text-xs border-border/70">
                Clear all filters
              </Button>
            )}
            <Button size="sm" asChild className="h-9 text-xs bg-primary text-primary-foreground">
              <Link href="/market/new">Post a service</Link>
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
                className="group flex flex-col justify-between rounded-lg border border-border/70 bg-card hover:border-border hover:shadow-xs transition-all overflow-hidden"
              >
                <Link href={`/market/${listing.id}`} className="block">
                  {/* Fixed aspect ratio card thumbnail with neutral placeholder */}
                  <div className="relative aspect-video w-full bg-secondary/40 overflow-hidden">
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                        {categoryMeta ? (
                          <categoryMeta.icon className="h-8 w-8 stroke-[1.25]" />
                        ) : (
                          <ShoppingBag className="h-8 w-8 stroke-[1.25]" />
                        )}
                      </div>
                    )}

                    {/* Condition badge */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-medium border border-border/60 bg-background/80 backdrop-blur-xs text-foreground">
                        {conditionMeta?.label || listing.condition}
                      </span>
                    </div>

                    {/* Image counter if multiple */}
                    {hasImages && listing.image_paths.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-white font-sans tabular-nums backdrop-blur-xs">
                        1/{listing.image_paths.length}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    {/* Price and Category */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-semibold font-sans tabular-nums text-foreground tracking-tight">
                        {formatNgnPrice(listing.price_ngn)}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px]">
                        {categoryMeta?.label || listing.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {listing.title}
                    </h2>

                    {/* Location & Seller Masked Name */}
                    <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 stroke-[1.5] text-muted-foreground" />
                        <span className="truncate">{listing.location}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground truncate">
                          <span className="truncate">{listing.seller_name_masked}</span>
                          <VerifiedBadge isVerified={listing.seller_verified} />
                        </span>
                        <span className="text-muted-foreground font-sans tabular-nums shrink-0">
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

      {/* ── 7. Pagination ─────────────────────────────────────────── */}
      {totalPages > 1 && (
        <nav aria-label="Pagination navigation" className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isPending}
            onClick={() => applyFilters(selectedCategory, searchTerm, currentPage - 1)}
            className="h-9 px-3 text-xs font-medium border-border/70"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1 stroke-[1.5]" />
            <span>Previous</span>
          </Button>

          <span className="text-xs text-muted-foreground font-sans tabular-nums px-3">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isPending}
            onClick={() => applyFilters(selectedCategory, searchTerm, currentPage + 1)}
            className="h-9 px-3 text-xs font-medium border-border/70"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1 stroke-[1.5]" />
          </Button>
        </nav>
      )}
    </div>
  );
}
