"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { useSiteAuth } from "./useSiteAuth";

export function HeroSection() {
  const { isAuthenticated } = useSiteAuth();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section aria-label="Zed Hero" className="pt-14 pb-0 sm:pt-20 overflow-hidden">
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Copy Block */}
        <div className="max-w-3xl mx-auto text-center space-y-7">
          {/* Eyebrow Tag */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D8D8D2] bg-[#F5F5F0] text-[#57575e] font-mono text-xs uppercase tracking-widest font-medium"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e]" />
            <span>Civic guides for Nigerians</span>
          </motion.div>

          {/* Main Headline */}
          <h1 className="font-display text-[42px] sm:text-[64px] md:text-[72px] lg:text-[80px] font-bold tracking-tight text-[#0B0B0C] leading-[1.04]">
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              Nigerian paperwork,
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              made simple.
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans text-lg sm:text-xl text-[#57575e] max-w-xl mx-auto leading-relaxed"
          >
            Step-by-step guides for your passport, NYSC, NIN and BVN, and
            business registration. Track progress. Work offline.
          </motion.p>

          {/* CTA Cluster */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1"
          >
            {isAuthenticated ? (
              <Link
                href="/home"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]"
              >
                <span>Open Zed</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]"
                >
                  <span>Get started free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-lg border border-[#D8D8D2] bg-white hover:bg-[#F5F5F0] text-[#0B0B0C] text-sm font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]"
                >
                  See how it works
                </a>
              </>
            )}
          </motion.div>
        </div>

        {/* Hero Dashboard Preview — floats below the copy */}
        <motion.figure
          aria-label="Zed dashboard application preview"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 sm:mt-16 max-w-5xl mx-auto"
        >
          {/* Browser Chrome Frame */}
          <div className="rounded-t-2xl border border-b-0 border-[#D8D8D2] bg-[#F5F5F0] px-4 py-3 flex items-center gap-3">
            {/* Window dots */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
              <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
              <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
            </div>

            {/* URL Bar */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-1.5 bg-white border border-[#D8D8D2] rounded-md px-3 py-1 text-xs text-[#57575e] font-mono max-w-xs w-full justify-center">
                <Lock className="h-3 w-3 text-[#3ecf8e] flex-shrink-0" />
                <span>app.zedproject.ng</span>
              </div>
            </div>

            <div className="flex-shrink-0 w-[54px]" />
          </div>

          {/* Screenshot */}
          <div className="border border-[#D8D8D2] rounded-b-2xl overflow-hidden shadow-2xl shadow-black/10">
            <Image
              src="/dashboard.png"
              alt="Zed civic dashboard showing civil guides, NIN verification prompt, and passport tracking"
              width={1902}
              height={873}
              priority
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
              className="w-full h-auto object-cover select-none block"
            />
          </div>
        </motion.figure>
      </div>
    </section>
  );
}
