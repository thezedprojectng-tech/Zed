"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Handshake,
  ShieldCheck,
  Bell,
  Cpu,
} from "lucide-react";
import { FadeIn } from "./FadeIn";

const FEATURES = [
  {
    icon: Users,
    title: "Smart procedural branching",
    description:
      "Bureaucratic rules are scattered across gazettes, blogs, and counter windows. Zed branches your exact requirements with plain-language steps.",
  },
  {
    icon: TrendingUp,
    title: "Pre-submission document auditor",
    description:
      "Client-side file dimension and size verification. Confirms passport photos match the 35×45mm standard and stay below 200KB thresholds before you apply.",
  },
  {
    icon: Handshake,
    title: "Campus & peer hubs",
    description:
      "Share departmental notes, past exams, and verified SIWES/IT listings across UNILAG, OAU, UI, FUTA, ABU, and Covenant.",
  },
  {
    icon: ShieldCheck,
    title: "Data security & permissions",
    description:
      "Protect sensitive data with salted SHA-256 cryptographic hashing. Raw 11-digit NINs are never written to physical disk, keeping your master identity secure.",
  },
  {
    icon: Bell,
    title: "Real-time alerts & notifications",
    description:
      "Stay ahead of every opportunity with instant alerts for new portal openings, statutory fee updates, and NYSC mobilization changes.",
  },
  {
    icon: Cpu,
    title: "Proof-of-engagement rewards",
    description:
      "Earn $ZED token rewards for completing digital courses, verifying community guides, and peer mentoring with dynamic multiplier tiers.",
  },
];

export function CoreFeaturesGrid() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Core Features"
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
            <span>Key Features</span>
          </motion.div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.08]">
            Core features that power<br className="hidden sm:block" />
            your workflow
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Zed combines verified playbooks, client-side document audits, and community tools into a single platform—helping Nigerian youth navigate official systems, earn, and build without complexity.
          </p>
        </FadeIn>

        {/* 6-Card Light Grid with smooth entrance and hover motions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={feature.title} delay={idx * 0.06} className="h-full">
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { y: -5 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="h-full rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141416] p-7 sm:p-8 space-y-5 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:border-[#2E82F7]/50 dark:hover:border-[#2E82F7]/50 transition-all duration-300 group cursor-default"
                >
                  <div className="space-y-4">
                    {/* Icon container with micro-animation */}
                    <motion.div
                      whileHover={shouldReduceMotion ? {} : { rotate: 8, scale: 1.08 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-[#2E82F7] flex items-center justify-center group-hover:bg-[#2E82F7] group-hover:text-white transition-all duration-300 shadow-2xs"
                    >
                      <Icon className="h-6 w-6 stroke-[1.8]" />
                    </motion.div>

                    <h3 className="font-display font-bold text-lg sm:text-xl text-[#0B0B0C] dark:text-[#FAFAF8] leading-snug group-hover:text-[#2E82F7] transition-colors duration-200">
                      {feature.title}
                    </h3>

                    <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Animated accent pill line */}
                  <div className="h-1 w-8 bg-slate-100 dark:bg-white/10 rounded-full group-hover:w-20 group-hover:bg-[#2E82F7] transition-all duration-300" />
                </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
