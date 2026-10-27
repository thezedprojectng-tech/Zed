import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  ChevronDown,
  Activity,
  Layers,
} from "lucide-react";
import { FadeIn } from "@/components/site/FadeIn";
import { CoreFeaturesGrid } from "@/components/site/CoreFeaturesGrid";
import { HowItWorksSection } from "@/components/site/HowItWorksSection";
import { ClosingCTA } from "@/components/site/ClosingCTA";

export const metadata: Metadata = {
  title: "Features — Everything You Need for Nigerian Civic & Career Success",
  description:
    "Explore Zed's core features: smart procedural branching, client-side document auditing, real-time statutory statistics, state geography insights, and connected ecosystem tools.",
  openGraph: {
    title: "Zed Features — The Complete Civic Operating System",
    description:
      "Everything you need to navigate paperwork, learn digital skills, and unlock opportunities in Nigeria.",
    url: "https://zedproject.ng/features",
    type: "website",
  },
};

const PILL_TAGS_ROW_1 = [
  "NIS e-Passport",
  "NYSC Mobilization",
  "NIN-BVN Link",
  "CAC Business Name",
  "Data-Light PWA (<1.8MB)",
  "NIS e-Passport",
];

const PILL_TAGS_ROW_2 = [
  "36 States Covered",
  "Offline IndexedDB Sync",
  "Paystack/Flutterwave Escrow",
  "Proof-of-Engagement Rewards",
  "24/7 Campus Communities",
];

export default function FeaturesPage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start overflow-hidden">
      {/* ── Section 1: Hero & Top 3 Cards (Screenshot 1) ── */}
      <section
        aria-labelledby="features-hero-heading"
        className="w-full pt-10 sm:pt-16 pb-14 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Pill Badge */}
        <FadeIn className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EEF4FF] dark:bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20">
            <span className="h-2 w-2 rounded-full bg-[#2E82F7]" />
            <span>Product Features</span>
          </div>
        </FadeIn>

        {/* Hero Title & Subtitle */}
        <FadeIn delay={0.05} className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h1
            id="features-hero-heading"
            className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-[1.12]"
          >
            Everything you need to navigate, learn, and grow in one place
          </h1>
          <p className="font-sans text-sm sm:text-base md:text-lg text-[#57575e] dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Zed brings verified civil playbooks, client-side document auditing, data-light skill tracks, and escrow-backed gigs together into one low-data operating system.
          </p>
        </FadeIn>

        {/* 3 Showcase Cards Grid (Matching Screenshot 1) */}
        <FadeIn delay={0.1} className="w-full max-w-6xl mx-auto mb-12 sm:mb-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Time tracking breakdown */}
            <div className="bg-[#F8F9FD] dark:bg-white/[0.02] border border-[#EAECEF] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
              {/* Mockup Card */}
              <div className="bg-white dark:bg-[#141416] rounded-2xl p-4 border border-[#EAEAE6] dark:border-white/5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0B0B0C] dark:text-white">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Procedural Time</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                    <span>Last 7 Days</span>
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
                  <span>Audit &amp; Filing 2 hours</span>
                </div>

                {/* 7-Day Stacked Bar Chart */}
                <div className="h-24 flex items-end justify-between gap-2 pt-1">
                  {[
                    { day: "Mon", h1: "h-8", h2: "h-5" },
                    { day: "Tue", h1: "h-6", h2: "h-3" },
                    { day: "Wed", h1: "h-12", h2: "h-4" },
                    { day: "Thu", h1: "h-14", h2: "h-6" },
                    { day: "Fri", h1: "h-16", h2: "h-5" },
                    { day: "Sat", h1: "h-10", h2: "h-3" },
                    { day: "Sun", h1: "h-7", h2: "h-2" },
                  ].map((bar) => (
                    <div key={bar.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center gap-0.5 justify-end h-16">
                        <div className={`w-full max-w-[14px] rounded-t-sm bg-[#93C5FD] dark:bg-[#2E82F7]/40 ${bar.h2}`} />
                        <div className={`w-full max-w-[14px] rounded-sm bg-[#2E82F7] ${bar.h1}`} />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Procedural tracking breakdown
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Track requirements, verified statutory fees, and capture center appointment countdowns in one clear view.
                </p>
              </div>
            </div>

            {/* Card 2: Activity tracking & insights */}
            <div className="bg-[#F8F9FD] dark:bg-white/[0.02] border border-[#EAECEF] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
              {/* Mockup Card */}
              <div className="bg-white dark:bg-[#141416] rounded-2xl p-4 border border-[#EAEAE6] dark:border-white/5 shadow-xs space-y-2.5">
                <div className="p-3 rounded-xl bg-[#FAFBFD] dark:bg-white/5 border border-zinc-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0B0B0C] dark:text-white">
                      ₦35,000.00
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[#2E82F7] px-2 py-0.5 rounded-full">
                      Progress <ChevronDown className="h-2.5 w-2.5" />
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    NIS Standard e-Passport (Renewal)
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-blue-100 text-[#2E82F7] text-[9px] font-bold flex items-center justify-center">
                        IK
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300">Ikoyi Capture Center</span>
                    </div>
                    <span>12 Day Wait</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAFBFD] dark:bg-white/5 border border-zinc-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0B0B0C] dark:text-white">
                      0₦ (Free)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Done ✓
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    NYSC Mobilization &amp; Green Card
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center">
                        CP
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300">Call-Up Letter Parser</span>
                    </div>
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Civil activity tracking &amp; insights
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Visualize wait times and document compliance across state capture offices in Lagos, Abuja, Ibadan, Enugu, and PH.
                </p>
              </div>
            </div>

            {/* Card 3: Real-time sales statistics */}
            <div className="bg-[#F8F9FD] dark:bg-white/[0.02] border border-[#EAECEF] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
              {/* Mockup Card */}
              <div className="bg-white dark:bg-[#141416] rounded-2xl p-4 border border-[#EAEAE6] dark:border-white/5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-[#0B0B0C] dark:text-white">
                    0₦ Markup
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                    ↗ Active Playbooks
                  </span>
                </div>

                {/* SVG Line chart matching screenshot */}
                <div className="h-28 w-full pt-2">
                  <svg viewBox="0 0 240 80" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E82F7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2E82F7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 50 Q 30 70, 60 45 T 120 40 T 160 15 T 200 35 T 240 20 L 240 80 L 0 80 Z"
                      fill="url(#salesGradient)"
                    />
                    <path
                      d="M 0 50 Q 30 70, 60 45 T 120 40 T 160 15 T 200 35 T 240 20"
                      fill="none"
                      stroke="#2E82F7"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0 60 Q 40 45, 80 55 T 150 48 T 240 35"
                      fill="none"
                      stroke="#93C5FD"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  </svg>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Real-time statutory statistics
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed">
                  Monitor verified statutory fees and portal booking windows in real time with zero middleman exploitation.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 2-Row Pill Badges Strip (Matching Screenshot 1 Bottom) */}
        <FadeIn delay={0.15} className="w-full max-w-5xl mx-auto space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {PILL_TAGS_ROW_1.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {PILL_TAGS_ROW_2.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── Section 2: Blue Testimonial Spotlight Banner (Screenshot 2) ── */}
      <section className="w-full py-10 sm:py-16 bg-[#3874FF] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-white dark:bg-[#141416] rounded-3xl p-6 sm:p-10 shadow-2xl text-[#0B0B0C] dark:text-[#FAFAF8] border border-white/20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left 8 Cols: Portrait + Quote + Author */}
                <div className="lg:col-span-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Portrait photo */}
                  <div className="relative h-44 w-44 sm:h-48 sm:w-48 rounded-2xl overflow-hidden shrink-0 shadow-md">
                    <Image
                      src="/images/testimonial-user.jpg"
                      alt="Babatunde Adeleke, Software Engineer & Founder"
                      fill
                      className="object-cover object-center"
                    />
                  </div>

                  {/* Quote & details */}
                  <div className="space-y-4 text-center sm:text-left">
                    <p className="font-sans text-sm sm:text-base md:text-lg font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      &ldquo;Zed completely eliminated the touts and confusion for my NIS e-passport renewal and CAC business registration. The offline checklists worked even inside the capture center basement.&rdquo;
                    </p>
                    <div className="flex items-center justify-center sm:justify-between pt-1">
                      <div>
                        <div className="font-display font-bold text-base text-[#0B0B0C] dark:text-white">
                          Babatunde Adeleke
                        </div>
                        <div className="font-sans text-xs text-zinc-500">
                          Software Engineer &amp; Founder, Lagos
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 font-bold text-sm text-[#2E82F7]">
                        <span className="h-2 w-2 rounded-full bg-[#2E82F7]" />
                        <span>Zed Community</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 4 Cols: Vertical divider + Stats */}
                <div className="lg:col-span-4 lg:border-l lg:border-zinc-200 dark:lg:border-white/10 lg:pl-8 flex flex-row lg:flex-col justify-around lg:justify-center gap-6 text-center lg:text-left">
                  <div className="space-y-1">
                    <div className="font-display text-4xl sm:text-5xl font-black text-[#0B0B0C] dark:text-white tracking-tight">
                      99.4%
                    </div>
                    <div className="font-sans text-xs text-zinc-500 font-medium">
                      Filing Pass Rate in Last 30 Days
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-display text-4xl sm:text-5xl font-black text-[#0B0B0C] dark:text-white tracking-tight">
                      10X
                    </div>
                    <div className="font-sans text-xs text-zinc-500 font-medium">
                      Faster Turnaround
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Section 3: Alternating Features (Screenshot 5) ── */}
      <section className="w-full py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
        {/* Block 1: Smart Bureaucracy Updates */}
        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Text & CTA */}
            <div className="lg:col-span-5 space-y-5">
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
                Smart Bureaucracy Updates
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
                Zed detects new official portal updates, extracts key filing requirements, and updates your checklists automatically so you always move forward with verified information.
              </p>

              <ul className="space-y-3 pt-1">
                {[
                  "Detect NIS portal booking reopenings instantly",
                  "Parse NYSC call-up letters and camp survival checklists",
                  "Harmonize NIN and BVN records without banking queues",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    <div className="h-5 w-5 rounded-full bg-[#2E82F7] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href="/nav"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#3874FF] hover:bg-[#256fd8] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Explore Civil Playbooks</span>
                </Link>
              </div>
            </div>

            {/* Right: Visual Mockup with Photo & Floating Card */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl bg-[#F0F2FB] dark:bg-white/[0.03] border border-[#E2E6F5] dark:border-white/10 p-6 sm:p-10 shadow-xs flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* Colleague Photo */}
                <div className="relative h-56 w-44 rounded-2xl overflow-hidden shadow-md shrink-0">
                  <Image
                    src="/images/blog-students.jpg"
                    alt="Nigerian youth reviewing verified civil requirements"
                    fill
                    className="object-cover object-center"
                  />
                </div>

                {/* Floating NIS Portal Gateway Card with Indicator */}
                <div className="space-y-2 w-full max-w-xs">
                  {/* Dark Tag at top */}
                  <div className="bg-[#0B0B0C] text-white rounded-xl p-2.5 text-center shadow-lg space-y-0.5">
                    <div className="text-[10px] text-zinc-400 font-medium">New portal update detected</div>
                    <div className="text-xs font-semibold">Pull out key filing requirements</div>
                  </div>

                  {/* Down arrow */}
                  <div className="flex justify-center -my-1">
                    <span className="text-[#2E82F7] text-xs">↓</span>
                  </div>

                  {/* White card */}
                  <div className="bg-white dark:bg-[#141416] rounded-2xl p-4 border border-[#EAEAE6] dark:border-white/10 shadow-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-[#2E82F7] text-white font-bold text-xs flex items-center justify-center">
                          NIS
                        </div>
                        <div>
                          <div className="font-bold text-[#0B0B0C] dark:text-white">NIS Portal Gateway</div>
                          <div className="text-[10px] text-zinc-400">Immigration &amp; Passport</div>
                        </div>
                      </div>
                      <span className="text-zinc-400">•••</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-zinc-500">
                      <div>🌐 immigration.gov.ng</div>
                      <div>📍 Lagos Ikoyi / Festac Center</div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-100 dark:border-white/5">
                      <span>👤 Verified Flow</span>
                      <span>💬 3 Docs</span>
                      <span>⏱ 2d turnaround</span>
                    </div>

                    <button
                      type="button"
                      className="w-full py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2E82F7] text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                    >
                      Pull out key requirements
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Block 2: Geography Insights (State & Campus Insights) */}
        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Text & CTA */}
            <div className="lg:col-span-5 space-y-5">
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
                State &amp; Campus Insights
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
                See where community activity is strongest and how requirements shift across states. Track capture center wait times and identify verified resources in real time.
              </p>

              <ul className="space-y-3 pt-1">
                {[
                  "Monitor capture office wait times across 36 states",
                  "Compare university campus hub resources and past exams",
                  "Spot SIWES internship openings and PPA salary ratings",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    <div className="h-5 w-5 rounded-full bg-[#2E82F7] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#3874FF] hover:bg-[#256fd8] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Explore Campus Hubs</span>
                </Link>
              </div>
            </div>

            {/* Right: State Geography Card with Textured Backdrop */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl bg-gradient-to-b from-[#EFF3FC] to-[#E3EAFC] dark:from-white/[0.04] dark:to-white/[0.02] border border-[#DCE4F8] dark:border-white/10 p-6 sm:p-10 shadow-xs flex items-center justify-center">
                {/* Floating State Geography Card */}
                <div className="w-full max-w-md bg-white dark:bg-[#141416] rounded-2xl p-6 border border-[#EAEAE6] dark:border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#2E82F7] flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="font-display font-bold text-sm text-[#0B0B0C] dark:text-white">
                        State &amp; Center Distribution
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium border border-zinc-200 dark:border-white/10 px-2.5 py-1 rounded-lg">
                      <span>Last Quarter</span>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[11px] text-zinc-400">Active Nigerian Youths</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-extrabold text-[#0B0B0C] dark:text-white">
                        75.891
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        +12%
                      </span>
                    </div>
                  </div>

                  {/* Geography Bar Columns matching screenshot with Nigerian States */}
                  <div className="h-32 flex items-end justify-between gap-3 pt-2">
                    {[
                      { city: "Lagos", pct: "31%", height: "h-20", active: true },
                      { city: "Abuja", pct: "23%", height: "h-14", active: false },
                      { city: "Ibadan", pct: "19%", height: "h-12", active: false },
                      { city: "Enugu", pct: "18%", height: "h-10", active: false },
                      { city: "Kano", pct: "9%", height: "h-7", active: false },
                    ].map((col) => (
                      <div key={col.city} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-mono">{col.pct}</span>
                        <div className="w-full flex justify-center">
                          <div
                            className={`w-full max-w-[24px] rounded-t-md transition-all ${
                              col.active
                                ? "bg-[#2E82F7] shadow-sm"
                                : "bg-[#F1F3F9] dark:bg-white/10"
                            } ${col.height}`}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-400 truncate max-w-[48px]">
                          {col.city}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Section 4: 6 Core Features Grid (Screenshot 3, using landing page CoreFeaturesGrid) ── */}
      <div className="w-full">
        <CoreFeaturesGrid />
      </div>

      {/* ── Section 5: A Smarter Way to Manage Your Work (Screenshot 4, using landing page HowItWorksSection) ── */}
      <div className="w-full">
        <HowItWorksSection />
      </div>

      {/* ── Section 6: Closing CTA Banner ── */}
      <ClosingCTA />
    </div>
  );
}
