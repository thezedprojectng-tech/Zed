"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FlowTab {
  id: string;
  label: string;
  agency: string;
  headline: string;
  caption: string;
  bullets: string[];
  mockup: {
    title: string;
    badge: string;
    fee: string;
    items: { label: string; status: string; detail: string }[];
    footerNote: string;
  };
}

const TABS: FlowTab[] = [
  {
    id: "passport",
    label: "Passport",
    agency: "Nigeria Immigration Service",
    headline: "Standard & express e-passport renewal",
    caption:
      "Avoid unofficial touts charging inflated markups for a standard booklet. Zed helps you check the official NIS fee, verifies your photograph dimensions, and guides you through the capture appointment without surprises.",
    bullets: [
      "Check the official NIS fee on the immigration portal before payment",
      "Photo specification auditor prevents capture center desk rejection",
      "Queue mitigation timetable for high-volume passport offices in Ikoyi, Alausa & Abuja",
    ],
    mockup: {
      title: "e-Passport Renewal • 32 Pages (5 Years)",
      badge: "NIS Portal Direct",
      fee: "Check the official NIS fee",
      items: [
        { label: "Application Type", status: "Verified", detail: "Standard Adult Renewal (Existing Booklet)" },
        { label: "Document Pre-Flight", status: "Complete", detail: "4 of 4 required certificates verified locally" },
        { label: "Photo Check", status: "Passed", detail: "35×45mm • White background • 142KB" },
        { label: "Next Action", status: "Appointment", detail: "Book biometric capture date at preferred center" },
      ],
      footerNote: "Aligned with official NIS published guidance",
    },
  },
  {
    id: "nysc",
    label: "NYSC",
    agency: "National Youth Service Corps",
    headline: "Mobilization & Call-Up Letter clearance",
    caption:
      "From verifying your matriculation details on the Senate List to printing your Green Card and clearing camp registration, Zed gives Nigerian graduates a clear timeline from graduation to orientation camp.",
    bullets: [
      "Senate list verification tracker by institution and matric number",
      "Call-up letter & Green Card validation checklist",
      "Mandatory orientation camp kit list and medical fitness certificate specs",
    ],
    mockup: {
      title: "NYSC Mobilization • Batch A / Stream 1",
      badge: "Senate List Verified",
      fee: "₦3,000 Portal Fee (Optional Call-Up Delivery)",
      items: [
        { label: "Senate List Verification", status: "Confirmed", detail: "Matric number matched with university senate list" },
        { label: "Medical Certificate", status: "Audited", detail: "Government Hospital fitness test & blood group verified" },
        { label: "Green Card Printout", status: "Ready", detail: "Slip signed and laminated for camp registration" },
        { label: "Deployment Center", status: "Tracked", detail: "Orientation camp address & transit guide" },
      ],
      footerNote: "Direct synchronization with NYSC Portal mobilization timetable",
    },
  },
  {
    id: "nin-bvn",
    label: "NIN & BVN",
    agency: "NIMC & Central Bank of Nigeria",
    headline: "Identity synchronization & record harmonization",
    caption:
      "Conflicting date of birth, misspelled surname, or mismatched phone number between your BVN and National Identity Number? Zed maps the exact modification procedures across licensed NIMC enrollment partners.",
    bullets: [
      "Date of birth and surname rectification documentation checklist",
      "NIMC approved self-service modification portal fee schedules",
      "Bank BVN integration guidelines preventing account freeze restrictions",
    ],
    mockup: {
      title: "NIN Modification & BVN Harmonization",
      badge: "NIMC Verified Schema",
      fee: "Official Statutory Modification Fees",
      items: [
        { label: "Field Identification", status: "Selected", detail: "Date of Birth & Surname order harmonization" },
        { label: "Required Supporting Doc", status: "Verified", detail: "Attestation letter & NPC birth certificate scan" },
        { label: "Enrolment Center", status: "Mapped", detail: "Designated NIMC center appointment scheduled" },
        { label: "Bank Notification Slip", status: "Prepared", detail: "NIMC update slip generated for commercial bank submission" },
      ],
      footerNote: "Cryptographic hash security: your NIN is never stored in plaintext",
    },
  },
  {
    id: "cac",
    label: "CAC Business",
    agency: "Corporate Affairs Commission",
    headline: "Business Name & Enterprise incorporation",
    caption:
      "Register your business or startup independently. Reserve your business name with the Corporate Affairs Commission, verify non-restricted industry classifications, and download your verified Certificate of Incorporation.",
    bullets: [
      "Real-time name search availability verification tips",
      "Standard nature of business classification selection without legal consultant fees",
      "Post-incorporation Tax Identification Number (TIN) extraction guide",
    ],
    mockup: {
      title: "CAC Business Name Registration",
      badge: "Self-Service Filing",
      fee: "₦10,000 Official Statutory Filing Fee",
      items: [
        { label: "Name Availability Search", status: "Reserved", detail: "Business Name approved by CAC registrar" },
        { label: "Proprietor Details", status: "Entered", detail: "ID document & verified residential address" },
        { label: "Statutory Fee Remita", status: "Audited", detail: "Exact ₦10,000 statutory payment without agent surcharge" },
        { label: "Tax Identification", status: "Linked", detail: "Joint Tax Board TIN generated upon registration" },
      ],
      footerNote: "Direct self-service filing without accredited agent surcharges",
    },
  },
];

export function TabbedShowcase() {
  const [activeTabId, setActiveTabId] = useState("passport");
  const activeTab = TABS.find((t) => t.id === activeTabId) || TABS[0];

  return (
    <div className="w-full">
      {/* Modern Rounded-Full Pill Tabs Bar */}
      <div className="flex justify-center mb-10 sm:mb-14 overflow-x-auto no-scrollbar px-2">
        <div className="inline-flex p-1.5 rounded-full border border-[#E5E5E0] dark:border-white/10 bg-[#EFEFEA]/80 dark:bg-[#161619] backdrop-blur-md shadow-xs">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`relative px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] ${
                  isActive
                    ? "text-[#0B0B0C] dark:text-white"
                    : "text-[#57575e] dark:text-zinc-400 hover:text-[#0B0B0C] dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="tabbed-showcase-pill"
                    className="absolute inset-0 rounded-full bg-white dark:bg-[#202024] shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
        >
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
                <span>{activeTab.agency}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
                {activeTab.headline}
              </h3>
            </div>

            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              {activeTab.caption}
            </p>

            <ul className="space-y-3 pt-2">
              {activeTab.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span className="text-sm text-[#0B0B0C] dark:text-zinc-200 leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors group"
              >
                <span>Follow the {activeTab.label} guide in Zed</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#2E82F7]" />
              </Link>
            </div>
          </div>

          {/* Right Column: Mockup Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl sm:rounded-3xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-5 sm:p-7 shadow-xl shadow-blue-500/5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAEAE6] dark:border-white/8">
                <div>
                  <h4 className="font-display font-semibold text-base sm:text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">
                    {activeTab.mockup.title}
                  </h4>
                  <p className="font-mono text-xs text-[#57575e] dark:text-zinc-400 mt-0.5">
                    {activeTab.mockup.fee}
                  </p>
                </div>
                <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20 font-medium">
                  {activeTab.mockup.badge}
                </span>
              </div>

              <div className="py-4 space-y-3">
                {activeTab.mockup.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[#EAEAE6] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#17171a] gap-1 sm:gap-4"
                  >
                    <div>
                      <div className="text-xs font-mono font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                        {item.label}
                      </div>
                      <div className="text-xs text-[#57575e] dark:text-zinc-400 mt-0.5">{item.detail}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full self-start sm:self-auto">
                      <Check className="h-3 w-3" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#EAEAE6] dark:border-white/8 flex items-center justify-between text-xs font-mono text-[#57575e] dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2E82F7]" />
                  {activeTab.mockup.footerNote}
                </span>
                <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-semibold">Offline ready</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
