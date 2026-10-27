"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  GraduationCap,
  Briefcase,
  Users,
  Coins,
  ShieldAlert,
} from "lucide-react";
import { FadeIn } from "./FadeIn";

const FEATURES = [
  {
    icon: Compass,
    title: "Zed Nav (Civil Bureaucracy Engine)",
    description:
      "Interactive state machines demystifying NIS e-Passports, NYSC green card mobilization, NIN-BVN harmonization, and CAC business registration with client-side document auditing (35×45mm photos, <200KB files).",
  },
  {
    icon: GraduationCap,
    title: "Zed Skill (Low-Data Tracks)",
    description:
      "Text-and-audio-first microcourses in UI/UX design, engineering, video editing, and AI prompt engineering with downloadable PDF summaries engineered for 3G/4G networks (MTN, Airtel, Glo, 9mobile).",
  },
  {
    icon: Briefcase,
    title: "Zed Market (Services Marketplace)",
    description:
      "A services marketplace connecting Nigerian youth with clients for design, development, tutoring, repairs, and creative work with direct WhatsApp messaging.",
  },
  {
    icon: Users,
    title: "Zed Meet & Campus Hubs",
    description:
      "WebRTC 1-on-1 speed networking with Level 1+ NIN verification, Live Audio Rooms (+150 $ZED reward), and dedicated university hubs across UNILAG, OAU, UI, FUTA, ABU Zaria, and Covenant.",
  },
  {
    icon: Coins,
    title: "Gamified $ZED Token Matrix",
    description:
      "Off-chain Proof-of-Engagement (PoE) token ecosystem rewarding daily activity from Rookie (100/day) to Zed Legend (1,000/day), convertible to Naira treasury payouts or discounted mobile data bundles.",
  },
  {
    icon: ShieldAlert,
    title: "Zed SOS & Creator Asset Lab",
    description:
      "PostGIS-powered real-time geospatial safety reporting map for road hazards and police checkpoints, paired with free Afrobeat drum kits, video editing overlays, and student merchant QR discounts.",
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
