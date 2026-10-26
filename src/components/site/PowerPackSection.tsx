"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Compass, GraduationCap, ShieldCheck, ArrowUpRight, Search, CheckCircle2 } from "lucide-react";
import { FadeIn } from "./FadeIn";

const TABS = [
  {
    id: "nav",
    icon: Compass,
    title: "Zed Nav (Civil Playbooks)",
    description:
      "Transform bureaucratic confusion into clear step-by-step guidance for passports, NYSC, NIN, and CAC registration without middlemen.",
    preview: {
      category: "Civil Flow",
      flowName: "NIS Renewal",
      step: "Step 3 of 4",
      fee: "₦35,000",
      feeStatus: "Verified Rate",
      balance: "1,250",
      level: "Lvl 3 Builder",
      chartTitle: "Playbook Progress",
      chartChange: "+85%",
      chartColor: "#2E82F7",
      chartPath: "M 0 35 Q 25 15, 50 25 T 100 8",
      donutScore: "85%",
      subNote: "4 Core Modules Field-Verified",
    },
  },
  {
    id: "academy",
    icon: GraduationCap,
    title: "Zed Academy & Digital Skills",
    description:
      "Practical project-based learning tracks with verified proof-of-work badges to build your digital career and earn $ZED tokens.",
    preview: {
      category: "Skill Track",
      flowName: "Fullstack Track",
      step: "Project 2 of 3",
      fee: "0₦ Free",
      feeStatus: "Self-Paced",
      balance: "2,400",
      level: "Lvl 4 Hustler",
      chartTitle: "Curriculum Velocity",
      chartChange: "+92%",
      chartColor: "#10b981",
      chartPath: "M 0 38 Q 20 20, 50 12 T 100 5",
      donutScore: "92%",
      subNote: "Verified Proof-of-Work Badge",
    },
  },
  {
    id: "market",
    icon: ShieldCheck,
    title: "Zed Market & Escrow Gigs",
    description:
      "Unify peer trading, freelance micro-gigs, and milestone-locked escrow payments released straight to verified Nigerian bank accounts.",
    preview: {
      category: "Escrow Gig",
      flowName: "Brand Identity Gig",
      step: "Milestone 2 Paid",
      fee: "₦75,000",
      feeStatus: "Locked in Escrow",
      balance: "3,850",
      level: "Lvl 5 Legend",
      chartTitle: "Escrow Payouts",
      chartChange: "100% Safe",
      chartColor: "#8b5cf6",
      chartPath: "M 0 30 Q 30 35, 60 15 T 100 10",
      donutScore: "100%",
      subNote: "Zero-Fraud Milestone Release",
    },
  },
];

export function PowerPackSection() {
  const [activeTab, setActiveTab] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const currentTab = TABS[activeTab];

  return (
    <section aria-label="Zed Workflow" className="scroll-mt-24 py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
        {/* Top Header (2 columns: left title, right description) */}
        <FadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-end">
          <div className="lg:col-span-7 space-y-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7] animate-pulse" />
              <span>Power Pack</span>
            </motion.div>
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.08]">
              Designed for how Nigerian<br className="hidden sm:block" />
              youth actually work
            </h2>
          </div>

          <div className="lg:col-span-5 lg:pb-2">
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Zed simplifies complex civil workflows and career progression by combining navigation, offline caching, and peer safety—so you stay focused on moving forward.
            </p>
          </div>
        </FadeIn>

        {/* Interactive Showcase (3 tabs on left + dynamic dashboard preview on right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: 3 selectable tab rows */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  whileHover={shouldReduceMotion ? {} : { x: 3 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                  className={`relative text-left p-6 rounded-2xl transition-all duration-300 cursor-pointer ${
                    isActive
                      ? " border-y-slate-200/90 border-r-slate-200/90 dark:border-white/15 bg-white dark:bg-[#141416] shadow-md"
                      : "border-transparent bg-transparent hover:bg-white/60 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-500/10 text-[#2E82F7] shadow-2xs"
                          : "bg-slate-100 dark:bg-white/5 text-zinc-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-1.5">
                      <h3
                        className={`font-display font-bold text-base sm:text-lg transition-colors ${
                          isActive
                            ? "text-[#0B0B0C] dark:text-[#FAFAF8]"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {tab.title}
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right Column: High-Fidelity Mockup Dashboard with AnimatePresence */}
          <div className="lg:col-span-7">
            <FadeIn delay={0.1}>
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                transition={{ duration: 0.25 }}
                className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-[#F4F6FB] dark:bg-[#111113] p-5 sm:p-7 shadow-xl shadow-blue-500/5 space-y-5"
              >
                {/* Dashboard Nav Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/8 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-[#2E82F7] text-white flex items-center justify-center font-bold text-xs">
                      Z
                    </div>
                    <span className="font-display font-bold text-sm text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Zed Dashboard
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-full bg-slate-200/60 dark:bg-white/5 font-medium text-[11px] text-zinc-600 dark:text-zinc-400">
                    {["Overview", "Playbooks", "Academy", "Escrow"].map((item, idx) => (
                      <span
                        key={item}
                        className={`px-3 py-0.5 rounded-full transition-colors ${
                          (idx === 0 && activeTab === 0) || (idx === 1 && activeTab === 0) || (idx === 2 && activeTab === 1) || (idx === 3 && activeTab === 2)
                            ? "bg-white dark:bg-[#1f1f23] text-[#0B0B0C] dark:text-white font-semibold shadow-2xs"
                            : ""
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <div className="h-7 w-7 rounded-full bg-[#2E82F7] text-white flex items-center justify-center font-bold text-[10px]">
                      CH
                    </div>
                  </div>
                </div>

                {/* Dashboard Greeting Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Good Morning, Chidi!
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Here is your current civil readiness & $ZED status today
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-white dark:bg-[#1a1a1e] border border-slate-200/70 dark:border-white/10 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 shadow-2xs">
                    24 October 2026 ▾
                  </div>
                </div>

                {/* Animated Metric Cards Row */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
                  >
                    <div className="bg-white dark:bg-[#18181b] p-3 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-2xs">
                      <span className="text-[10px] text-zinc-400 block">{currentTab.preview.category}</span>
                      <span className="font-display font-bold text-base text-[#0B0B0C] dark:text-[#FAFAF8] truncate block">
                        {currentTab.preview.flowName}
                      </span>
                      <span className="text-[9px] text-[#2E82F7] font-semibold">{currentTab.preview.step}</span>
                    </div>

                    <div className="bg-white dark:bg-[#18181b] p-3 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-2xs">
                      <span className="text-[10px] text-zinc-400 block">Value / Status</span>
                      <span className="font-display font-bold text-base text-[#0B0B0C] dark:text-[#FAFAF8]">
                        {currentTab.preview.fee}
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">{currentTab.preview.feeStatus}</span>
                    </div>

                    <div className="bg-white dark:bg-[#18181b] p-3 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-2xs">
                      <span className="text-[10px] text-zinc-400 block">$ZED Balance</span>
                      <span className="font-display font-bold text-base text-[#2E82F7]">
                        {currentTab.preview.balance}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">+100/day</span>
                    </div>

                    <div className="bg-white dark:bg-[#18181b] p-3 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-2xs">
                      <span className="text-[10px] text-zinc-400 block">Rank Tier</span>
                      <span className="font-display font-bold text-base text-[#0B0B0C] dark:text-[#FAFAF8]">
                        {currentTab.preview.level}
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Active Tier</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Animated Visual Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Curve 1: Dynamic Progress */}
                  <div className="bg-white dark:bg-[#18181b] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{currentTab.preview.chartTitle}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{currentTab.preview.chartChange}</span>
                    </div>
                    <div className="h-14 w-full">
                      <svg viewBox="0 0 100 40" className="w-full h-full">
                        <motion.path
                          key={activeTab}
                          initial={shouldReduceMotion ? {} : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          d={currentTab.preview.chartPath}
                          fill="none"
                          stroke={currentTab.preview.chartColor}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Curve 2: Middleman Savings */}
                  <div className="bg-white dark:bg-[#18181b] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Fees Protected</span>
                      <span className="text-[10px] text-emerald-600 font-bold">₦40,000+</span>
                    </div>
                    <div className="h-14 w-full">
                      <svg viewBox="0 0 100 40" className="w-full h-full">
                        <path
                          d="M 0 32 Q 25 35, 50 18 T 100 5"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Donut Chart: Coverage */}
                  <div className="bg-white dark:bg-[#18181b] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Civic Readiness</span>
                      <span className="font-display font-bold text-sm text-[#0B0B0C] dark:text-[#FAFAF8]">
                        Verified
                      </span>
                      <span className="text-[9px] text-[#2E82F7] block">{currentTab.preview.subNote}</span>
                    </div>

                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="18" stroke="#E2E8F0" strokeWidth="5" fill="transparent" />
                        <motion.circle
                          key={activeTab}
                          cx="24"
                          cy="24"
                          r="18"
                          stroke={currentTab.preview.chartColor}
                          strokeWidth="5"
                          fill="transparent"
                          strokeDasharray="113"
                          initial={shouldReduceMotion ? { strokeDashoffset: 20 } : { strokeDashoffset: 113 }}
                          animate={{ strokeDashoffset: 20 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold font-mono">{currentTab.preview.donutScore}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
