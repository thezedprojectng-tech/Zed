import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Lock,
  Wifi,
  Coins,
  Zap,
  GraduationCap,
  Sparkles,
  Users,
  Radio,
} from "lucide-react";
import { HeroSection } from "@/components/site/HeroSection";
import { TabbedShowcase } from "@/components/site/TabbedShowcase";
import { AlternatingFeatures } from "@/components/site/AlternatingFeatures";
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

const ENGINEERING_DIRECTIVES = [
  {
    icon: Wifi,
    title: "Low-Data PWA (Lightweight)",
    description:
      "Aggressive Service Worker caching for instant offline access to guides and checklists across 3G/4G networks (MTN, Airtel, Glo, 9mobile).",
  },
  {
    icon: Coins,
    title: "Zero-Fintech Compliance",
    description:
      "Planned: Off-chain $ZED rewards are designed to convert to Naira or discounted data bundles with direct payouts, eliminating banking license overhead without present financial exposure.",
  },
  {
    icon: Lock,
    title: "Salted SHA-256 Privacy",
    description:
      "Raw 11-digit NINs are never written to physical disk. Designed with data protection in mind; NIN is hashed, never stored raw.",
  },
  {
    icon: Zap,
    title: "State Machine Engine",
    description:
      "JSON-structured sequential workflows powering verified civic navigation playbooks across passport, NYSC, NIN, and business registration processes.",
  },
];

const PILLARS = [
  {
    eyebrow: "01 // PLAIN LANGUAGE",
    title: "Clear",
    subtitle: "Plain-language steps",
    description:
      "Bureaucratic jargon translated into plain, actionable instructions. Understand what each requirement means, why it is needed, and where to obtain it without paying middleman fees.",
  },
  {
    eyebrow: "02 // PRE-SUBMISSION AUDIT",
    title: "Checked",
    subtitle: "Document auditor",
    description:
      "Client-side file dimension and size verification. Confirms your passport photos match the 35×45mm standard and stay below strict 200KB upload thresholds before you apply.",
  },
  {
    eyebrow: "03 // LOCAL FIRST",
    title: "Offline",
    subtitle: "Works on weak networks",
    description:
      "Zero blank screens in government basement offices. All checklists, fee schedules, and requirements are cached locally on your device via Service Worker and IndexedDB.",
  },
  {
    eyebrow: "04 // CRYPTOGRAPHIC PRIVACY",
    title: "Private",
    subtitle: "NIN hashed, never stored raw",
    description:
      "Your 11-digit NIN is transmitted over an encrypted HTTPS connection, hashed with a secret salt on our server, and never stored raw. Verification operates in demo mode.",
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
    <div className="w-full flex flex-col space-y-20 sm:space-y-28 lg:space-y-36 pb-0">
      {/* ── Section 1: Hero Section ───────────────────────────────────── */}
      <HeroSection />

      {/* ── Section 2: Core Engineering Directives ────────────────────── */}
      <section id="features" aria-label="Engineering Directives" className="scroll-mt-24 py-10 sm:py-14 border-y border-[#EAEAE6] dark:border-white/10 bg-[#FAFAF8]/70 dark:bg-[#0E0E10]/70">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center space-y-3 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>System Directives // Version 2.0.0</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
              Engineered for Nigerian network realities.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {ENGINEERING_DIRECTIVES.map((directive, idx) => {
              const Icon = directive.icon;
              return (
                <FadeIn key={directive.title} delay={idx * 0.06}>
                  <div className="h-full rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-[#2E82F7]/40 transition-all">
                    <div className="space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">
                        {directive.title}
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                        {directive.description}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 3: Zed Nav (Tabbed Showcase) ────────────────────────── */}
      <section id="zed-nav" className="scroll-mt-24 py-8 sm:py-14">
        <span id="how-it-works" className="scroll-mt-24" />
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>Zed Nav // Live Engine</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
              Clear civil playbooks.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Explore key screens, requirements, and verified statutory fees across our four core civil flows. Step-by-step guidance designed to remove the middleman.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TabbedShowcase />
          </FadeIn>
        </div>
      </section>

      {/* ── Section 4: The Zed Ecosystem Grid ───────────────────────────── */}
      <section id="ecosystem" className="scroll-mt-24 py-8 sm:py-14">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>The Platform</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
              The Zed Ecosystem
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              {MODULES.length} integrated modules built for Nigerian youth across civic processes, practical skills, escrow freelance work, and campus communities.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {MODULES.map((mod, idx) => {
              const isLive = mod.status === "live";
              const cardHref = isLive ? mod.href! : `/modules/${mod.slug}`;
              const CardInner = (
                <div
                  className={`h-full rounded-2xl border p-5 sm:p-6 space-y-4 flex flex-col justify-between transition-all ${
                    isLive
                      ? "border-[#2E82F7]/40 dark:border-[#2E82F7]/40 bg-white dark:bg-[#141416] shadow-xs hover:border-[#2E82F7] hover:shadow-lg cursor-pointer"
                      : "border-[#EAEAE6] dark:border-white/8 bg-white/90 dark:bg-[#141416]/70 hover:border-[#D8D8D2] dark:hover:border-white/15"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-bold text-base text-[#0B0B0C] dark:text-[#FAFAF8] flex items-center gap-1.5">
                        {mod.name}
                        {isLive && <ArrowRight className="h-3.5 w-3.5 text-[#2E82F7]" />}
                      </h3>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[#EAEAE6] dark:border-white/8 bg-[#FAFAF8] dark:bg-white/5 text-[#707078] dark:text-zinc-400 font-mono text-[10px] font-medium uppercase tracking-wider">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                      {mod.tagline}
                    </p>
                  </div>
                  {isLive && (
                    <div className="pt-2 text-xs font-semibold text-[#2E82F7] flex items-center gap-1">
                      <span>Get started with Zed Nav</span>
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

      {/* ── Section 5: Problem / Solution Statement ───────────────────── */}
      <section className="py-6 sm:py-10">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="max-w-3xl mx-auto rounded-3xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-8 sm:p-14 shadow-xl shadow-blue-500/5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#1a1a1e] text-[#2E82F7] text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>The Reality of Nigerian Youth Navigation</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-snug">
              Government processes shouldn&apos;t require a middleman. Earning shouldn&apos;t require luck.
            </h2>

            <div className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 space-y-4 leading-relaxed">
              <p>
                Every year, millions of young Nigerians lose days of work and study to conflicting requirements, broken portals, and middleman markups. Official instructions sit scattered across outdated gazettes, unofficial blogs, and handwritten posters on counter windows. A simple renewal turns into multiple wasted trips.
              </p>
              <p>
                Zed unifies civil readiness, market earning, and community support in a single, lightweight operating system. We audit official statutory fees, test procedural requirements against actual field conditions, and lay out sequential paths—right on your device, with zero middlemen.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 6: Four Pillars Grid ──────────────────────────────── */}
      <section id="architecture" className="scroll-mt-24 py-8 sm:py-14">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>Zed Architecture</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
              Built with purpose.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Four design principles guiding how Zed protects your time, your money, and your privacy.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {PILLARS.map((pillar, idx) => (
              <FadeIn key={pillar.eyebrow} delay={idx * 0.06}>
                <div className="h-full rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-[#2E82F7]/40 transition-all">
                  <div className="space-y-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8a8a92] dark:text-zinc-500 font-medium block">
                      {pillar.eyebrow}
                    </span>
                    <h3 className="font-display text-xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      {pillar.title}
                    </h3>
                    <p className="font-mono text-xs text-[#2E82F7] font-semibold">
                      {pillar.subtitle}
                    </p>
                    <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Alternating Feature Blocks with Mockups ────────── */}
      <section className="py-8 sm:py-14">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <AlternatingFeatures />
        </div>
      </section>

      {/* ── Section 8: Gamified $ZED Token & Level Matrix ─────────────── */}
      <section id="token-engine" className="scroll-mt-24 py-8 sm:py-14">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-3xl mx-auto mb-12 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>Phase 2 Architecture</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
              Earn as you grow. Proof-of-Engagement.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Planned for Phase 2: The $ZED Token will reward active participation, course completions, alumni mentorship, and community updates. Mining rates scale dynamically with your level.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-3xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] overflow-hidden shadow-xl shadow-blue-500/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAEAE6] dark:border-white/8 bg-[#FAFAF8] dark:bg-[#17171a] text-[#57575e] dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-4 px-5 font-semibold">Tier</th>
                      <th className="py-4 px-5 font-semibold">Level Name</th>
                      <th className="py-4 px-5 font-semibold">Unlock Criteria (Proof-of-Engagement)</th>
                      <th className="py-4 px-5 font-semibold">Multiplier</th>
                      <th className="py-4 px-5 font-semibold">Daily Cap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAE6] dark:divide-white/6 text-sm">
                    {LEVEL_MATRIX.map((tier) => (
                      <tr key={tier.level} className="hover:bg-[#FAFAF8]/60 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5 font-mono text-xs font-semibold text-[#8a8a92] dark:text-zinc-500">
                          Lvl {tier.level}
                        </td>
                        <td className="py-4 px-5 font-display font-bold text-[#0B0B0C] dark:text-[#FAFAF8] flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#2E82F7]" />
                          {tier.name}
                        </td>
                        <td className="py-4 px-5 text-[#57575e] dark:text-zinc-400 text-xs">
                          {tier.criteria}
                        </td>
                        <td className="py-4 px-5 font-mono text-xs font-bold text-[#2E82F7]">
                          {tier.multiplier}
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-[#0B0B0C] dark:text-[#FAFAF8] font-semibold">
                          {tier.cap}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-[#EAEAE6] dark:border-white/8 bg-[#FAFAF8]/70 dark:bg-[#17171a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#57575e] dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#2E82F7]" />
                  <span>
                    <strong>Dynamic Treasury Pool (Planned):</strong> In Phase 2, $ZED is planned to convert to Naira withdrawals or discounted mobile data bundles (MTN, Airtel, Glo, 9mobile).
                  </span>
                </div>
                <Link
                  href="/signup"
                  className="font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] flex items-center gap-1 shrink-0"
                >
                  <span>Explore Level Matrix</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2E82F7]" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 9: Campus, Social & Safety Network ─────────────────── */}
      <section className="py-8 sm:py-14">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-10 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>Community & Safety</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
              Social connection with built-in safety.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Designed for real-world peer connection, university academic support, and crowd-sourced transit safety.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <FadeIn delay={0.05}>
              <div className="h-full rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-[#2E82F7]/40 transition-all">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">Campus Hubs</h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    Dedicated university spaces (UNILAG, OAU, UI, FUTA, ABU, Covenant) featuring an Academic Vault for past exams, departmental lecture notes, and verified SIWES/IT listings.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] dark:text-zinc-500 uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="h-full rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-[#2E82F7]/40 transition-all">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">Zed Meet</h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    WebRTC 1-on-1 text and audio speed networking with interest tags (Tech, NYSC, Campus, Creative). Includes 1-tap blocking and verified identity safeguards.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] dark:text-zinc-500 uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="h-full rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-[#2E82F7]/40 transition-all">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">Zed Market</h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    Escrow-backed micro-gigs. Milestone-locked client funds are released upon approval directly to Nigerian banks or USDT wallet addresses.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] dark:text-zinc-500 uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="h-full rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-[#2E82F7]/40 transition-all">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                    <Radio className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">Zed SOS</h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    PostGIS-powered geospatial safety reporting. Crowd-sourced real-time alerts for road hazards, police checkpoints, and transit emergencies across Nigerian cities.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] dark:text-zinc-500 uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Section 10: Sovereign Privacy & NDPR Section ───────────────── */}
      <section className="py-8 sm:py-14">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="rounded-3xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-8 sm:p-14 shadow-xl shadow-blue-500/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-8 space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-[#FAFAF8] dark:bg-[#1a1a1e] text-[#2E82F7] text-xs font-semibold">
                  <Lock className="h-3.5 w-3.5 text-[#2E82F7]" />
                  <span>Sovereign Identity Protection</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Your NIN stays yours.
                </h2>

                <div className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 space-y-3.5 leading-relaxed">
                  <p>
                    Your National Identity Number is the master key to your civil, banking, and travel records. Storing raw identity numbers in cloud databases creates an unacceptable attack surface for identity theft.
                  </p>
                  <p>
                    Zed transmits your NIN over an encrypted HTTPS connection and hashes it with a secret salt on our server. Under no circumstances is your raw 11-digit NIN written, logged, or persisted in our databases. Verification is a demo mock, and only the cryptographic hash is retained.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/privacy"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors group"
                  >
                    <span>Read our full NDPA Data Privacy Policy</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#2E82F7]" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3.5">
                <div className="p-4 rounded-xl border border-[#EAEAE6] dark:border-white/8 bg-[#FAFAF8] dark:bg-[#17171a] space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Salted SHA-256 Digest
                  </div>
                  <div className="text-xs text-[#57575e] dark:text-zinc-400">
                    One-way irreversible identity token
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#EAEAE6] dark:border-white/8 bg-[#FAFAF8] dark:bg-[#17171a] space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Zero Plaintext Cloud Storage
                  </div>
                  <div className="text-xs text-[#57575e] dark:text-zinc-400">
                    Raw NIN never written to physical disk
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#EAEAE6] dark:border-white/8 bg-[#FAFAF8] dark:bg-[#17171a] space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Data Protection First
                  </div>
                  <div className="text-xs text-[#57575e] dark:text-zinc-400">
                    Designed with data protection in mind; NIN is hashed, never stored raw
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 11: FAQ Section (2-Column Layout matching reference design) ── */}
      <section id="faq" className="scroll-mt-24 py-6 sm:py-10">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Column: Eyebrow, Heading, Subtitle, and Support Card (5 cols) */}
            <div className="lg:col-span-5 space-y-6 sm:space-y-7 lg:sticky lg:top-28">
              <FadeIn className="space-y-3.5">
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#0B0B0C] dark:text-[#FAFAF8] text-xs font-semibold shadow-2xs">
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
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] shadow-md border border-[#EAEAE6] dark:border-white/10 group">
                  <Image
                    src="/support-agent.jpg"
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

      {/* ── Section 12: Dark Closing CTA ─────────────────────────────── */}
      <ClosingCTA />
    </div>
  );
}
