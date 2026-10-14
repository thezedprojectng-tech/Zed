"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface TOCItem {
  id: string;
  title: string;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  toc: TOCItem[];
  children: React.ReactNode;
}

/**
 * LEGAL NOTICE:
 * Draft – to be reviewed by a qualified Nigerian lawyer before launch.
 */
export function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  toc,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="py-12 sm:py-16 lg:py-20 max-w-site mx-auto px-4 sm:px-6 lg:px-8 bg-[#FAFAF8] text-[#0B0B0C]">
      {/* Back to Home Link */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#57575e] hover:text-[#0B0B0C] transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to home</span>
        </Link>
      </div>

      {/* Mandatory Statutory Review Alert */}
      <div
        role="note"
        aria-label="Statutory notice"
        className="mb-10 p-3.5 rounded-lg border border-[#E5E5E0] bg-white text-[#57575e] flex items-center gap-3 text-xs font-mono"
      >
        <span className="h-2 w-2 rounded-full bg-[#2E82F7] flex-shrink-0" />
        <span>
          <strong>Notice:</strong> Draft – to be reviewed by a qualified Nigerian lawyer before launch. Outlines governance under NDPA 2023.
        </span>
      </div>

      {/* Header Block */}
      <header className="border-b border-[#E5E5E0] pb-8 mb-12">
        <div className="font-mono text-xs uppercase tracking-wider text-[#2E82F7] font-semibold mb-2">
          Regulatory &amp; Legal Framework
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C] mb-4">
          {title}
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#57575e] max-w-2xl leading-relaxed mb-4">
          {subtitle}
        </p>
        <div className="font-mono text-xs text-[#8a8a92] flex flex-wrap items-center gap-3">
          <span>Effective: {lastUpdated}</span>
          <span>&bull;</span>
          <span>Jurisdiction: Federal Republic of Nigeria</span>
        </div>
      </header>

      {/* Main Two-Column Layout: Sticky TOC + Narrow Measure Article */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Sticky Sidebar: Table of Contents */}
        <aside className="lg:col-span-4 order-2 lg:order-1">
          <div className="sticky top-28 p-5 rounded-xl border border-[#E5E5E0] bg-white space-y-4 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0B0B0C] pb-3 border-b border-[#E5E5E0]">
              Contents
            </h2>
            <nav aria-label="Table of contents">
              <ol className="space-y-2 font-sans text-xs sm:text-sm">
                {toc.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-[#57575e] hover:text-[#0B0B0C] transition-colors block py-0.5 leading-snug"
                    >
                      <span className="font-mono text-xs text-[#8a8a92] mr-2">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </aside>

        {/* Legal Text Sections with Narrow Reading Measure */}
        <article className="lg:col-span-8 order-1 lg:order-2 space-y-10 text-[#0B0B0C] max-w-[720px]">
          {children}
        </article>
      </div>
    </div>
  );
}
