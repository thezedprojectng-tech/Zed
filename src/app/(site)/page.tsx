import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Wifi,
  Coins,
  ShieldCheck,
  Zap,
  GraduationCap,
  Sparkles,
  Users,
  Radio,
  FileCheck2,
  TrendingUp,
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
      "The $ZED Token is an off-chain engagement reward system that recognizes your active learning, course completions, alumni mentorship, and community reports. Mining rates scale from 1.0× to 10.0× based on your verified Proof-of-Engagement tier (from Rookie to Zed Legend). Tokens convert to Naira withdrawals via monthly platform revenue pools or are redeemable directly for discounted MTN, Airtel, Glo, and 9mobile data bundles.",
  },
  {
    question: "How does the Zed Market escrow model protect buyers and sellers?",
    answer:
      "Zed Market integrates with domestic payment gateways (Paystack and Flutterwave) to hold client funds securely in escrow until a project milestone is reviewed and formally approved. Payouts route directly to local Nigerian bank accounts (GTB, Kuda, OPay, Moniepoint, Zenith) or USDT wallet addresses.",
  },
  {
    question: "Does Zed work offline on weak mobile networks?",
    answer:
      "Yes. Zed is engineered as a mobile-first Progressive Web App (PWA) with a bundle size under 1.8MB and aggressive Service Worker caching. Core procedural playbooks, requirement checklists, and statutory fee schedules are cached locally on your device via IndexedDB, enabling access in government basement offices with zero cellular signal.",
  },
  {
    question: "What happens to my NIN and personal data?",
    answer:
      "Zed never stores your raw 11-digit NIN or sensitive banking credentials. In our verification pipeline, your NIN is transmitted over an encrypted HTTPS connection and processed with a salted SHA-256 cryptographic digest on our servers. Only the irreversible hash token is persisted, ensuring full compliance with the Nigeria Data Protection Act (NDPA 2023).",
  },
  {
    question: "Which administrative playbooks are currently live in Zed Nav?",
    answer:
      "Zed Nav currently provides complete, field-tested playbooks for: Nigerian Standard e-Passport (Fresh & Renewal), NYSC Mobilization & Call-Up, NIMC NIN Registration & BVN Harmonization, and CAC Business Name Incorporation. Each guide includes verified statutory fees, required document audits, and real-time capture center wait times.",
  },
  {
    question: "How do university students and alumni benefit from Zed?",
    answer:
      "Campus Hubs provide partitioned spaces for Nigerian universities (including UNILAG, OAU, UI, FUTA, and ABU) featuring an Academic Vault with past examination questions, departmental lecture notes, and verified SIWES/IT listings, alongside 15-minute 1-on-1 Alumni Office Hours for career guidance.",
  },
  {
    question: "Is Zed official government advice?",
    answer:
      "No. Zed is an independent civic platform created by Nigerian technologists and civil contributors. We are not affiliated with, endorsed by, or representing the Nigeria Immigration Service, NYSC, NIMC, CAC, or any federal ministry. We aggregate, verify, and simplify publicly gazetted procedures into plain language.",
  },
];

const ENGINEERING_DIRECTIVES = [
  {
    icon: Wifi,
    title: "Low-Data PWA (< 1.8MB)",
    description:
      "Aggressive Service Worker caching for instant offline access to guides and checklists across 3G/4G networks (MTN, Airtel, Glo, 9mobile).",
  },
  {
    icon: Coins,
    title: "Zero-Fintech Compliance",
    description:
      "Off-chain $ZED rewards convert to Naira or discounted data bundles with direct payouts via Paystack and Flutterwave, eliminating banking license overhead.",
  },
  {
    icon: Lock,
    title: "Salted SHA-256 Privacy",
    description:
      "Raw 11-digit NINs are never written to physical disk. Salted cryptographic tokenization ensures strict NDPR and NDPA 2023 compliance.",
  },
  {
    icon: Zap,
    title: "State Machine Engine",
    description:
      "JSON-structured sequential workflows with crowdsourced wait-time tracking across state capture offices (Ikoyi, Festac, Abuja, Ibadan, Enugu, PH).",
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
      <section aria-label="Engineering Directives" className="border-y border-[#E5E5E0] py-10 bg-[#FAFAF8]/70">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center space-y-3 mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[#3ecf8e] font-semibold">
              System Directives // Version 2.0.0
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0C]">
              Engineered for Nigerian network realities.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ENGINEERING_DIRECTIVES.map((directive, idx) => {
              const Icon = directive.icon;
              return (
                <FadeIn key={directive.title} delay={idx * 0.06}>
                  <div className="h-full rounded-xl border border-[#E5E5E0] bg-white p-5 space-y-3 flex flex-col justify-between shadow-xs">
                    <div className="space-y-2.5">
                      <div className="h-9 w-9 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] flex items-center justify-center text-[#3ecf8e]">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="font-display font-bold text-base text-[#0B0B0C]">
                        {directive.title}
                      </h3>
                      <p className="font-sans text-xs text-[#57575e] leading-relaxed">
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
      <section id="how-it-works" className="scroll-mt-24">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              Module 01 // Zed Nav (Live Engine)
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]">
              Zed Nav: Clear civic playbooks.
            </h2>
            <p className="font-sans text-base text-[#57575e] leading-relaxed">
              Explore key screens, requirements, and verified statutory fees across our four core civil flows. Step-by-step guidance designed to remove the middleman.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TabbedShowcase />
          </FadeIn>
        </div>
      </section>

      {/* ── Section 4: The Zed Ecosystem Grid ───────────────────────────── */}
      <section id="ecosystem" className="scroll-mt-24">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              The Platform
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]">
              The Zed Ecosystem
            </h2>
            <p className="font-sans text-base text-[#57575e] leading-relaxed">
              Twelve integrated modules built for Nigerian youth across civic processes, practical skills, escrow freelance work, and campus communities.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES.map((mod, idx) => {
              const isLive = mod.status === "live";
              const cardHref = isLive ? mod.href! : `/modules/${mod.slug}`;
              const CardInner = (
                <div
                  className={`h-full rounded-xl border p-5 space-y-3 flex flex-col justify-between transition-all ${
                    isLive
                      ? "border-[#3ecf8e]/50 bg-white shadow-sm hover:border-[#3ecf8e] hover:shadow-md cursor-pointer"
                      : "border-[#E5E5E0] bg-white opacity-95 hover:border-[#D8D8D2]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-bold text-base text-[#0B0B0C] flex items-center gap-1.5">
                        {mod.name}
                        {isLive && <ArrowRight className="h-3.5 w-3.5 text-[#3ecf8e]" />}
                      </h3>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#3ecf8e]/30 bg-[#3ecf8e]/10 text-[#2db87d] font-mono text-[10px] font-semibold uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e] animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#E5E5E0] bg-[#F5F5F0] text-[#8a8a92] font-mono text-[10px] font-medium uppercase tracking-wider">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-[#57575e] leading-relaxed">
                      {mod.tagline}
                    </p>
                  </div>
                  {isLive && (
                    <div className="pt-2 text-xs font-semibold text-[#3ecf8e] flex items-center gap-1">
                      <span>Get started with Zed Nav</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              );

              return (
                <FadeIn key={mod.slug} delay={idx * 0.03}>
                  <Link
                    href={cardHref}
                    className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] rounded-xl"
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
      <section className="py-4 sm:py-8">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="max-w-3xl mx-auto rounded-xl border border-[#E5E5E0] bg-white p-8 sm:p-12 shadow-sm space-y-6">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              The Reality of Nigerian Youth Navigation
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] leading-snug">
              Government processes shouldn&apos;t require a middleman. Earning shouldn&apos;t require luck.
            </h2>

            <div className="font-sans text-base text-[#57575e] space-y-4 leading-relaxed">
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
      <section id="features" className="scroll-mt-24">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              Zed Architecture
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]">
              Built with purpose.
            </h2>
            <p className="font-sans text-base text-[#57575e] leading-relaxed">
              Four design principles guiding how Zed protects your time, your money, and your privacy.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar, idx) => (
              <FadeIn key={pillar.eyebrow} delay={idx * 0.06}>
                <div className="h-full rounded-xl border border-[#E5E5E0] bg-white p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8a8a92] font-medium block">
                      {pillar.eyebrow}
                    </span>
                    <h3 className="font-display text-xl font-bold text-[#0B0B0C]">
                      {pillar.title}
                    </h3>
                    <p className="font-mono text-xs text-[#3ecf8e] font-semibold">
                      {pillar.subtitle}
                    </p>
                    <p className="font-sans text-sm text-[#57575e] leading-relaxed">
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
      <section>
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <AlternatingFeatures />
        </div>
      </section>

      {/* ── Section 8: Gamified $ZED Token & Level Matrix ─────────────── */}
      <section id="token-engine" className="scroll-mt-24 py-6 sm:py-10">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              The Incentive Layer // Gamified Progression
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]">
              Earn as you grow. Proof-of-Engagement.
            </h2>
            <p className="font-sans text-base text-[#57575e] leading-relaxed">
              The $ZED Token rewards active participation, course completions, alumni mentorship, and community updates. Mining rates scale dynamically with your verified civic tier.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-xl border border-[#E5E5E0] bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E0] bg-[#FAFAF8] text-[#57575e] font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-4 px-5 font-semibold">Tier</th>
                      <th className="py-4 px-5 font-semibold">Level Name</th>
                      <th className="py-4 px-5 font-semibold">Unlock Criteria (Proof-of-Engagement)</th>
                      <th className="py-4 px-5 font-semibold">Multiplier</th>
                      <th className="py-4 px-5 font-semibold">Daily Cap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E0] text-sm">
                    {LEVEL_MATRIX.map((tier) => (
                      <tr key={tier.level} className="hover:bg-[#FAFAF8]/50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-[#8a8a92]">
                          Lvl {tier.level}
                        </td>
                        <td className="py-3.5 px-5 font-display font-bold text-[#0B0B0C] flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
                          {tier.name}
                        </td>
                        <td className="py-3.5 px-5 text-[#57575e] text-xs">
                          {tier.criteria}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#2db87d]">
                          {tier.multiplier}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-[#0B0B0C] font-semibold">
                          {tier.cap}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-[#E5E5E0] bg-[#FAFAF8]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#57575e]">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#3ecf8e]" />
                  <span>
                    <strong>Dynamic Treasury Pool:</strong> $ZED converts directly to Naira withdrawals via Paystack/Monnify or discounted mobile data bundles (MTN, Airtel, Glo, 9mobile).
                  </span>
                </div>
                <Link
                  href="/signup"
                  className="font-medium text-[#0B0B0C] hover:text-[#3ecf8e] flex items-center gap-1 shrink-0"
                >
                  <span>Start mining as Rookie</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 9: Campus, Social & Safety Network ─────────────────── */}
      <section className="py-6 sm:py-10">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              Community & Safety
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C]">
              Social connection with built-in safety.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              Designed for real-world peer connection, university academic support, and crowd-sourced transit safety.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FadeIn delay={0.05}>
              <div className="h-full rounded-xl border border-[#E5E5E0] bg-white p-6 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="h-9 w-9 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] flex items-center justify-center text-[#3ecf8e]">
                    <GraduationCap className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C]">Campus Hubs</h3>
                  <p className="font-sans text-xs text-[#57575e] leading-relaxed">
                    Dedicated university spaces (UNILAG, OAU, UI, FUTA, ABU, Covenant) featuring an Academic Vault for past exams, departmental lecture notes, and verified SIWES/IT listings.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="h-full rounded-xl border border-[#E5E5E0] bg-white p-6 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="h-9 w-9 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] flex items-center justify-center text-[#3ecf8e]">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C]">Zed Meet</h3>
                  <p className="font-sans text-xs text-[#57575e] leading-relaxed">
                    WebRTC 1-on-1 text and audio speed networking with interest tags (Tech, NYSC, Campus, Creative). Includes 1-tap blocking and verified identity safeguards.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="h-full rounded-xl border border-[#E5E5E0] bg-white p-6 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="h-9 w-9 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] flex items-center justify-center text-[#3ecf8e]">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C]">Zed Market</h3>
                  <p className="font-sans text-xs text-[#57575e] leading-relaxed">
                    Escrow-backed micro-gigs. Milestone-locked client funds are released upon approval directly to Nigerian banks or USDT wallet addresses.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="h-full rounded-xl border border-[#E5E5E0] bg-white p-6 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="h-9 w-9 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] flex items-center justify-center text-[#3ecf8e]">
                    <Radio className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0B0C]">Zed SOS</h3>
                  <p className="font-sans text-xs text-[#57575e] leading-relaxed">
                    PostGIS-powered geospatial safety reporting. Crowd-sourced real-time alerts for road hazards, police checkpoints, and transit emergencies across Nigerian cities.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a92] uppercase tracking-wider">
                  Phase 2 // Coming soon
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Section 10: Sovereign Privacy & NDPR Section ───────────────── */}
      <section className="py-6 sm:py-10">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="rounded-xl border border-[#E5E5E0] bg-white p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-8 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E5E0] bg-[#FAFAF8] text-[#57575e] font-mono text-xs uppercase tracking-wider font-medium">
                  <Lock className="h-3 w-3 text-[#3ecf8e]" />
                  <span>Sovereign Identity Protection</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0B0C]">
                  Your NIN stays yours.
                </h2>

                <div className="font-sans text-sm sm:text-base text-[#57575e] space-y-3 leading-relaxed">
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
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#0B0B0C] hover:text-[#3ecf8e] transition-colors group"
                  >
                    <span>Read our full NDPA Data Privacy Policy</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3">
                <div className="p-4 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0B0B0C]">
                    Salted SHA-256 Digest
                  </div>
                  <div className="text-xs text-[#57575e]">
                    One-way irreversible identity token
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0B0B0C]">
                    Zero Plaintext Cloud Storage
                  </div>
                  <div className="text-xs text-[#57575e]">
                    Raw NIN never written to physical disk
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-[#E5E5E0] bg-[#FAFAF8] space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#0B0B0C]">
                    NDPA 2023 Compliant
                  </div>
                  <div className="text-xs text-[#57575e]">
                    Registered and auditable data controller protocols
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 11: FAQ Accordion ─────────────────────────────────── */}
      <section id="faq" className="scroll-mt-24">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              Got Questions?
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]">
              Frequently asked questions
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e]">
              Straight answers on how Zed operates, the $ZED token, and data privacy.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="max-w-3xl mx-auto">
            <Accordion items={FAQ_ITEMS} defaultOpenIndex={0} />
          </FadeIn>
        </div>
      </section>

      {/* ── Section 12: Dark Closing CTA ─────────────────────────────── */}
      <ClosingCTA />
    </div>
  );
}
