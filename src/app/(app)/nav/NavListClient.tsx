"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  FileSearch,
  FileText,
  MessagesSquare,
  Check,
  Compass,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavProgressStore } from "@/store/useNavProgressStore";
import { useIsMounted } from "@/lib/hooks";
import type { NavFlow } from "@/types/nav";
import { pluralize } from "@/lib/utils";
import { getFlowProgress } from "@/lib/nav/engine";

interface GuideConfig {
  flow: NavFlow;
  href: string;
  code: string;
}

const GUIDE_ICONS: Record<string, React.ElementType> = {
  passport: BookOpen,
  nysc: GraduationCap,
  "nin-bvn": Fingerprint,
  cac: Building2,
};

interface NavListClientProps {
  guides: GuideConfig[];
}

const TOOLS = [
  {
    code: "NYSC-07",
    title: "Call-up letter parser",
    description: "Extract state code, deployed state, and reporting countdown on-device with zero server uploads.",
    href: "/nav/nysc/call-up",
    icon: FileSearch,
    status: "Live",
  },
  {
    code: "NYSC-06",
    title: "CDS logger",
    description: "Log Community Development Service attendance and track hours across sessions.",
    href: "/nav/nysc/cds",
    icon: FileText,
    status: "Live",
  },
  {
    code: "NYSC-05",
    title: "PPA & relocation hub",
    description: "Verified NYSC-approved organizations, posting verification, and relocation guidelines.",
    href: "/nav/nysc/ppa",
    icon: MessagesSquare,
    status: "Phase 2",
  },
];

export function NavListClient({ guides }: NavListClientProps) {
  const isMounted = useIsMounted();
  const { progressMap } = useNavProgressStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Ctrl+K keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    guides.forEach((g) => {
      if (g.flow.category) set.add(g.flow.category);
    });
    return ["All", ...Array.from(set)];
  }, [guides]);

  // Compute active in-progress guide for the "continue" card
  const activeGuide = useMemo(() => {
    if (!isMounted) return null;
    for (const g of guides) {
      const p = progressMap[g.flow.id];
      const metrics = getFlowProgress(g.flow, p);
      if (p && !metrics.isCompleted && (p.completed_steps?.length > 0 || p.current_step)) {
        return {
          ...g,
          completedCount: metrics.completedCount,
          totalCount: metrics.totalSlots,
          pct: metrics.percentage,
        };
      }
    }
    return null;
  }, [guides, progressMap, isMounted]);

  // Filter guides
  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return guides.filter((g) => {
      const matchesCategory =
        selectedCategory === "All" || g.flow.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        g.flow.title.toLowerCase().includes(q) ||
        g.flow.summary.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        g.flow.category.toLowerCase().includes(q)
      );
    });
  }, [guides, searchQuery, selectedCategory]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <header className="space-y-1.5 pb-2">
        <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
          Civic guides
        </h1>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Verified, step-by-step guidance for Nigerian administrative procedures and youth transition playbooks.
        </p>
      </header>

      {/* ── 2. Continue Active Guide Card (if available) ───────────── */}
      {activeGuide && (
        <section aria-label="Resume active guide" className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Continue where you left off
          </h2>

          <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs transition-shadow duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-[var(--data-verified)]">
            <div className="space-y-2 flex-1 min-w-0 pl-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-sans">
                  {activeGuide.code}
                </span>
                <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                  In progress
                </span>
                <span className="text-xs text-muted-foreground font-sans tabular-nums">
                  {activeGuide.completedCount} of {activeGuide.totalCount} {pluralize(activeGuide.totalCount, "step", "steps")} completed
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground truncate">
                {activeGuide.flow.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {activeGuide.flow.summary}
              </p>
              <div className="h-1.5 w-full max-w-md bg-secondary/80 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[var(--data-verified)] rounded-full transition-all duration-300"
                  style={{ width: `${activeGuide.pct}%` }}
                />
              </div>
            </div>

            <div className="shrink-0 pt-2 md:pt-0">
              <Button asChild size="default" className="h-10 px-5 text-sm font-medium">
                <Link href={activeGuide.href}>
                  <span>Resume guide</span>
                  <ArrowRight className="h-4 w-4 ml-2 stroke-[1.5]" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Search and Category Filter Bar ──────────────────────── */}
      <section aria-label="Search and filter guides" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search input with Ctrl+K shortcut */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground stroke-[1.5] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by name, department, or code…"
              className="w-full h-10 pl-9 pr-16 rounded-lg border border-border/70 bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 stroke-[1.5]" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center rounded border border-border/80 bg-secondary/80 px-1.5 font-sans text-[10px] text-muted-foreground select-none pointer-events-none">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border/60"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Guides Grid ─────────────────────────────────────────── */}
      <section aria-label="Available civic guides" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">
            {selectedCategory === "All" ? "All guides" : `${selectedCategory} guides`}
          </h2>
          <span className="text-xs text-muted-foreground font-sans tabular-nums">
            {filteredGuides.length} {pluralize(filteredGuides.length, "guide", "guides")}
          </span>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card p-8 text-center space-y-3">
            <Compass className="h-8 w-8 text-muted-foreground mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No matching guides found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No civic guides match your current search criteria. Try a different query or reset the filter.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="h-8 text-xs font-medium border-border/70"
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuides.map((guide) => {
              const Icon = GUIDE_ICONS[guide.flow.id] || Compass;
              const p = isMounted ? progressMap[guide.flow.id] : undefined;
              const flowMetrics = getFlowProgress(guide.flow, p);
              const isCompleted = flowMetrics.isCompleted;
              const completedStepsCount = flowMetrics.completedCount;
              const totalSteps = flowMetrics.totalSlots;
              const isInProgress = !isCompleted && (flowMetrics.completedCount > 0 || Boolean(p?.current_step));
              const progressPct = flowMetrics.percentage;

              return (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 hover:shadow-xs hover:border-border transition-all flex flex-col justify-between gap-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-foreground group-hover:text-primary transition-colors">
                          <Icon className="h-4 w-4 stroke-[1.5]" />
                        </div>
                        <span className="text-xs text-muted-foreground font-sans">
                          {guide.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                            <Check className="h-3 w-3 stroke-[1.5]" />
                            Completed
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                            In progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {guide.flow.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>{guide.flow.title}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {guide.flow.summary}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-sans tabular-nums">
                      <span>
                        {isInProgress || isCompleted
                          ? `${completedStepsCount} of ${totalSteps} ${pluralize(totalSteps, "step", "steps")} completed`
                          : `${totalSteps} steps · ~${guide.flow.estimatedMinutes} mins`}
                      </span>
                      {isInProgress && <span>{progressPct}%</span>}
                    </div>

                    {(isInProgress || isCompleted) && (
                      <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--data-verified)] rounded-full transition-all duration-300"
                          style={{ width: `${isCompleted ? 100 : progressPct}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-medium text-primary inline-flex items-center gap-1 group-hover:underline">
                        {isCompleted ? "Review guide" : isInProgress ? "Resume guide" : "Start guide"}
                        <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. Tools Section (compact rows) ───────────────────────── */}
      <section aria-label="Civil and NYSC tools" className="space-y-3 pt-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Civil &amp; NYSC tools
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            On-device utility apps for corps members and graduating students.
          </p>
        </div>

        <div className="space-y-2.5">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.code}
                href={tool.href}
                className="rounded-lg border border-border/70 bg-card p-3.5 sm:p-4 hover:border-border hover:shadow-xs transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-foreground group-hover:text-primary transition-colors shrink-0">
                    <Icon className="h-4 w-4 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {tool.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground/80 bg-secondary px-1.5 py-0.2 rounded border border-border/40 font-sans shrink-0">
                        {tool.code}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-snug">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-primary hidden sm:inline">
                    Open tool
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[1.5]" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
