"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

const PRIVACY_CARDS = [
  {
    title: "Salted SHA-256 Digest",
    desc: "One-way irreversible identity token",
  },
  {
    title: "Zero Plaintext Cloud Storage",
    desc: "Raw NIN never written to physical disk",
  },
  {
    title: "Data Protection First",
    desc: "Designed with data protection in mind; NIN is hashed, never stored raw",
  },
];

export function SovereignPrivacySection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section aria-label="Identity Protection" className="scroll-mt-24 py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141416] p-8 sm:p-12 lg:p-14 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Left Column: Context & Policy Link */}
              <div className="lg:col-span-8 space-y-5">
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a1a1e] text-[#2E82F7] text-xs font-semibold"
                >
                  <Lock className="h-3.5 w-3.5 text-[#2E82F7]" />
                  <span>Sovereign Identity Protection</span>
                </motion.div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Your NIN stays yours.
                </h2>

                <div className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 space-y-3.5 leading-relaxed">
                  <p>
                    Your National Identity Number is the master key to your civil, banking, and travel records. Storing raw identity numbers in cloud databases creates an unacceptable attack surface for identity theft.
                  </p>
                  <p>
                    Zed transmits your NIN over an encrypted HTTPS connection and hashes it with a secret salt on our server. Under no circumstances is your raw 11-digit NIN written, logged, or persisted in our databases. Verification operates in demo mode, and only the cryptographic hash is retained.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/privacy"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors group"
                  >
                    <span>Read our full NDPA Data Privacy Policy</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#2E82F7] duration-200" />
                  </Link>
                </div>
              </div>

              {/* Right Column: 3 Clean Cards with Staggered Entrance and Hover Micro-motions */}
              <div className="lg:col-span-4 space-y-3.5">
                {PRIVACY_CARDS.map((card, idx) => (
                  <motion.div
                    key={card.title}
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    whileHover={shouldReduceMotion ? {} : { x: -3 }}
                    className="p-4 rounded-xl border border-slate-200/70 dark:border-white/8 bg-[#F4F6FB] dark:bg-[#17171a] space-y-1 hover:border-[#2E82F7]/30 transition-colors duration-200 cursor-default"
                  >
                    <div className="font-mono text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      {card.title}
                    </div>
                    <div className="text-xs text-[#57575e] dark:text-zinc-400">
                      {card.desc}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
