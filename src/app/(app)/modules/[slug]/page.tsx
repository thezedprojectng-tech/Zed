import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MODULES } from "@/data/modules";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return MODULES.filter((m) => m.status === "soon").map((m) => ({
    slug: m.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mod = MODULES.find((m) => m.slug === slug);
  if (!mod) return {};
  return {
    title: `${mod.name} – Coming Soon · Zed`,
    description: mod.tagline,
  };
}

export default async function ModulePlaceholderPage({ params }: Props) {
  const { slug } = await params;
  const mod = MODULES.find((m) => m.slug === slug);

  if (!mod) notFound();

  const Icon = mod.icon;

  return (
    <div className="mx-auto max-w-8xl px-4 py-10 md:px-8 space-y-8">
      {/* Back link */}
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        Back to Dashboard
      </Link>

      {/* Module header */}
      <section aria-labelledby="module-name" className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-hairline bg-secondary text-muted-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                id="module-name"
                className="type-display text-foreground leading-none"
              >
                {mod.name}
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-border text-muted-foreground px-2 py-0.5"
              >
                Coming soon
              </Badge>
            </div>

            <p className="type-body text-muted-foreground">
              {mod.tagline}
            </p>

            <span className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-wider">
              {mod.phase}
            </span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-hairline-b" role="separator" />

      {/* What it will do */}
      <section aria-labelledby="module-what" className="space-y-3">
        <h2
          id="module-what"
          className="type-caption text-muted-foreground font-semibold uppercase tracking-wider"
        >
          What it will do
        </h2>
        <p className="type-body text-foreground/80 leading-relaxed max-w-prose">
          {mod.what}
        </p>
      </section>

      {/* Status notice */}
      <aside
        aria-label="Development status"
        className="rounded-xl border-hairline bg-card/50 p-5 flex flex-col gap-2"
      >
        <p className="type-caption text-muted-foreground font-semibold uppercase">
          Development Status
        </p>
        <p className="type-small text-muted-foreground leading-relaxed">
          This module is in planning and has not been built yet. No functionality
          is available at this time. Check back as the Zed platform grows.
        </p>
      </aside>
    </div>
  );
}
