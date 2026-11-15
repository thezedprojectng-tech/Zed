"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pin, ArrowRight, Newspaper, Calendar } from "lucide-react";
import type { PublicNewsPostListItem } from "@/lib/news/public-queries";

interface Props {
  initialPosts: PublicNewsPostListItem[];
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "news", label: "News" },
  { id: "update", label: "Updates" },
  { id: "announcement", label: "Announcements" },
] as const;

const CATEGORY_NAMES: Record<string, string> = {
  news: "News",
  update: "Update",
  announcement: "Announcement",
};

export function NewsListClient({ initialPosts }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return initialPosts;
    return initialPosts.filter((p) => p.category === selectedCategory);
  }, [initialPosts, selectedCategory]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#EAEAE6] dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1 text-xs font-medium text-[#57575e] dark:text-zinc-400">
          <Newspaper className="h-3.5 w-3.5 text-[#2E82F7]" />
          <span>The Zed Chronicle</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#0B0B0C] dark:text-white font-display">
          News &amp; Updates
        </h1>
        <p className="text-sm sm:text-base text-[#57575e] dark:text-zinc-400 max-w-2xl leading-relaxed">
          The latest platform announcements, feature releases, civil procedure guides, and community dispatches.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-150 shrink-0 border ${
                isActive
                  ? "bg-[#0B0B0C] dark:bg-white text-white dark:text-[#0B0B0C] border-transparent shadow-xs"
                  : "bg-white dark:bg-[#121214] text-[#57575e] dark:text-zinc-400 border-[#EAEAE6] dark:border-white/10 hover:text-[#0B0B0C] dark:hover:text-white hover:border-[#D0D0CB] dark:hover:border-white/20"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EAEAE6] dark:border-white/10 p-12 text-center space-y-3 bg-white/40 dark:bg-white/[0.02]">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-[#707078]">
            <Newspaper className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-[#0B0B0C] dark:text-white">
            No articles found
          </h2>
          <p className="text-xs text-[#707078] dark:text-zinc-400 max-w-sm mx-auto">
            There are currently no published posts in this category. Check back soon for updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#121214] hover:border-[#2E82F7]/50 dark:hover:border-[#2E82F7]/50 transition-all duration-200 hover:shadow-md"
            >
              <div className="space-y-3.5">
                {/* Meta row: Category + Pinned + Date */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md border border-[#EAEAE6] dark:border-white/10 bg-[#FAFAF8] dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[#57575e] dark:text-zinc-300">
                      {CATEGORY_NAMES[post.category] || post.category}
                    </span>
                    {post.pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E82F7]">
                        <Pin className="h-3 w-3" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#707078] dark:text-zinc-400 tabular-nums">
                    <Calendar className="h-3 w-3" />
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
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#0B0B0C] dark:text-white group-hover:text-[#2E82F7] transition-colors leading-snug">
                  {post.title}
                </h2>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed line-clamp-3">
                  {post.summary}
                </p>
              </div>

              {/* Read article footer */}
              <div className="pt-6 mt-4 border-t border-[#EAEAE6] dark:border-white/10 flex items-center justify-between text-xs font-semibold text-[#0B0B0C] dark:text-white group-hover:text-[#2E82F7] transition-colors">
                <span>Read article</span>
                <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
