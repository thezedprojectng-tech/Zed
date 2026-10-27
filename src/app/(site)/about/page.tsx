import type { Metadata } from "next";
import Image from "next/image";
import {
  Lightbulb,
  Cog,
  Handshake,
  TrendingUp,
  Play,
} from "lucide-react";
import { FadeIn } from "@/components/site/FadeIn";
import { ClosingCTA } from "@/components/site/ClosingCTA";
// import TeamSection7 from "@/components/team-section-7";

export const metadata: Metadata = {
  title: "About Us — The Digital OS for Nigerian Gen Z",
  description:
    "The Zed Project is an all-in-one digital operating system for Nigerian youth, integrating civil playbooks, practical digital skills, escrow-backed freelance opportunities, and campus community hubs.",
  openGraph: {
    title: "About Zed — Empowering Nigerian Youth",
    description:
      "All-in-one digital OS for Nigerian Gen Z. Demystifying bureaucracy, unlocking practical digital skills, and empowering the next generation.",
    url: "https://zedproject.ng/about",
    type: "website",
  },
};

const VALUES_TOP = [
  {
    icon: Lightbulb,
    title: "Simplicity",
    description:
      "Civil bureaucracy should empower, not exhaust. Zed turns dense government gazettes and counter requirements into plain-language, interactive step-by-step checklists.",
  },
  {
    icon: Cog,
    title: "Automation & Offline",
    description:
      "Automated client-side document auditing for 35×45mm photos and <200KB files, cached locally in IndexedDB to function inside signal-dead government basements.",
  },
  {
    icon: Handshake,
    title: "Transparency",
    description:
      "Official statutory fees verified against agency tables with zero convenience markups, tout cuts, or hidden access fees across all 36 states.",
  },
];

export default function AboutPage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start overflow-hidden">
      {/* ── Section 1: Hero & Story Grid (Screenshot 1) ── */}
      <section
        aria-labelledby="about-hero-heading"
        className="w-full pt-10 sm:pt-16 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Pill Badge */}
        <FadeIn className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EEF4FF] dark:bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20">
            <span className="h-2 w-2 rounded-full bg-[#2E82F7]" />
            <span>About us</span>
          </div>
        </FadeIn>

        {/* Hero Title & Subtitle */}
        <FadeIn delay={0.05} className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
          <h1
            id="about-hero-heading"
            className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.12]"
          >
            Building the digital operating system for Nigerian youth, together
          </h1>
          <p className="font-sans text-sm sm:text-base md:text-lg text-[#57575e] dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            We design intelligent, low-data systems that help Nigerian Gen Z navigate civil bureaucracy, master practical digital skills, and unlock sovereign economic opportunities. Our mission is simple — remove complexity so progress becomes predictable.
          </p>
        </FadeIn>

        {/* Hero Media Grid */}
        <FadeIn delay={0.1} className="w-full max-w-7xl mx-auto mb-16 sm:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Founder in Workspace Photo with Play Button */}
            <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-[#EAEAE6] dark:border-white/10 shadow-lg min-h-[360px] sm:min-h-[440px] group">
              <Image
                src="/images/about-hero-founder.jpg"
                alt="Nigerian tech founder and builder in a collaborative workspace"
                fill
                priority
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              
            </div>

            {/* Right: 2 Stacked Feature Stat Cards */}
            <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
              {/* Card 1: 40+ hours reclaimed */}
              <div className="flex-1 rounded-3xl bg-[#FBFBFA] dark:bg-[#141416] border border-[#EAEAE6] dark:border-white/10 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
                    40+ hours reclaimed
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed mt-4">
                    The average Nigerian youth frees up nearly a full work week on every civil application by automating document audits and bypassing tout networks.
                  </p>
                </div>
              </div>

              {/* Card 2: 1.8MB PWA / 36 States (Royal Blue) */}
              <div className="flex-1 rounded-3xl bg-[#3874FF] text-white p-6 sm:p-7 shadow-lg shadow-blue-500/20 flex flex-col justify-between">
                <div>
                  <div className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
                    &lt; 1.8MB PWA
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-white/90 leading-relaxed mt-4 font-normal">
                    Engineered mobile-first with aggressive Service Worker caching for seamless offline access across MTN, Airtel, Glo, and 9mobile networks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Two-Column Story: Philosophy & From the Founders */}
        <FadeIn delay={0.15} className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 pt-4 border-t border-[#EAEAE6] dark:border-white/10">
            {/* Left: Our Philosophy */}
            <div className="space-y-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
                Our Philosophy
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                We believe great results come from great systems. Ambitious Nigerian youth don&apos;t fail because of effort — they struggle because of scattered administrative gazettes, predatory touts, unstable data connections, and fragmented opportunities.
              </p>
              <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                When civic processes are transparent and skills are verified by proof of work, young Nigerians build extraordinary leverage. When tools work offline with zero hidden fees, progress becomes unstoppable.
              </p>
            </div>

            {/* Right: From the Founders */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
                  From the Founders
                </h2>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  We started Zed after spending months battling conflicting instructions, inflated pricing, and unverified rumors across Lagos and Abuja passport and NYSC centers.
                </p>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Our goal was never just another tech platform. We built a comprehensive, zero-fintech civil operating system that combines field-tested playbooks, client-side document auditing, escrow-backed micro-gigs, and campus alumni networks—putting power back into the hands of 20M+ ambitious Nigerian youth.
                </p>
              </div>

              {/* Founder Signature */}
              <div className="pt-2 text-right">
                <div className="font-serif italic text-2xl text-[#0B0B0C] dark:text-zinc-200 font-semibold tracking-wide">
                  The Zed Project Team
                </div>
                {/* <div className="font-sans text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                  Lagos &bull; Abuja &bull; Ibadan &bull; Enugu
                </div> */}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      
      {/* ── Section 2: Core Values (Screenshot 2) ── */}
      <section
        aria-labelledby="values-heading"
        className="w-full py-16 sm:py-24 bg-[#FAFBFD] dark:bg-[#101012] border-y border-[#EAEAE6] dark:border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <FadeIn className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF4FF] dark:bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20">
              <span>Core Values</span>
            </div>
            <h2
              id="values-heading"
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.15]"
            >
              The core values that power Zed
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              At the heart of Zed is a commitment to simplicity, citizen sovereignty, and continuous execution. Every feature we build reflects the principles that empower Nigerian youth.
            </p>
          </FadeIn>

          {/* 5-Card Bento Grid */}
          <FadeIn delay={0.1} className="max-w-7xl mx-auto space-y-6">
            {/* Top Row: 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VALUES_TOP.map((val) => {
                const Icon = val.icon;
                return (
                  <div
                    key={val.title}
                    className="bg-white dark:bg-[#141416] border border-[#EAEAE6] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-[#2E82F7]/30 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#2E82F7]">
                      <Icon className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-lg font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
                        {val.title}
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                        {val.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: 1 Card + 2-Column Photo of Team Hands */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Card 4: Scalability */}
              <div className="bg-white dark:bg-[#141416] border border-[#EAEAE6] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 hover:border-[#2E82F7]/30 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#2E82F7]">
                  <TrendingUp className="h-6 w-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Scalability
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    Zed is built to scale with Nigerian youth—whether verifying your first student NIN slip or incorporating a registered CAC enterprise.
                  </p>
                </div>
              </div>

              {/* Photo of Team Hands Joined in Center */}
              <div className="md:col-span-2 relative min-h-[320px] rounded-3xl overflow-hidden border border-[#EAEAE6] dark:border-white/10 group shadow-xs">
                <Image
                  src="/images/team-hands.jpg"
                  alt="Nigerian youth and team members with hands stacked in unity"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 3: Installed Shadcn SolaceUI Team Section 7 ── */}
      {/* <div className="w-full">
        <TeamSection7 />
      </div> */}

      {/* ── Section 4: Closing CTA Banner ── */}
      <ClosingCTA />
    </div>
  );
}
