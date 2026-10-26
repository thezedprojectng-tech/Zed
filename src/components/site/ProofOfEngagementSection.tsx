"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, ArrowRight } from "lucide-react";
import { FadeIn } from "./FadeIn";

const LEVEL_MATRIX = [
  {
    level: 1,
    name: "Rookie",
    criteria: "Account creation + Phone / NIN verification",
    multiplier: "×1.0",
    cap: "100 $ZED/day",
  },
  {
    level: 2,
    name: "Explorer",
    criteria: "Complete 1 Skill Course OR refer 3 verified friends",
    multiplier: "×2.0",
    cap: "200 $ZED/day",
  },
  {
    level: 3,
    name: "Builder",
    criteria: "Complete 3 Courses + post 2 active community threads",
    multiplier: "×3.5",
    cap: "350 $ZED/day",
  },
  {
    level: 4,
    name: "Pro / Hustler",
    criteria: "Complete 1 Freelance Gig OR subscribe to Zed Pass",
    multiplier: "×5.0",
    cap: "500 $ZED/day",
  },
  {
    level: 5,
    name: "Zed Legend",
    criteria: "Top 1% monthly active user OR vetted community mentor",
    multiplier: "×10.0",
    cap: "1,000 $ZED/day",
  },
];

export function ProofOfEngagementSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="token-engine" className="scroll-mt-24 py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Simple Centered Header */}
        <FadeIn className="text-center max-w-3xl mx-auto space-y-3.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs"
          >
            <Coins className="h-3.5 w-3.5 text-[#2E82F7]" />
            <span>Phase 2 Architecture</span>
          </motion.div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
            Earn as you grow. Proof-of-Engagement.
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Planned for Phase 2: The $ZED Token will reward active participation, course completions, alumni mentorship, and community updates. Mining rates scale dynamically with your level.
          </p>
        </FadeIn>

        {/* Clean, Simple Table Card with Smooth Transitions */}
        <FadeIn delay={0.1}>
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141416] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/8 bg-slate-50/70 dark:bg-[#17171a] text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-4 px-6 font-semibold">Tier</th>
                    <th className="py-4 px-6 font-semibold">Level Name</th>
                    <th className="py-4 px-6 font-semibold">Unlock Criteria (Proof-of-Engagement)</th>
                    <th className="py-4 px-6 font-semibold">Multiplier</th>
                    <th className="py-4 px-6 font-semibold">Daily Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/6 text-sm">
                  {LEVEL_MATRIX.map((tier, idx) => (
                    <motion.tr
                      key={tier.level}
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors duration-200 group"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-zinc-500">
                        Lvl {tier.level}
                      </td>
                      <td className="py-4 px-6 font-display font-bold text-[#0B0B0C] dark:text-[#FAFAF8] flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-[#2E82F7] group-hover:scale-125 transition-transform duration-200" />
                        <span className="group-hover:text-[#2E82F7] transition-colors duration-200">
                          {tier.name}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#57575e] dark:text-zinc-400 text-xs sm:text-sm">
                        {tier.criteria}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-[#2E82F7]">
                        {tier.multiplier}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-[#0B0B0C] dark:text-[#FAFAF8] font-semibold">
                        {tier.cap}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simple Bottom Notice Bar with Hover Transition */}
            <div className="p-5 sm:px-6 border-t border-slate-200/80 dark:border-white/8 bg-slate-50/40 dark:bg-[#17171a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#57575e] dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[#2E82F7] shrink-0" />
                <span>
                  <strong>Dynamic Treasury Pool (Planned):</strong> In Phase 2, $ZED is planned to convert to Naira withdrawals or discounted mobile data bundles (MTN, Airtel, Glo, 9mobile).
                </span>
              </div>
              <Link
                href="/signup"
                className="font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] flex items-center gap-1.5 shrink-0 group transition-colors"
              >
                <span>Explore Level Matrix</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#2E82F7] group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
