"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, ArrowRight, FileCheck, Landmark, UserCheck, Briefcase } from "lucide-react";
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
      "Avoid unofficial touts charging ₦80,000+ for a standard 32-page booklet. Zed calculates your official NIS statutory fees, verifies your photograph dimensions, and guides you through the capture appointment without surprises.",
    bullets: [
      "Exact NIS statutory fees verified monthly (₦35,000 for 32-page / 5-yr)",
      "Photo specification auditor prevents capture center desk rejection",
      "Queue mitigation timetable for high-volume passport offices in Ikoyi, Alausa & Abuja",
    ],
    mockup: {
      title: "e-Passport Renewal • 32 Pages (5 Years)",
      badge: "NIS Portal Direct",
      fee: "₦35,000 Statutory Fee",
      items: [
        { label: "Application Type", status: "Verified", detail: "Standard Adult Renewal (Existing Booklet)" },
        { label: "Document Pre-Flight", status: "Complete", detail: "4 of 4 required certificates verified locally" },
        { label: "Photo Check", status: "Passed", detail: "35×45mm • White background • 142KB" },
        { label: "Next Action", status: "Appointment", detail: "Book biometric capture date at preferred center" },
      ],
      footerNote: "Verified against Official Gazette & NIS Circular 2024",
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
      "When your BVN date of birth doesn't match your NIN, bank accounts get frozen and transactions stall. Zed lays out the exact sequence to reconcile official identity records without infinite bank branch visits.",
    bullets: [
      "Step-by-step procedure for name order and date-of-birth modifications",
      "Cross-bank BVN harmonization instructions to unlock restricted accounts",
      "Zero raw NIN storage — client-side salted SHA-256 ensures total privacy",
    ],
    mockup: {
      title: "NIMC & BVN Record Alignment",
      badge: "NDPA 2023 Compliant",
      fee: "₦15,000 NIMC Remita Fee (DOB Correction)",
      items: [
        { label: "Record Discrepancy", status: "Identified", detail: "Surname order inverted on legacy BVN registry" },
        { label: "Remita Retrieval RRR", status: "Generated", detail: "Official Treasury Single Account code for NIMC" },
        { label: "Enrolment Center", status: "Selected", detail: "NIMC State Headquarters biometric modification slot" },
        { label: "Bank Broadcast", status: "Pending", detail: "Present NIMC modification slip to bank compliance desk" },
      ],
      footerNote: "Encrypted via client-side SHA-256. Raw NIN never stored.",
    },
  },
  {
    id: "cac",
    label: "CAC",
    agency: "Corporate Affairs Commission",
    headline: "Business Name & Company Registration",
    caption:
      "Register your business or startup directly on the CAC Companies Registration Portal (CRP) without paying ₦50,000+ agent markups. Follow our verified filing playbook and receive your status report and certificate online.",
    bullets: [
      "CRP portal navigation guide without paying agent markups",
      "Standard memorandum & objective clauses for digital and service enterprises",
      "Automated JTB TIN generation checklist upon CAC certificate issuance",
    ],
    mockup: {
      title: "CAC Business Name Registration",
      badge: "CRP Online Registry",
      fee: "₦10,000 Statutory Filing Fee",
      items: [
        { label: "Name Availability", status: "Reserved", detail: "Two proposed names checked against CAC registry" },
        { label: "Principal Nature", status: "Drafted", detail: "Software development & business consultancy clauses" },
        { label: "Proprietor Details", status: "Verified", detail: "NIN identity and recognized government ID attached" },
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
      {/* Tabs Row */}
      <div className="flex items-center justify-start sm:justify-center border-b border-[#E8E8E4] overflow-x-auto no-scrollbar mb-10 sm:mb-14">
        <div className="flex space-x-2 sm:space-x-8 px-2">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`relative py-3.5 px-3 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] rounded-sm whitespace-nowrap ${
                  isActive
                    ? "text-[#0B0B0C] font-semibold"
                    : "text-[#57575e] hover:text-[#0B0B0C]"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#3ecf8e]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
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
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[#3ecf8e] font-medium mb-2">
                {activeTab.agency}
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0C] leading-tight">
                {activeTab.headline}
              </h3>
            </div>

            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              {activeTab.caption}
            </p>

            <ul className="space-y-3 pt-2">
              {activeTab.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full bg-[#3ecf8e]/10 text-[#3ecf8e] flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span className="text-sm text-[#0B0B0C] leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#0B0B0C] hover:text-[#3ecf8e] transition-colors group"
              >
                <span>Follow the {activeTab.label} guide in Zed</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Mockup */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#E8E8E4] bg-white p-5 sm:p-6 shadow-lg shadow-black/[0.05]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E8E4]">
                <div>
                  <h4 className="font-display font-semibold text-base text-[#0B0B0C]">
                    {activeTab.mockup.title}
                  </h4>
                  <p className="font-mono text-xs text-[#57575e] mt-0.5">
                    {activeTab.mockup.fee}
                  </p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#3ecf8e]/10 text-[#0e7048] font-medium">
                  {activeTab.mockup.badge}
                </span>
              </div>

              <div className="py-4 space-y-3">
                {activeTab.mockup.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] gap-1 sm:gap-4"
                  >
                    <div>
                      <div className="text-xs font-mono font-medium text-[#0B0B0C]">
                        {item.label}
                      </div>
                      <div className="text-xs text-[#57575e] mt-0.5">{item.detail}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0e7048] self-start sm:self-auto">
                      <Check className="h-3 w-3" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E8E8E4] flex items-center justify-between text-xs font-mono text-[#57575e]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#3ecf8e]" />
                  {activeTab.mockup.footerNote}
                </span>
                <span className="hidden sm:inline">Offline ready</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
