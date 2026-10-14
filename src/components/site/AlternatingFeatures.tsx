"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ShieldCheck,
  Wifi,
  WifiOff,
  GitBranch,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { FadeIn } from "./FadeIn";

export function AlternatingFeatures() {
  const [passportBranch, setPassportBranch] = useState<"renewal" | "fresh">("renewal");
  const [auditing, setAuditing] = useState(false);
  const handleReAudit = () => {
    setAuditing(true);
    setTimeout(() => setAuditing(false), 600);
  };
  const [isOffline, setIsOffline] = useState(false);

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* ── Feature Block 1: Branching ─────────────────────────────────── */}
      <FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Text Left */}
          <div className="lg:col-span-5 space-y-5">
            <div className="font-mono text-xs uppercase tracking-widest text-[#3ecf8e] font-medium">
              Adaptive Procedural Flow
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] leading-tight">
              Know exactly what&apos;s next.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              Official portals treat everyone like a brand-new applicant, forcing people into unnecessary counter lines and redundant affidavits. Zed asks two questions and branches your exact path.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              Renewing an expired booklet? We skip the state of origin affidavit and guarantor signing, cutting your required filing documents by more than half.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#0B0B0C] hover:text-[#3ecf8e] transition-colors group"
              >
                <span>Try the interactive guide builder</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Mockup Right */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#E8E8E4] bg-white p-5 sm:p-7 shadow-lg shadow-black/[0.05]">
              {/* Branch Selector Switch */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E8E8E4]">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#3ecf8e]" />
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0B0B0C]">
                    Filing Path:
                  </span>
                </div>

                <div className="inline-flex p-1 rounded-lg bg-[#F5F5F0] border border-[#E8E8E4]">
                  <button
                    type="button"
                    onClick={() => setPassportBranch("renewal")}
                    className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                      passportBranch === "renewal"
                        ? "bg-white text-[#0B0B0C] shadow-sm font-semibold"
                        : "text-[#57575e] hover:text-[#0B0B0C]"
                    }`}
                  >
                    Standard Renewal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassportBranch("fresh")}
                    className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                      passportBranch === "fresh"
                        ? "bg-white text-[#0B0B0C] shadow-sm font-semibold"
                        : "text-[#57575e] hover:text-[#0B0B0C]"
                    }`}
                  >
                    Fresh Application
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={passportBranch}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="py-5 space-y-4"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#57575e]">
                    <span>
                      {passportBranch === "renewal"
                        ? "3 required documents • Estimated time: 2 weeks"
                        : "6 required documents • Estimated time: 4-6 weeks"}
                    </span>
                    <span className="text-[#3ecf8e] font-semibold">₦35,000 NIS Fee</span>
                  </div>

                  <div className="space-y-2.5">
                    {passportBranch === "renewal" ? (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#3ecf8e]" />
                            <span className="text-sm font-medium text-[#0B0B0C]">
                              Previous Expired Passport Booklet
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#0e7048]">Ready</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#3ecf8e]" />
                            <span className="text-sm font-medium text-[#0B0B0C]">
                              National Identity Number (NIN) Slip
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#0e7048]">Matched</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#3ecf8e]" />
                            <span className="text-sm font-medium text-[#0B0B0C]">
                              35×45mm Passport Photograph
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#0e7048]">Audited</span>
                        </div>
                        <div className="p-3 rounded-lg border border-dashed border-[#E8E8E4] text-xs text-[#57575e] font-mono">
                          ✓ Bypassed: Guarantor Form &amp; State of Origin Certificate (Not required for renewal)
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#3ecf8e]" />
                            <span className="text-sm font-medium text-[#0B0B0C]">
                              Local Government Certificate of Origin
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#0e7048]">Stamped</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#3ecf8e]" />
                            <span className="text-sm font-medium text-[#0B0B0C]">
                              NPC Birth Certificate or Age Declaration
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#0e7048]">Verified</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#3ecf8e]" />
                            <span className="text-sm font-medium text-[#0B0B0C]">
                              Guarantor&apos;s Form + High Court Attestation
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#0e7048]">Sworn</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#3ecf8e]" />
                            <span className="text-sm font-medium text-[#0B0B0C]">
                              Guarantor&apos;s Valid National ID Copy
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#0e7048]">Attached</span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="pt-3 border-t border-[#E8E8E4] flex items-center justify-between text-xs font-mono text-[#57575e]">
                <span>Deterministic rules engine</span>
                <span className="text-[#3ecf8e]">Zero guesswork</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Feature Block 2: Document Auditor ─────────────────────────── */}
      <FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Mockup Left */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-xl border border-[#E8E8E4] bg-white p-5 sm:p-7 shadow-lg shadow-black/[0.05]">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E4]">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="h-5 w-5 text-[#3ecf8e]" />
                  <div>
                    <h4 className="font-display font-semibold text-base text-[#0B0B0C]">
                      Client-Side Document Auditor
                    </h4>
                    <p className="font-mono text-xs text-[#57575e]">
                      Pre-submission technical validation
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReAudit}
                  aria-label="Re-run document auditor"
                  className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E8E8E4] text-[#57575e] hover:text-[#0B0B0C] hover:bg-[#F5F5F0] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${auditing ? "animate-spin text-[#3ecf8e]" : ""}`} />
                  <span>Re-audit</span>
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="p-3.5 rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-medium text-[#0B0B0C]">
                      Passport Photo (35×45mm standard)
                    </div>
                    <div className="text-xs text-[#57575e] mt-0.5">
                      142KB &bull; 820×1054px &bull; White background (RGB 255, 255, 255)
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0e7048] bg-[#3ecf8e]/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    Passed
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-medium text-[#0B0B0C]">
                      Maximum File Size Check (&lt; 200KB limit)
                    </div>
                    <div className="text-xs text-[#57575e] mt-0.5">
                      142KB conforms to NIS portal strict 200KB upload ceiling
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0e7048] bg-[#3ecf8e]/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    Passed
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-[#E8E8E4] bg-[#FAFAF8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-medium text-[#0B0B0C]">
                      NIN Identity Slip Format
                    </div>
                    <div className="text-xs text-[#57575e] mt-0.5">
                      11-digit checksum verified locally via client-side Luhn-type algorithm
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0e7048] bg-[#3ecf8e]/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    Passed
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E8E4] flex items-center gap-1.5 text-xs font-mono text-[#57575e]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#3ecf8e]" />
                Zero server upload: files analyzed 100% in local memory
              </div>
            </div>
          </div>

          {/* Text Right */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
            <div className="font-mono text-xs uppercase tracking-widest text-[#3ecf8e] font-medium">
              Pre-Flight Document Validation
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] leading-tight">
              Every document, checked before you leave home.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              The number one reason capture officers turn applicants away is an oversized photo file, missing LGA stamp, or a mismatch in name order between NIN and passport slip.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              Zed inspects your image pixel dimensions, tests byte limits against strict 200KB government server thresholds, and confirms your name sequence before you travel to the center.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#0B0B0C] hover:text-[#3ecf8e] transition-colors group"
              >
                <span>Audit your documents in Zed</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Feature Block 3: Offline Demo ─────────────────────────────── */}
      <FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Text Left */}
          <div className="lg:col-span-5 space-y-5">
            <div className="font-mono text-xs uppercase tracking-widest text-[#3ecf8e] font-medium">
              Resilient Local-First Architecture
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] leading-tight">
              Works when your network doesn&apos;t.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              Immigration basement capture rooms, CAC queue halls, and rural NYSC orientation camps are notorious cellular dead zones. Standard web applications freeze or crash when you lose connectivity.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#57575e] leading-relaxed">
              Zed is built offline-first as an installable Progressive Web App. All guides, verified fee tables, and procedural checklists remain cached on your device.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#0B0B0C] hover:text-[#3ecf8e] transition-colors group"
              >
                <span>Get started with offline playbooks</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Mockup Right */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#E8E8E4] bg-white p-5 sm:p-7 shadow-lg shadow-black/[0.05]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E8E8E4]">
                <div className="flex items-center gap-2">
                  {isOffline ? (
                    <WifiOff className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Wifi className="h-4 w-4 text-[#3ecf8e]" />
                  )}
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0B0B0C]">
                    Network Simulation:
                  </span>
                </div>

                <div className="inline-flex p-1 rounded-lg bg-[#F5F5F0] border border-[#E8E8E4]">
                  <button
                    type="button"
                    onClick={() => setIsOffline(false)}
                    className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                      !isOffline
                        ? "bg-white text-[#0B0B0C] shadow-sm font-semibold"
                        : "text-[#57575e] hover:text-[#0B0B0C]"
                    }`}
                  >
                    Online Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOffline(true)}
                    className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                      isOffline
                        ? "bg-white text-[#0B0B0C] shadow-sm font-semibold"
                        : "text-[#57575e] hover:text-[#0B0B0C]"
                    }`}
                  >
                    Simulate Offline (0-Bar)
                  </button>
                </div>
              </div>

              <div className="py-5 space-y-4">
                <div
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    isOffline
                      ? "border-amber-500/30 bg-amber-500/[0.05]"
                      : "border-[#3ecf8e]/25 bg-[#3ecf8e]/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-[#0B0B0C] flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOffline ? "bg-amber-500" : "bg-[#3ecf8e] animate-pulse"
                        }`}
                      />
                      {isOffline ? "Offline Mode (Service Worker Active)" : "Online (Lagos Edge Connected)"}
                    </span>
                    <span className="font-mono text-xs text-[#57575e]">
                      {isOffline ? "0 kbps • 0 bytes network used" : "14ms latency • Sync active"}
                    </span>
                  </div>

                  <p className="text-xs text-[#57575e] leading-relaxed">
                    {isOffline
                      ? "All procedural milestones, document checklists, and statutory fee calculations remain completely readable and responsive from your device's IndexedDB storage."
                      : "Direct connection established with live Nigerian statutory fee databases. Verified updates downloaded in background."}
                  </p>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E8E8E4]">
                    <span className="text-[#0B0B0C]">Passport Renewal Checklist Cache</span>
                    <span className="text-[#3ecf8e] font-semibold">Ready locally</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E8E8E4]">
                    <span className="text-[#0B0B0C]">Official Statutory Fee Table</span>
                    <span className="text-[#3ecf8e] font-semibold">Ready locally</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E8E8E4]">
                    <span className="text-[#0B0B0C]">Document Auditor Engine</span>
                    <span className="text-[#3ecf8e] font-semibold">Runs in WebWorker</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E8E4] flex items-center justify-between text-xs font-mono text-[#57575e]">
                <span>Progressive Web App</span>
                <span className="text-[#3ecf8e]">Installable on iOS &amp; Android</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
