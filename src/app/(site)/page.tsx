import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Lock,
  Coins,
  GraduationCap,
  Sparkles,
  Users,
  Radio,
} from "lucide-react";
import { HeroSection } from "@/components/site/HeroSection";
import { FeatureBentoSection } from "@/components/site/FeatureBentoSection";
import { CoreFeaturesGrid } from "@/components/site/CoreFeaturesGrid";
import { PowerPackSection } from "@/components/site/PowerPackSection";
import { HowItWorksSection } from "@/components/site/HowItWorksSection";
import { ProofOfEngagementSection } from "@/components/site/ProofOfEngagementSection";
import { SovereignPrivacySection } from "@/components/site/SovereignPrivacySection";
import { Accordion } from "@/components/site/Accordion";
import { ClosingCTA } from "@/components/site/ClosingCTA";
import { FadeIn } from "@/components/site/FadeIn";
import { MODULES } from "@/data/modules";

export const metadata: Metadata = {
  title: "Zed – The Digital Operating System for Nigerian Youth",
  description:
    "The all-in-one digital OS for Nigerian Gen Z. Step-by-step civic administrative guides (passports, NYSC, NIN, CAC), practical digital skills, escrow-backed freelance opportunities, university community hubs, and $ZED rewards.",
  openGraph: {
    title: "Zed – The Digital Operating System for Nigerian Youth",
    description:
      "The all-in-one digital OS for Nigerian Gen Z. Step-by-step civic administrative guides (passports, NYSC, NIN, CAC), practical digital skills, escrow-backed freelance opportunities, university community hubs, and $ZED rewards.",
    url: "https://zedproject.ng",
    siteName: "Zed",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zed – The Digital Operating System for Nigerian Youth",
    description:
      "The all-in-one digital OS for Nigerian Gen Z. Civic administration guides, skill tracks, freelance escrow marketplace, and campus community hubs.",
    site: "@thezedprojectng",
    creator: "@thezedprojectng",
  },
};

const FAQ_ITEMS = [
  {
    question: "Is Zed free to use?",
    answer:
      "Yes, completely. All procedural guides, checklist tracking, statutory fee calculators, document dimension audits, and offline features on Zed are 100% free for all Nigerian youth. We do not charge subscriptions, convenience markups, or hidden access fees.",
  },
  {
    question: "What is the $ZED Token and how does mining work?",
    answer:
      "Planned: coming in Phase 2. The $ZED Token is an upcoming off-chain engagement reward system designed to recognize active learning, course completions, and community reports. Mining rates will scale with your verified tier. In Phase 2, conversions to Naira or discounted mobile data bundles are planned once treasury mechanisms launch.",
  },
  {
    question: "How does the Zed Market escrow model protect buyers and sellers?",
    answer:
      "Planned for Phase 2: Zed Market is an upcoming trust-first services marketplace. When launched, it is planned to use escrow protection to hold client funds until project milestones are approved before releasing payouts to verified Nigerian accounts.",
  },
  {
    question: "Does Zed work offline on weak mobile networks?",
    answer:
      "Yes. Zed is built lightweight for weak networks with aggressive Service Worker caching. Core procedural playbooks, requirement checklists, and statutory fee schedules are cached locally on your device via IndexedDB, enabling access in government basement offices with zero cellular signal.",
  },
  {
    question: "What happens to my NIN and personal data?",
    answer:
      "Zed never stores your raw 11-digit NIN or sensitive banking credentials. In our verification pipeline, your NIN is transmitted over an encrypted HTTPS connection and processed with a salted SHA-256 cryptographic digest on our servers. Designed with data protection in mind; NIN is hashed, never stored raw.",
  },
  {
    question: "Which administrative playbooks are currently live in Zed Nav?",
    answer:
      "Zed Nav currently provides complete, field-tested playbooks for: Nigerian Standard e-Passport (Fresh & Renewal), NYSC Mobilization & Call-Up, NIMC NIN Registration & BVN Harmonization, and CAC Business Name Incorporation. Each guide includes verified statutory fees and required document audits.",
  },
  {
    question: "How do university students and alumni benefit from Zed?",
    answer:
      "Planned for Phase 2 & 3: Campus Hubs and Alumni Office Hours will provide campus-specific mobilization guides, departmental resources, and mentorship connections for Nigerian students and graduates.",
  },
  {
    question: "Is Zed official government advice?",
    answer:
      "No. Zed is an independent platform and is not affiliated with or endorsed by any government agency. We aggregate, verify, and simplify publicly available civil procedures into plain, actionable checklists to help citizens navigate official processes independently.",
  },
];

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

export default function HomePage() {
  return (
    <div className="w-full flex flex-col space-y-16 pb-0">
      {/* ── Section 1: Hero Section ───────────────────────────────────── */}
      <HeroSection />

      {/* ── Section 2: Feature Bento Grid (Image 1) ─────────────────────── */}
      <FeatureBentoSection />

      {/* ── Section 3: Core Features Grid (Image 2) ────────────────────── */}
      <CoreFeaturesGrid />

      {/* ── Section 4: Power Pack Section (Image 3 Top) ────────────────── */}
      <PowerPackSection />

      {/* ── Section 5: How It Works Section (Image 3 Bottom) ───────────── */}
      <HowItWorksSection />

      {/* ── Section 6: The Zed Ecosystem Grid ───────────────────────────── */}
      <section id="ecosystem" className="scroll-mt-24 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
          {/* 2-col header: left title, right subtitle */}
          <FadeIn className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 items-end">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
                <span>The Platform</span>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.06]">
                The Zed<br />Ecosystem.
              </h2>
            </div>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed lg:max-w-md lg:mb-2">
              {MODULES.length} integrated modules built for Nigerian youth across civic processes, practical digital skills, escrow freelance work, and campus communities.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {MODULES.map((mod, idx) => {
              const isLive = mod.status === "live";
              const cardHref = isLive ? mod.href! : `/modules/${mod.slug}`;
              const CardInner = (
                <div
                  className={`h-full rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-all ${
                    isLive
                      ? "border-[#2E82F7]/40 bg-white dark:bg-[#141416] hover:border-[#2E82F7] hover:shadow-lg shadow-blue-500/5 cursor-pointer"
                      : "border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#141416] hover:border-slate-300 dark:hover:border-white/15"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-base text-[#0B0B0C] dark:text-[#FAFAF8] flex items-center gap-1.5">
                        {mod.name}
                        {isLive && <ArrowRight className="h-3.5 w-3.5 text-[#2E82F7]" />}
                      </h3>
                      {isLive ? (
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/5 text-zinc-500 font-mono text-[10px] font-medium uppercase tracking-wider">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                      {mod.tagline}
                    </p>
                  </div>
                  {isLive && (
                    <div className="pt-2 text-xs font-semibold text-[#2E82F7] flex items-center gap-1">
                      <span>Open in Zed</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );

              return (
                <FadeIn key={mod.slug} delay={idx * 0.03}>
                  <Link
                    href={cardHref}
                    className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-2xl"
                  >
                    {CardInner}
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 7: Gamified $ZED Token & Level Matrix ─────────────── */}
      <ProofOfEngagementSection />

      {/* ── Section 8: Sovereign Privacy & NDPR Section ───────────────── */}
      <SovereignPrivacySection />

      {/* ── Section 9: FAQ Section (2-Column Layout matching reference design) ── */}
      <section id="faq" className="scroll-mt-24 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Column: Eyebrow, Heading, Subtitle, and Support Card (5 cols) */}
            <div className="lg:col-span-5 space-y-6 sm:space-y-7 lg:sticky lg:top-28">
              <FadeIn className="space-y-3.5">
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416] text-[#0B0B0C] dark:text-[#FAFAF8] text-xs font-semibold shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
                  <span>FAQs</span>
                </div>

                {/* Heading */}
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.08]">
                  Got Questions?
                </h2>

                {/* Subtitle */}
                <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Everything you need to know about using Zed, from civic playbooks and $ZED mining to data privacy and security.
                </p>
              </FadeIn>

              {/* Support Specialist Image Card */}
              <FadeIn delay={0.1}>
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] shadow-md border border-slate-200/80 dark:border-white/10 group">
                  <Image
                    src="/support-agent.png"
                    alt="Zed community support team specialist"
                    fill
                    sizes="(max-width: 1024px) 100vw, 450px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white space-y-2.5">
                    <p className="font-sans text-xs sm:text-sm text-white/90 leading-relaxed">
                      Still have questions or need help? Our community team is always ready to help you navigate, learn, and grow with Zed.
                    </p>
                    <div>
                      <a
                        href="mailto:thezedprojectng@gmail.com"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white hover:text-[#2E82F7] transition-colors group/link"
                      >
                        <span>Contact us</span>
                        <ArrowUpRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right Column: Accordion Cards (7 cols) */}
            <div className="lg:col-span-7">
              <FadeIn delay={0.15}>
                <Accordion items={FAQ_ITEMS} defaultOpenIndex={0} />
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 10: Closing CTA ──────────────────────────────────── */}
      <ClosingCTA />
    </div>
  );
}
