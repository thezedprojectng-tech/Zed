"use client";

import React from "react";
import { FadeIn } from "@/components/site/FadeIn";
import { ClosingCTA } from "@/components/site/ClosingCTA";

interface TOCItem {
  id: string;
  title: string;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  toc?: TOCItem[];
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start overflow-hidden bg-[#FCFCFA] dark:bg-[#0B0B0C]">
      {/* ── Document Header (Centered, matching screenshot) ── */}
      <section className="w-full pt-14 sm:pt-20 pb-8 sm:pb-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.12]">
            {title}
          </h1>
          <p className="font-sans text-xs sm:text-sm font-medium text-[#57575e] dark:text-zinc-400">
            Last updated: {lastUpdated}
          </p>
        </FadeIn>
      </section>

      {/* ── Document Content Container (Centered single-column reading measure) ── */}
      <article className="w-full pb-20 sm:pb-28 max-w-3xl sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn delay={0.05} className="space-y-10 sm:space-y-12">
          {children}
        </FadeIn>
      </article>

      {/* ── Bottom Closing CTA Banner (Matching reference image) ── */}
      <div className="w-full">
        <ClosingCTA />
      </div>
    </div>
  );
}
