import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Pin } from "lucide-react";
import { getPublicNewsPostBySlug } from "@/lib/news/public-queries";
import { LessonMarkdown } from "@/components/skill/LessonMarkdown";
import { CATEGORY_LABELS } from "@/lib/news/validation";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicNewsPostBySlug(slug);

  if (!post || post.status !== "published") {
    return {
      title: "Article Not Found — Zed News",
    };
  }

  return {
    title: `${post.title} — Zed News`,
    description: post.summary,
    openGraph: {
      title: `${post.title} — Zed News`,
      description: post.summary,
      url: `https://zedproject.ng/news/${post.slug}`,
      type: "article",
      publishedTime: post.published_at || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublicNewsPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57575e] dark:text-zinc-400 hover:text-[#0B0B0C] dark:hover:text-white transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to all news</span>
        </Link>
      </div>

      {/* Header section */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="inline-flex items-center rounded-md border border-[#EAEAE6] dark:border-white/10 bg-[#FAFAF8] dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[#57575e] dark:text-zinc-300">
            {categoryLabel}
          </span>
          {post.pinned && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E82F7]">
              <Pin className="h-3 w-3" />
              <span>Pinned article</span>
            </span>
          )}
          <span className="text-[#A0A09C] dark:text-zinc-600">·</span>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#707078] dark:text-zinc-400 tabular-nums">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={post.published_at || post.created_at}>
              {new Date(post.published_at || post.created_at).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#0B0B0C] dark:text-white leading-tight font-display">
          {post.title}
        </h1>

        <p className="text-sm sm:text-base text-[#57575e] dark:text-zinc-300 leading-relaxed font-medium">
          {post.summary}
        </p>
      </header>

      <div className="h-px bg-[#EAEAE6] dark:bg-white/10" />

      {/* Article Content rendered with existing LessonMarkdown component */}
      <div className="pt-2">
        <LessonMarkdown content={post.body_md} />
      </div>

      {/* Article footer */}
      <footer className="pt-8 border-t border-[#EAEAE6] dark:border-white/10 flex items-center justify-between text-xs text-[#707078] dark:text-zinc-400">
        <div>
          <span>Published by </span>
          <strong className="text-[#0B0B0C] dark:text-white font-semibold">The Zed Team</strong>
        </div>
        <Link
          href="/news"
          className="text-[#2E82F7] hover:underline font-medium inline-flex items-center gap-1"
        >
          <span>More updates</span>
          <ArrowLeft className="h-3 w-3 rotate-180" />
        </Link>
      </footer>
    </article>
  );
}
