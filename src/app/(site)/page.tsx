import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { HeroSection } from "@/components/site/HeroSection";
import { TabbedShowcase } from "@/components/site/TabbedShowcase";
import { AlternatingFeatures } from "@/components/site/AlternatingFeatures";
import { Accordion } from "@/components/site/Accordion";
import { ClosingCTA } from "@/components/site/ClosingCTA";
import { FadeIn } from "@/components/site/FadeIn";
import { MODULES } from "@/data/modules";

export const metadata: Metadata = {
  title: "Zed – One place. Every next move.",
  description:
    "Zed is a Nigerian youth platform for civic processes, skills, work and community. Explore Zed Nav for step-by-step verified passport, NYSC, NIN, and CAC playbooks.",
  openGraph: {
    title: "Zed – One place. Every next move.",
    description:
      "Zed is a Nigerian youth platform for civic processes, skills, work and community. Explore Zed Nav for step-by-step verified passport, NYSC, NIN, and CAC playbooks.",
    url: "https://zedproject.ng",
    siteName: "Zed",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zed – One place. Every next move.",
    description:
      "Zed is a Nigerian youth platform for civic processes, skills, work and community.",
  },
};

const FAQ_ITEMS = [
  {
    question: "Is Zed free?",
    answer:
      "Yes, completely. All procedural guides, checklist tracking, statutory fee calculators, and offline features on Zed are 100% free for all Nigerian youth. We do not charge subscriptions, convenience markups, or hidden access fees.",
  },
  {
    question: "Is it official government advice?",
    answer:
      "No. Zed is an independent civic platform created by Nigerian technologists and civil contributors. We are not affiliated with, endorsed by, or representing the Nigeria Immigration Service, NYSC, NIMC, CAC, or any federal ministry. We aggregate, verify, and simplify publicly gazetted procedures.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Yes. Zed is engineered as an offline-first Progressive Web App. Once you visit the site, all core guides, checklists, and statutory fee tables are cached on your device. You can access them in immigration basements or rural centers with zero cellular signal.",
  },
  {
    question: "What happens to my NIN?",
    answer:
      "Zed never stores your raw 11-digit NIN. When you verify in demo mode, your NIN is sent securely over an encrypted connection, hashed with a secret salt on our server, and only the irreversible hash is saved. The raw number is never logged or stored in any database, adhering strictly to the Nigeria Data Protection Act (NDPA 2023).",
  },
  {
    question: "Which processes are covered in Zed Nav?",
    answer:
      "Zed Nav currently provides complete, tested playbooks for: Nigerian Standard e-Passport (Fresh & Renewal), NYSC Mobilization & Call-Up, NIMC NIN registration & BVN Harmonization, and CAC Business Name & Company Incorporation. Additional playbooks are added systematically.",
  },
  {
    question: "How do I report wrong information?",
    answer:
      "Every guide in Zed features a report link. When government agencies update fees, forms, or office protocols, our editorial team audits user reports against official gazettes within 24 hours. You can also reach our desk at updates@zedproject.ng.",
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

export default function HomePage() {
  return (
    <div className="w-full flex flex-col space-y-20 sm:space-y-28 lg:space-y-36 pb-0">
      {/* ── Section 2: Hero Section ───────────────────────────────────── */}
      <HeroSection />

      {/* ── Section 3: Trust Strip ────────────────────────────────────── */}
      <section className="border-y border-[#E5E5E0] py-10 bg-[#FAFAF8]/50">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center space-y-6">
            <p className="font-mono text-xs uppercase tracking-wider text-[#8a8a92]#6c6c74]">
              Guides for processes handled by
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 md:gap-20 text-[#57575e]#9c9ca4]">
              <span className="font-display font-semibold text-base sm:text-lg tracking-tight">
                Nigeria Immigration Service
              </span>
              <span className="font-display font-semibold text-base sm:text-lg tracking-tight">
                NYSC
              </span>
              <span className="font-display font-semibold text-base sm:text-lg tracking-tight">
                NIMC
              </span>
              <span className="font-display font-semibold text-base sm:text-lg tracking-tight">
                CAC
              </span>
            </div>

            <p className="font-mono text-xs text-[#8a8a92]#6c6c74] max-w-xl mx-auto pt-1">
              Zed is an independent guide and is not affiliated with any government agency.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 4: Zed Nav (Tabbed Showcase) ────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              Module 01 // Zed Nav (Live)
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]">
              Zed Nav: Clear civic playbooks.
            </h2>
            <p className="font-sans text-base text-[#57575e] leading-relaxed">
              Explore key screens, requirements, and verified statutory fees across our four core civil flows.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TabbedShowcase />
          </FadeIn>
        </div>
      </section>

      {/* ── Section 5: The Zed Ecosystem ───────────────────────────────── */}
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
              Twelve integrated modules built for Nigerian youth across civic processes, skills, work, and community. Zed Nav is live today; upcoming modules are in development.
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
                      : "border-[#E5E5E0] bg-white opacity-95"
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
                <FadeIn key={mod.slug} delay={idx * 0.04}>
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


      {/* ── Section 6: Problem / Solution Statement ───────────────────── */}
      <section className="py-8 sm:py-12">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="max-w-3xl mx-auto rounded-xl border border-[#E5E5E0] bg-[#ffffff] p-8 sm:p-12 shadow-sm space-y-6">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              The Reality of Nigerian Bureaucracy
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] leading-snug">
              Government processes shouldn&apos;t need a guide who knows a guide.
            </h2>

            <div className="font-sans text-base text-[#57575e] space-y-4 leading-relaxed">
              <p>
                Every year, millions of young Nigerians lose days of work and study to conflicting requirements, broken portals, and middleman markups. Official instructions sit scattered across outdated gazettes, unofficial blogs, and handwritten posters on counter windows. A simple renewal turns into multiple wasted trips.
              </p>
              <p>
                Zed Nav eliminates the guesswork. We audit official statutory fees, test procedural requirements against actual field conditions, and lay out the exact sequential path from your first document to final collection—right on your device, with zero middlemen.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 7: Four Pillars Grid ──────────────────────────────── */}
      <section id="features" className="scroll-mt-24">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              Zed Nav Architecture
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]">
              Built with purpose.
            </h2>
            <p className="font-sans text-base text-[#57575e] leading-relaxed">
              Four design principles guiding how Zed Nav protects your time, your money, and your privacy.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar, idx) => (
              <FadeIn key={idx} delay={idx * 0.08}>
                <div className="h-full rounded-xl border border-[#E5E5E0] bg-[#ffffff] p-6 space-y-4 flex flex-col justify-between">
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

      {/* ── Section 8: Alternating Feature Blocks with Mockups ────────── */}
      <section>
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <AlternatingFeatures />
        </div>
      </section>

      {/* ── Section 9: Privacy Section ─────────────────────────────────── */}
      <section className="py-6 sm:py-10">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="rounded-xl border border-[#E5E5E0] bg-[#ffffff] p-8 sm:p-12 shadow-sm">
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
                    Zed transmits your NIN over an encrypted connection and hashes it with a secret salt on our server. Under no circumstances is your raw 11-digit NIN written, logged, or persisted in our databases. Verification is a demo mock, and only the hash is retained.
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

      {/* ── Section 10: FAQ Accordion ─────────────────────────────────── */}
      <section id="faq" className="scroll-mt-24">
        <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
            <div className="font-mono text-xs uppercase tracking-wider text-[#3ecf8e] font-semibold">
              Got Questions?
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0B0B0C]#FAFAF8]">
              Frequently asked questions
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e]#9c9ca4]">
              Straight answers on how Zed operates, data privacy, and government affiliation.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="max-w-3xl mx-auto">
            <Accordion items={FAQ_ITEMS} defaultOpenIndex={0} />
          </FadeIn>
        </div>
      </section>

      {/* ── Section 11: Dark Closing CTA ─────────────────────────────── */}
      <ClosingCTA />
    </div>
  );
}

