import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink, FileText, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "White Paper — Zed: The Youth Operating System",
  description:
    "Read the official Zed White Paper v1.0 (October 2026). Discover the architecture, mission, and mechanisms powering Nigeria's youth operating system.",
  openGraph: {
    title: "Zed White Paper v1.0 — The Youth Operating System",
    description:
      "Official architecture and economic overview of Zed: verified documentation, identity, and economic opportunity for Nigerian youth.",
    url: "https://zedproject.ng/whitepaper",
    type: "article",
  },
};

export default function WhitePaperPage() {
  const pdfUrl = "/whitepaper/Zed-White-Paper.pdf";

  return (
    <article className="w-full flex-1 py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col justify-center">
      {/* ── Breadcrumb / Back Link ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </nav>

      {/* ── Header Badge & Title ─────────────────────────────────────────── */}
      <header className="space-y-4 border-b border-border/60 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide">
          <FileText className="w-3.5 h-3.5" />
          Official Documentation
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Zed White Paper
        </h1>

        {/* ── 3-line summary as requested ─────────────────────────────────── */}
        <div className="space-y-1 text-base sm:text-lg text-muted-foreground font-medium pt-2">
          <p className="text-foreground font-semibold">Zed: The Youth Operating System</p>
          <p>White Paper v1.0</p>
          <p>October 2026</p>
        </div>
      </header>

      {/* ── Main Document Presentation Card ─────────────────────────────── */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Overview & Architecture</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The Zed White Paper outlines the technical architecture, security principles,
            and ecosystem design behind the Zed platform. It details our approach to
            decentralized mobile-first documentation tools, verification infrastructure,
            and economic participation for youth navigating Nigerian institutional processes.
          </p>
        </div>

        {/* Highlights feature list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-1">
            <div className="flex items-center gap-2 text-foreground font-medium text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Privacy-First Architecture
            </div>
            <p className="text-xs text-muted-foreground">
              Zero raw credentials stored. Zero trackers. Deterministic, client-side document parsing.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-1">
            <div className="flex items-center gap-2 text-foreground font-medium text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              Ecosystem Tokenomics
            </div>
            <p className="text-xs text-muted-foreground">
              Transparent $ZED utility, mining mechanics, verifiable user activities, and liquidation paths.
            </p>
          </div>
        </div>

        {/* ── Call to action buttons ───────────────────────────────────────── */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Button asChild size="lg" className="gap-2 font-medium">
            <a href={pdfUrl} download="Zed-White-Paper.pdf">
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </Button>

          <Button asChild variant="outline" size="lg" className="gap-2 font-medium">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Open in new tab
            </a>
          </Button>
        </div>
      </section>

      {/* ── Metadata Footer Note ─────────────────────────────────────────── */}
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        Zed Project Foundation &bull; Published October 2026 &bull; PDF document format (130 KB)
      </footer>
    </article>
  );
}
