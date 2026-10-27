import type { Metadata } from "next";
import {
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Wifi,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/site/FadeIn";

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

const CHAPTERS = [
  {
    num: "01",
    icon: Wifi,
    title: "Offline-First PWA Architecture",
    description:
      "Aggressive Service Worker caching and local IndexedDB state persistence designed for zero-connectivity basement government offices.",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Cryptographic Identity Privacy",
    description:
      "Salted SHA-256 digest architecture. Zero raw 11-digit NIN cloud disk writes, client-side TLS 1.3 encryption, and strict NDPA compliance.",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Proof-of-Engagement Tokenomics",
    description:
      "Mathematical models governing off-chain $ZED token issuance, dynamic multiplier tiers (×1.0 to ×10.0), and planned Naira/Data treasury pools.",
  },
  {
    num: "04",
    icon: Cpu,
    title: "Civil State Machine Engine",
    description:
      "Deterministic JSON sequential workflows mapping complex regulatory procedures (NIS Passport, NYSC, NIMC, CAC) without middleman markups.",
  },
];

export default function WhitePaperPage() {
  const pdfUrl = "/whitepaper/Zed-White-Paper.pdf";

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start pb-20 overflow-hidden">
      {/* ── Top Hero Section with Glow & Centered Flow ──────────────────── */}
      <section className="relative w-full pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Hero Title & Subtitle */}
        <FadeIn className="space-y-6 max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Zed: The Youth<br />
            <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Operating System.
            </span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Technical architecture, economic incentives, and privacy design powering Nigeria&apos;s digital civic platform for young builders and students.
          </p>

          {/* Publication Metadata Strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 font-mono text-xs text-muted-foreground">
            <span>Version: <strong className="text-foreground">v1.0 (Public Release)</strong></span>
            <span>•</span>
            <span>Date: <strong className="text-foreground">October 2026</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-foreground">Active Specification</strong></span>
          </div>
        </FadeIn>

        {/* Hero Preview Card Showcase Graphic */}
        <FadeIn delay={0.1} className="w-full max-w-6xl pt-4">
          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-muted/40 p-6 sm:p-10 shadow-2xl overflow-hidden backdrop-blur-sm text-left">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                  Document Overview
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  The Blueprint for Youth Digital Infrastructure
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                  Built to withstand intermittent network conditions while safeguarding personal data under strict Nigerian Data Protection Act (NDPA) guidelines.
                </p>
              </div>

              <div className="shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">
                <Button asChild className="rounded-xl shadow-sm flex-1 sm:flex-none">
                  <a href={pdfUrl} download="Zed-White-Paper.pdf">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Core Technical Pillars Bento Grid ─────────────────────────────── */}
      <section aria-label="Key Architecture Chapters" className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 mb-16 space-y-6">
        <FadeIn className="flex items-center justify-between pb-2 border-b border-border/60">
          <h2 className="font-display font-bold text-lg sm:text-xl text-foreground">
            Key Technical Chapters
          </h2>
          <span className="font-mono text-xs text-muted-foreground">4 Architecture Sections</span>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {CHAPTERS.map((chapter, idx) => {
            const Icon = chapter.icon;
            return (
              <FadeIn key={chapter.num} delay={idx * 0.05} className="h-full">
                <div className="h-full rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">
                      CHAPTER {chapter.num}
                    </span>
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                    {chapter.title}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {chapter.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── Document Download & Action Presentation Card ─────────────────── */}
      <section className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 mb-12">
        <FadeIn delay={0.2}>
          <div className="rounded-3xl border border-border/90 bg-card p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"
            />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold">
                  PDF Document (130 KB)
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
                  Download the Full Specification
                </h2>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Read the complete 42-page technical document including cryptographic diagrams, token distribution models, and regulatory compliance disclosures.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl px-6 font-semibold shadow-sm transition-transform active:scale-95"
                >
                  <a href={pdfUrl} download="Zed-White-Paper.pdf">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-2xl px-6 border-border bg-background font-semibold transition-transform active:scale-95"
                >
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Tab
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Metadata Footer ───────────────────────────────────────────────── */}
      <footer className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground border-t border-border/60 pt-8">
        <p>Zed Project Foundation &bull; Published October 2026 &bull; Licensed under Creative Commons BY-ND 4.0</p>
      </footer>
    </div>
  );
}