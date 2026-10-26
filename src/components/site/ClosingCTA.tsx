"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSiteAuth } from "./useSiteAuth";
import { FadeIn } from "./FadeIn";

export function ClosingCTA() {
  const { isAuthenticated } = useSiteAuth();

  return (
    <section aria-label="Call to Action" className="w-full py-12 sm:py-16">
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          {/* ── Floating Blue-Stripe CTA Card (Inspired by reference design) ── */}
          <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden bg-gradient-to-b from-[#2575FC] via-[#1E6BEE] to-[#1253C9] px-6 py-16 sm:px-12 sm:py-20 text-center text-white shadow-2xl shadow-blue-500/25">
            {/* Pure CSS Vertical-Stripe Glow Pattern */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none overflow-hidden select-none"
            >
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.15) 0px,
                    rgba(255, 255, 255, 0.15) 28px,
                    transparent 28px,
                    transparent 56px
                  )`,
                  maskImage: `radial-gradient(
                    ellipse 90% 75% at 50% 90%,
                    black 35%,
                    rgba(0, 0, 0, 0.4) 65%,
                    transparent 95%
                  )`,
                  WebkitMaskImage: `radial-gradient(
                    ellipse 90% 75% at 50% 90%,
                    black 35%,
                    rgba(0, 0, 0, 0.4) 65%,
                    transparent 95%
                  )`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(
                    ellipse 75% 55% at 50% 30%,
                    rgba(255, 255, 255, 0.15) 0%,
                    transparent 70%
                  )`,
                }}
              />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                Get started today and take control of your civic journey.
              </h2>

              <p className="font-sans text-sm sm:text-base md:text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
                The all-in-one digital operating system for Nigerian youth. Master
                civil paperwork, acquire practical skills, and claim daily $ZED rewards.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {isAuthenticated ? (
                  <Link
                    href="/home"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-zinc-100 text-[#0B0B0C] text-sm sm:text-base font-semibold rounded-full shadow-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span>Open your dashboard</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-zinc-100 text-[#0B0B0C] text-sm sm:text-base font-semibold rounded-full shadow-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span>Get started free</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
