"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSiteAuth } from "./useSiteAuth";
import { HeroMockup } from "./HeroMockup";

export function HeroSection() {
  const { isAuthenticated } = useSiteAuth();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Zed Hero"
      className="relative pt-10 sm:pt-16 pb-0 overflow-hidden"
    >
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Centered Hero Copy Block ────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-7 relative z-10">
          {/* Eyebrow / Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white/80 dark:bg-[#141416]/80 text-[#57575e] dark:text-zinc-300 font-sans text-[10px] sm:text-xs font-medium shadow-xs hover:border-[#2E82F7]/50 hover:text-[#0B0B0C] dark:hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span> The Digital OS for Nigerian Youth</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#2E82F7]" />
            </a>
          </motion.div>

          {/* Main Headline (single h1) */}
          <h1 className="font-display text-[44px] sm:text-[68px] md:text-[76px] lg:text-[84px] font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.05]">
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              One Place.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              Every Next Move.
            </motion.span>
          </h1>

          {/* Supporting Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans text-base sm:text-lg text-[#57575e] dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            The all-in-one platform for Nigerian youth. Master civil administrative
            processes with step-by-step guides, acquire in-demand digital skills,
            trade safely, and claim daily $ZED rewards.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            {isAuthenticated ? (
              <Link
                href="/home"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#2E82F7] hover:bg-[#256fd8] text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
              >
                <span>Open Zed</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#2E82F7] hover:bg-[#256fd8] text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
                >
                  <span>Get started free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-7 py-3.5 rounded-full border border-[#D8D8D2] dark:border-white/15 bg-white dark:bg-[#141416] hover:bg-[#F5F5F0] dark:hover:bg-[#1a1a1e] text-[#0B0B0C] dark:text-[#FAFAF8] text-sm font-semibold shadow-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
                >
                  <span>See what Zed does</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </>
            )}
          </motion.div>
        </div>

        {/* ── Product Mockup Section with Vertical-Stripe Glow ────────────── */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-12 sm:mt-16 pt-8 pb-4 "
        >
          {/* ── Pure CSS Blue Vertical-Stripe Glow Background ──────────────── */}
          <div
            aria-hidden="true"
            className="absolute inset-x-[-10%] sm:inset-x-[-5%] -bottom-6 top-0 pointer-events-none overflow-hidden select-none"
          >
            {/* Repeating vertical stripes radiating upward */}
            <div
              className="absolute inset-0 opacity-80 dark:opacity-50"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  rgba(46, 130, 247, 0.45) 0px,
                  rgba(46, 130, 247, 0.45) 24px,
                  rgba(26, 94, 224, 0.85) 24px,
                  rgba(26, 94, 224, 0.85) 48px
                )`,
                maskImage: `radial-gradient(
                  ellipse 85% 70% at 50% 90%,
                  black 35%,
                  rgba(0, 0, 0, 0.5) 65%,
                  transparent 92%
                )`,
                WebkitMaskImage: `radial-gradient(
                  ellipse 85% 70% at 50% 90%,
                  black 35%,
                  rgba(0, 0, 0, 0.5) 65%,
                  transparent 92%
                )`,
              }}
            />

            {/* Radiant core glow */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(
                  ellipse 75% 55% at 50% 88%,
                  rgba(46, 130, 247, 0.32) 0%,
                  rgba(46, 130, 247, 0.12) 48%,
                  transparent 80%
                )`,
              }}
            />
          </div>

          {/* Real UI HTML/CSS Mockup Component */}
          <div className=" relative z-10 px-2 sm:px-4">
            <HeroMockup />
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}
