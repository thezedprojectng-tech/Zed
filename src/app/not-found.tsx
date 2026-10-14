import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Compass, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "404 – Page Not Found | Zed",
  description: "The requested civic guide or procedural milestone does not exist on this directory.",
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-dvh flex flex-col justify-between bg-[#FAFAF8] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-[#FAFAF8] px-4 sm:px-6 lg:px-8 py-12 selection:bg-[#2E82F7] selection:text-[#0a2a5e]"
    >
      {/* Top Header Row */}
      <header className="max-w-site mx-auto w-full flex items-center justify-between border-b border-[#E5E5E0] dark:border-white/10 pb-6">
        <Link href="/" className="flex items-center gap-1.5 group" aria-label="The Zed Project Home">
          <Image
            src="/icons/zed-logo-full-dark.png"
            alt="The Zed Project"
            width={120}
            height={60}
            className="h-8 w-auto object-contain dark:hidden"
          />
          <Image
            src="/icons/zed-logo-full-light.png"
            alt="The Zed Project"
            width={120}
            height={60}
            className="h-8 w-auto object-contain hidden dark:block"
          />
        </Link>
        <span className="font-mono text-xs text-[#57575e] dark:text-[#9c9ca4] font-medium uppercase tracking-wider">
          Error 404 // Unresolved Route
        </span>
      </header>

      {/* Main 404 Content */}
      <div className="max-w-2xl mx-auto w-full py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] text-[#57575e] dark:text-[#9c9ca4] font-mono text-xs uppercase tracking-wider font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Page not found</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
          This milestone doesn&apos;t exist.
        </h1>

        <p className="font-sans text-base text-[#57575e] dark:text-[#9c9ca4] max-w-lg mx-auto leading-relaxed">
          The page, guide chapter, or link you followed cannot be found. It may have been moved or updated.
        </p>

        {/* Action Cluster */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2E82F7] hover:bg-[#2567d4] text-[#0a2a5e] font-medium text-sm rounded-lg shadow-sm transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Return to overview</span>
          </Link>

          <Link
            href="/#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] hover:bg-[#f4f4f0] dark:hover:bg-white/[0.04] text-[#0B0B0C] dark:text-[#FAFAF8] text-sm font-medium transition-all"
          >
            <Compass className="h-4 w-4 text-[#2E82F7]" />
            <span>Browse Zed Nav</span>
          </Link>
        </div>
      </div>

      {/* Footer Meta Row */}
      <footer className="max-w-site mx-auto w-full border-t border-[#E5E5E0] dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#57575e] dark:text-[#9c9ca4] gap-2">
        <span>Zed</span>
        <span>Independent Civic Platform &bull; Lagos, Nigeria</span>
      </footer>
    </main>
  );
}
