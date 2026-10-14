"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSiteAuth } from "./useSiteAuth";
import { FadeIn } from "./FadeIn";

export function ClosingCTA() {
  const { isAuthenticated } = useSiteAuth();

  return (
    <section className="w-full bg-[#0B0B0C] text-white py-20 sm:py-28 border-t border-white/10 relative overflow-hidden">
      {/* Subtle green stripe accent at top */}
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-32 bg-[#2E82F7] opacity-70" />

      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn className="max-w-3xl mx-auto space-y-7">
          <div className="font-mono text-xs uppercase tracking-widest text-[#2E82F7] font-medium">
            Ready to begin?
          </div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Start your next process<br className="hidden sm:block" /> with a clear path.
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#9c9ca4] max-w-xl mx-auto leading-relaxed">
            Free, deterministic guides, verified statutory fees, and client-side document checks.
            Built for every Nigerian citizen.
          </p>

          <div className="pt-2 flex flex-col items-center justify-center gap-3.5">
            {isAuthenticated ? (
              <Link
                href="/home"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2E82F7] hover:bg-[#2567d4] text-[#0a2a5e] text-sm font-semibold rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
              >
                <span>Open Zed</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2E82F7] hover:bg-[#2567d4] text-[#0a2a5e] text-sm font-semibold rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
                >
                  <span>Get started free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="font-sans text-xs text-[#6c6c74] pt-1">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-white underline underline-offset-4 hover:text-[#2E82F7] transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
