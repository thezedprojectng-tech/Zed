"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, ShieldCheck, ArrowRight, Sparkles, FileText, Smartphone, Lock } from "lucide-react";
import { FadeIn } from "./FadeIn";

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="scroll-mt-24 py-12 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <FadeIn className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7] animate-pulse" />
            <span>How it works</span>
          </motion.div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.08]">
            A smarter way to<br className="hidden sm:block" />
            manage your journey
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Everything flows through one connected operating system. Zed captures requirements, organizes your documents offline, automates follow-ups, and guides your team.
          </p>
        </FadeIn>

        {/* 3 Step Cards with Curved Animated Connecting Line (Matching Image 3 Bottom) */}
        <div className="relative">
          {/* Subtle curved connecting line behind the cards on desktop */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-14 inset-x-20 h-16 pointer-events-none z-0"
          >
            <svg viewBox="0 0 800 60" className="w-full h-full" fill="none" preserveAspectRatio="none">
              <motion.path
                initial={shouldReduceMotion ? {} : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d="M 130 50 C 260 0, 390 0, 400 50 C 410 0, 540 0, 670 50"
                stroke="#2E82F7"
                strokeOpacity="0.35"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1: Start with instant setup */}
            <FadeIn delay={0.05} className="h-full flex flex-col justify-between space-y-6">
              {/* Mockup Card */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#F4F6FB] dark:bg-[#141416] p-6 shadow-xs hover:shadow-md hover:border-[#2E82F7]/40 transition-all space-y-3.5"
              >
                {[
                  { tag: "NIS", name: "Passport Renewal", status: "Connect", active: false, color: "orange" },
                  { tag: "NYC", name: "NYSC Mobilization", status: "Connect", active: false, color: "emerald" },
                  { tag: "NIN", name: "NIMC / BVN Sync", status: "Ready", active: true, color: "blue" },
                  { tag: "CAC", name: "Business Name", status: "Connect", active: false, color: "red" },
                ].map((item, idx) => (
                  <motion.div
                    key={item.name}
                    whileHover={shouldReduceMotion ? {} : { x: 3 }}
                    className="p-3 bg-white dark:bg-[#1a1a1e] rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-2xs flex items-center justify-between transition-colors cursor-default"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-[#2E82F7] flex items-center justify-center font-bold text-xs">
                        {item.tag}
                      </div>
                      <span className="text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                        {item.name}
                      </span>
                    </div>
                    {item.active ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#2E82F7] text-white font-semibold shadow-2xs">
                        {item.status}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                        {item.status}
                      </span>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Step Title & Description */}
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Start with instant setup
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Choose your goal and answer two questions to create a clear, personalized checklist and fee schedule.
                </p>
              </div>
            </FadeIn>

            {/* Step 2: Manage every deal seamlessly */}
            <FadeIn delay={0.1} className="h-full flex flex-col justify-between space-y-6">
              {/* Mockup Card */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#F4F6FB] dark:bg-[#141416] p-6 shadow-xs hover:shadow-md hover:border-[#2E82F7]/40 transition-all space-y-3.5"
              >
                <div className="p-4 bg-white dark:bg-[#1a1a1e] rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      35 × 45 mm
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" />
                      Passed
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Passport Photo Dimension Audit
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-[#1a1a1e] rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[#2E82F7] text-[10px] font-semibold flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-[#2E82F7] animate-pulse" />
                      Progress: 100%
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      21 Days
                    </span>
                  </div>
                  <div className="font-mono text-base font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    ₦35,000.00
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Official NIS Booklet Receipt
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">Salted SHA-256 Token</span>
                    <Lock className="h-3 w-3 text-emerald-600" />
                  </div>
                </div>
              </motion.div>

              {/* Step Title & Description */}
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Audit every document offline
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Verify photo dimensions, PDF file sizes, and requirements locally on your device without uploading unencrypted data.
                </p>
              </div>
            </FadeIn>

            {/* Step 3: Review, close, and repeat */}
            <FadeIn delay={0.15} className="h-full flex flex-col justify-between space-y-6">
              {/* Mockup Card */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#F4F6FB] dark:bg-[#141416] p-6 shadow-xs hover:shadow-md hover:border-[#2E82F7]/40 transition-all space-y-3.5"
              >
                <div className="p-4 bg-white dark:bg-[#1a1a1e] rounded-2xl border border-slate-200/70 dark:border-white/5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    <span>Collection Timeline</span>
                    <span className="text-[10px] font-mono text-zinc-400">Ikoyi Office</span>
                  </div>

                  {/* Bell curve with animated peak tooltip */}
                  <div className="h-28 w-full relative pt-2">
                    <motion.div
                      animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-1 left-1/2 -translate-x-1/2 bg-[#2E82F7] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow"
                    >
                      Capture Ready
                    </motion.div>
                    <svg viewBox="0 0 100 45" className="w-full h-full" preserveAspectRatio="none">
                      <motion.path
                        initial={shouldReduceMotion ? {} : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        d="M 5 40 Q 30 40, 50 15 Q 70 40, 95 40"
                        fill="none"
                        stroke="#2E82F7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line x1="50" y1="15" x2="50" y2="40" stroke="#93C5FD" strokeDasharray="2 2" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px]">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Total Saved</span>
                      <span className="font-mono font-bold text-emerald-600">₦45,000.00</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">$ZED Claim</span>
                      <span className="font-mono font-bold text-[#2E82F7]">+250 $ZED</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step Title & Description */}
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Track milestones & earn
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Track your journey through official milestones, learn from peer updates, and earn $ZED Proof-of-Engagement rewards.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
