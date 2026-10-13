import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 – Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      role="main"
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-background text-foreground px-4 py-16 text-center"
    >
      {/* ── Background Atmosphere ────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft radial emerald ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] sm:w-[720px] h-[360px] sm:h-[520px] rounded-full blur-[110px] opacity-25 dark:opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--primary) 0%, rgba(62, 207, 142, 0.15) 45%, transparent 70%)",
          }}
        />

        {/* Subtle circular radar/navigation rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full border border-border/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] sm:w-[780px] h-[540px] sm:h-[780px] rounded-full border border-border/15" />

        {/* Faded dot grid with radial fade mask */}
        <div className="absolute inset-0 bg-dot-grid opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_30%,transparent_80%)]" />

        {/* Giant architectural 404 watermark */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[14rem] sm:text-[22rem] font-black tracking-tighter text-foreground/[0.03] select-none leading-none"
        >
          404
        </span>
      </div>

      {/* ── Foreground Content ───────────────────────────────────────────── */}
      <div className="relative z-10 max-w-md w-full mx-auto p-6 sm:p-10 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-2xl space-y-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest font-semibold">
          Error 404
        </div>

        <div className="space-y-2">
          <h1 className="type-display text-foreground font-extrabold tracking-tight">
            Page not found
          </h1>
          <p className="type-body text-muted-foreground text-sm sm:text-base leading-relaxed">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, removed, or never existed.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="default" className="w-full sm:w-auto gap-2">
            <Link href="/home">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <Button asChild variant="outline" size="default" className="w-full sm:w-auto gap-2 border-hairline">
            <Link href="/nav">
              <ArrowLeft className="h-4 w-4" />
              Civil Guides
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
