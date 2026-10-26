"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowUpRight, Clock, FileCheck } from "lucide-react";
import { FadeIn } from "./FadeIn";

const DAYS_DATA = [
  { day: "Mon", h1: "40%", h2: "25%" },
  { day: "Tue", h1: "65%", h2: "20%" },
  { day: "Wed", h1: "80%", h2: "15%" },
  { day: "Thu", h1: "95%", h2: "0%" },
  { day: "Fri", h1: "70%", h2: "20%" },
  { day: "Sat", h1: "45%", h2: "15%" },
  { day: "Sun", h1: "30%", h2: "10%" },
];

export function FeatureBentoSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      aria-label="Platform Directives"
      className="scroll-mt-24 pt-4 sm:pt-8 pb-12 sm:pb-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* ── 1. Top Section Header ────────────────────────────────────────── */}
        <FadeIn className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7] animate-pulse" />
            <span>Meet Zed</span>
          </motion.div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.08]">
            Everything you need to<br className="hidden sm:block" />
            navigate and grow
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Zed brings civil playbooks, document auditing, and milestone insights into one unified
            dashboard, helping Nigerian youth understand processes, spot requirements, and move faster with confidence.
          </p>
        </FadeIn>

        {/* ── 2. Top Bento Grid (Matching Image 1 Top) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left Column (2 horizontal cards) */}
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
            {/* Card 1: Time tracking / Network Sync Breakdown */}
            <FadeIn delay={0.05} className="h-full">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#F4F6FB] dark:bg-[#141416] p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs hover:shadow-md"
              >
                <div className="space-y-2.5 sm:max-w-xs">
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Offline network sync
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    Track requirements offline across meetings, queues, and weak 3G networks to maintain productivity and eliminate middleman delays.
                  </p>
                </div>

                {/* Mini Mockup: Activity Bar Chart */}
                <div className="w-full sm:w-64 bg-white dark:bg-[#1a1a1e] rounded-2xl p-4 border border-slate-200/70 dark:border-white/5 shadow-2xs space-y-3 shrink-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      <Clock className="h-3 w-3 text-[#2E82F7]" />
                      <span>Sync Activity</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                      Last 7 Days ▾
                    </span>
                  </div>

                  {/* 7 Days Animated Bar Chart */}
                  <div className="h-24 flex items-end justify-between gap-1.5 pt-2">
                    {DAYS_DATA.map((bar, idx) => (
                      <div key={bar.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full max-w-[14px] flex flex-col items-center gap-0.5 h-16 justify-end">
                          <motion.div
                            initial={shouldReduceMotion ? { height: bar.h2 } : { height: 0 }}
                            whileInView={{ height: bar.h2 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 + idx * 0.05, ease: "easeOut" }}
                            className="w-full rounded-t-sm bg-[#93C5FD] dark:bg-[#2E82F7]/40"
                          />
                          <motion.div
                            initial={shouldReduceMotion ? { height: bar.h1 } : { height: 0 }}
                            whileInView={{ height: bar.h1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.15 + idx * 0.05, ease: "easeOut" }}
                            className="w-full rounded-sm bg-[#2E82F7]"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400">{bar.day}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-1 border-t border-slate-100 dark:border-white/5 text-[9px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
                      Offline Cached
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#93C5FD]" />
                      Cloud Sync
                    </span>
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Card 2: Activity Tracking & Insights */}
            <FadeIn delay={0.1} className="h-full">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#F4F6FB] dark:bg-[#141416] p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs hover:shadow-md"
              >
                <div className="space-y-2.5 sm:max-w-xs">
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Activity tracking & insights
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    Visualize when civil progress is strongest with clear insights that help you focus on the statutory requirements that matter most.
                  </p>
                </div>

                {/* Mini Mockup: Task status items with hover effects */}
                <div className="w-full sm:w-64 bg-white dark:bg-[#1a1a1e] rounded-2xl p-3.5 border border-slate-200/70 dark:border-white/5 shadow-2xs space-y-2.5 shrink-0">
                  {[
                    { fee: "₦35,000.00", label: "NIS Passport Renewal", status: "Progress", done: false, color: "blue" },
                    { fee: "0₦ (Free)", label: "NIN / BVN Harmonize", status: "Done", done: true, color: "emerald" },
                    { fee: "₦10,000.00", label: "CAC Business Name", status: "Done", done: true, color: "emerald" },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.label}
                      initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      whileHover={shouldReduceMotion ? {} : { x: 3 }}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between transition-colors hover:bg-slate-100/80 dark:hover:bg-white/8 cursor-default"
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
                          {item.fee}
                        </div>
                        <div className="text-[10px] text-zinc-500">{item.label}</div>
                      </div>
                      {item.done ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <Check className="h-2.5 w-2.5" />
                          Done
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[#2E82F7] text-[10px] font-semibold flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-[#2E82F7] animate-pulse" />
                          Progress
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </FadeIn>
          </div>

          {/* Right Column (Tall Card: Real-time Sales / Civil Statistics) */}
          <div className="lg:col-span-5">
            <FadeIn delay={0.15} className="h-full">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#F4F6FB] dark:bg-[#141416] p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Real-time civil statistics
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    Monitor active applications and statutory trends in real time, so you always know where your verification stands and what needs attention next.
                  </p>
                </div>

                {/* Large Mockup Card inside Right Tall Card */}
                <div className="mt-6 bg-white dark:bg-[#1a1a1e] rounded-2xl p-6 border border-slate-200/70 dark:border-white/5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      <FileCheck className="h-4 w-4 text-[#2E82F7]" />
                      <span>Active Playbooks</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      100% Free Access
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-display text-3xl sm:text-4xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      0₦ Hidden Fees
                    </div>
                    <p className="text-xs text-zinc-400">Zero tout markups across all four official guides</p>
                  </div>

                  {/* SVG Undulating Curve Chart with Animated Draw */}
                  <div className="h-32 w-full pt-4 relative overflow-hidden">
                    <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="blueCurveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2E82F7" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2E82F7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Animated Area */}
                      <motion.path
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        d="M 0 65 Q 40 85, 80 55 T 160 50 T 220 30 T 300 45 L 300 100 L 0 100 Z"
                        fill="url(#blueCurveGradient)"
                      />
                      {/* Animated Main Line */}
                      <motion.path
                        initial={shouldReduceMotion ? {} : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        d="M 0 65 Q 40 85, 80 55 T 160 50 T 220 30 T 300 45"
                        fill="none"
                        stroke="#2E82F7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Sub-line */}
                      <motion.path
                        initial={shouldReduceMotion ? {} : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
                        d="M 0 80 Q 50 65, 100 75 T 200 65 T 300 55"
                        fill="none"
                        stroke="#93C5FD"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </div>

        {/* ── 3. Royal Blue Stat Banner (Matching Image 1 Middle) ──────────── */}
        <FadeIn delay={0.2}>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.005 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-[#2E82F7] to-blue-500 p-8 sm:p-12 text-white shadow-xl shadow-blue-500/15"
          >
            {/* Ambient geometric background lines */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  rgba(255, 255, 255, 0.4) 0px,
                  rgba(255, 255, 255, 0.4) 1px,
                  transparent 1px,
                  transparent 64px
                )`,
              }}
            />

            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
              {[
                { val: "#1", label: "Leading civic OS for modern Nigerian youth" },
                { val: "4", label: "Core civil playbooks field-tested & verified" },
                { val: "36+", label: "States & FCT covered with actionable guidance" },
                { val: "0₦", label: "Hidden markups, tout fees, or subscription charges" },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="space-y-1"
                >
                  <div className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
                    {stat.val}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </FadeIn>

        {/* ── 4. Visibility into every civic action (Matching Image 1 Bottom) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-4 sm:pt-8">
          {/* Left Column: Heading, description, and checkmark list */}
          <div className="lg:col-span-5 space-y-6">
            <FadeIn className="space-y-4">
              <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
                Visibility into every<br />
                civic action
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
                Zed highlights when and where official requirements change, giving Nigerian youth the context they need to navigate civil portals with confidence and avoid costly counter rejections.
              </p>
            </FadeIn>

            <FadeIn delay={0.1} className="space-y-3.5 pt-2">
              {[
                "Track document requirements across your entire workflow",
                "Connect statutory fees, timing, and outcomes in one view",
                "Make data-informed decisions without manual middleman reporting",
              ].map((item, idx) => (
                <motion.div
                  key={item}
                  initial={shouldReduceMotion ? {} : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-start gap-3 group"
                >
                  <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#2E82F7] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#2E82F7] group-hover:text-white transition-colors duration-200">
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-sans text-xs sm:text-sm font-medium text-[#0B0B0C] dark:text-[#FAFAF8] leading-snug">
                    {item}
                  </span>
                </motion.div>
              ))}
            </FadeIn>
          </div>

          {/* Right Column: Visual Composition with vertical blue stripes, photo, gauge chart, and floating badges */}
          <div className="lg:col-span-7">
            <FadeIn delay={0.15}>
              <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-blue-600 via-[#2E82F7] to-blue-700 min-h-[460px] flex flex-col justify-between shadow-xl">
                {/* Background vertical pinstripe pillars */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      rgba(255, 255, 255, 0.4) 0px,
                      rgba(255, 255, 255, 0.4) 16px,
                      transparent 16px,
                      transparent 48px
                    )`,
                  }}
                />

                {/* Top content row: Photo on left + Donut gauge chart card on right */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
                  {/* Photo container */}
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[250px] shadow-lg border border-white/20 group"
                  >
                    <Image
                      src="/features.png"
                      alt="Nigerian youth navigating with Zed"
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </motion.div>

                  {/* Floating White Circular Gauge Card with Gentle Floating Motion */}
                  <motion.div
                    animate={
                      shouldReduceMotion
                        ? {}
                        : { y: [0, -6, 0] }
                    }
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-white dark:bg-[#141416] rounded-2xl p-5 shadow-xl border border-white/20 dark:border-white/10 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#0B0B0C] dark:text-[#FAFAF8]">
                        Readiness overview
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </div>

                    {/* Circular Radial Gauge with Animated Sweep */}
                    <div className="py-3 flex flex-col items-center justify-center relative">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="#E2E8F0"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="4 6"
                        />
                        <motion.circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="#2E82F7"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="289"
                          initial={shouldReduceMotion ? { strokeDashoffset: 64 } : { strokeDashoffset: 289 }}
                          whileInView={{ strokeDashoffset: 64 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.4, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          className="font-display text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]"
                        >
                          78%
                        </motion.span>
                        <span className="text-[10px] text-zinc-400 font-medium">Readiness rate</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1 text-[10px] text-zinc-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
                          Required criteria met
                        </span>
                        <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">78%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#93C5FD]" />
                          Documents audited
                        </span>
                        <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">100%</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Stat Badge Overlay with Counter-floating Motion */}
                <motion.div
                  animate={
                    shouldReduceMotion
                      ? {}
                      : { y: [0, 4, 0] }
                  }
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="relative z-10 mt-5 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md rounded-2xl p-4.5 sm:p-5 border border-white/30 dark:border-white/10 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-display text-lg sm:text-xl font-bold text-[#2E82F7]">
                      72% Reduction in queue & filing time
                    </div>
                    <div className="text-xs text-[#57575e] dark:text-zinc-400">
                      From Nigerian youth who used Zed playbooks over standard counter lines.
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#2E82F7] text-xs font-semibold">
                      Verified Impact
                    </span>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
