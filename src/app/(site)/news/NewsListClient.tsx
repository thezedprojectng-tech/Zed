"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pin, ArrowRight, Newspaper, Calendar } from "lucide-react";
import type { PublicNewsPostListItem } from "@/lib/news/public-queries";
import { SegmentedControl } from "@/components/admin/primitives/SegmentedControl";
import { Button } from "@/components/ui/button";

interface Props {
  initialPosts: PublicNewsPostListItem[];
}

const CATEGORY_NAMES: Record<string, string> = {
  news: "News",
  update: "Update",
  announcement: "Announcement",
};

export function NewsListClient({ initialPosts }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filterOptions = useMemo(() => {
    const counts: Record<string, number> = {
      all: initialPosts.length,
      news: 0,
      update: 0,
      announcement: 0,
    };
    for (const p of initialPosts) {
      if (p.category in counts) {
        counts[p.category]++;
      }
    }
    return [
      { value: "all", label: "All", count: counts.all },
      { value: "news", label: "News", count: counts.news },
      { value: "update", label: "Updates", count: counts.update },
      { value: "announcement", label: "Announcements", count: counts.announcement },
    ];
  }, [initialPosts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return initialPosts;
    return initialPosts.filter((p) => p.category === selectedCategory);
  }, [initialPosts, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          News &amp; updates
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Platform announcements, feature releases and civic guides.
        </p>
      </div>

      {/* Category Filter */}
      <div className="w-full -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none pb-1">
        <SegmentedControl
          options={filterOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
          size="sm"
          ariaLabel="Filter news by category"
          className="min-w-max"
        />
      </div>

      {/* Posts Grid or Empty States */}
      {initialPosts.length === 0 ? (
        <div className="w-full rounded-lg border border-border/70 p-8 sm:p-12 text-center space-y-3 bg-card">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Newspaper className="h-5 w-5 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            No news yet. Check back soon.
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Platform announcements, feature releases and civic guides will appear here.
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="w-full rounded-lg border border-border/70 p-8 sm:p-12 text-center space-y-4 bg-card">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Newspaper className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              No posts in this category
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              There are currently no published articles under the selected filter.
            </p>
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-medium"
            >
              Show all
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="group relative flex flex-col justify-between p-4 sm:p-6 rounded-lg border border-border/70 bg-card hover:border-border transition-all duration-150 hover:shadow-xs min-h-[180px]"
            >
              <div className="space-y-2.5 sm:space-y-3">
                {/* Meta row: Category + Pinned + Date */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {CATEGORY_NAMES[post.category] || post.category}
                    </span>
                    {post.pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        <Pin className="h-3 w-3 stroke-[1.5]" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-sans tabular-nums shrink-0">
                    <Calendar className="h-3 w-3 stroke-[1.5]" />
                    <span>
                      {new Date(post.published_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h2>

                {/* Summary */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {post.summary}
                </p>
              </div>

              {/* Read article footer */}
              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border/60 flex items-center justify-between text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                <span>Read article</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[1.5] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
