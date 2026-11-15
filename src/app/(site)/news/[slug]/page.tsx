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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <article className="w-full max-w-[70ch] mx-auto space-y-6">
        {/* Back link */}
        <div>
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Back to all news</span>
          </Link>
        </div>

        {/* Header section */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-foreground">
              {categoryLabel}
            </span>
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                <Pin className="h-3 w-3 stroke-[1.5]" />
                <span>Pinned article</span>
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-sans tabular-nums">
              <Calendar className="h-3.5 w-3.5 stroke-[1.5]" />
              <time dateTime={post.published_at || post.created_at}>
                {new Date(post.published_at || post.created_at).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {post.summary}
          </p>
        </header>

        <div className="h-px bg-border/70" />

        {/* Article Content rendered with existing LessonMarkdown component */}
        <div className="pt-2">
          <LessonMarkdown content={post.body_md} />
        </div>

        {/* Article footer */}
        <footer className="pt-6 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            <span>Published by </span>
            <strong className="text-foreground font-medium">The Zed Team</strong>
          </div>
          <Link
            href="/news"
            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>More updates</span>
            <ArrowLeft className="h-3 w-3 rotate-180 stroke-[1.5]" />
          </Link>
        </footer>
      </article>
    </div>
  );
}
