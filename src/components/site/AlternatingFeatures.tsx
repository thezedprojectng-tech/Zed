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
  RefreshCw,
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>Adaptive Procedural Flow</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
              Know exactly what&apos;s next.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Official portals treat everyone like a brand-new applicant, forcing people into unnecessary counter lines and redundant affidavits. Zed asks two questions and branches your exact path.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Renewing an expired booklet? We skip the state of origin affidavit and guarantor signing, cutting your required filing documents by more than half.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors group"
              >
                <span>Try the interactive guide builder</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#2E82F7]" />
              </Link>
            </div>
          </div>

          {/* Mockup Right */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl sm:rounded-3xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 sm:p-7 shadow-xl shadow-blue-500/5">
              {/* Branch Selector Switch */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#EAEAE6] dark:border-white/8">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#2E82F7]" />
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Filing Path:
                  </span>
                </div>

                <div className="inline-flex p-1 rounded-full bg-[#EFEFEA] dark:bg-white/5 border border-[#E5E5E0] dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPassportBranch("renewal")}
                    className={`px-3.5 py-1 text-xs font-mono font-medium rounded-full transition-all cursor-pointer ${
                      passportBranch === "renewal"
                        ? "bg-white dark:bg-[#202024] text-[#0B0B0C] dark:text-white shadow-xs font-semibold"
                        : "text-[#57575e] dark:text-zinc-400 hover:text-[#0B0B0C] dark:hover:text-white"
                    }`}
                  >
                    Standard Renewal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassportBranch("fresh")}
                    className={`px-3.5 py-1 text-xs font-mono font-medium rounded-full transition-all cursor-pointer ${
                      passportBranch === "fresh"
                        ? "bg-white dark:bg-[#202024] text-[#0B0B0C] dark:text-white shadow-xs font-semibold"
                        : "text-[#57575e] dark:text-zinc-400 hover:text-[#0B0B0C] dark:hover:text-white"
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
                  <div className="flex items-center justify-between text-xs font-mono text-[#57575e] dark:text-zinc-400">
                    <span>
                      {passportBranch === "renewal"
                        ? "3 required documents • Estimated time: 2 weeks"
                        : "6 required documents • Estimated time: 4-6 weeks"}
                    </span>
                    <span className="text-[#2E82F7] font-semibold">Check official NIS fee</span>
                  </div>

                  <div className="space-y-2.5">
                    {passportBranch === "renewal" ? (
                      <>
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#2E82F7]" />
                            <span className="text-sm font-medium text-[#0B0B0C] dark:text-zinc-200">
                              Previous Expired Passport Booklet
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Ready</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#2E82F7]" />
                            <span className="text-sm font-medium text-[#0B0B0C] dark:text-zinc-200">
                              National Identity Number (NIN) Slip
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Matched</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#2E82F7]" />
                            <span className="text-sm font-medium text-[#0B0B0C] dark:text-zinc-200">
                              35×45mm Passport Photograph
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Audited</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-dashed border-[#E5E5E0] dark:border-white/10 text-xs text-[#57575e] dark:text-zinc-400 font-mono">
                          ✓ Bypassed: Guarantor Form &amp; State of Origin Certificate (Not required for renewal)
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#2E82F7]" />
                            <span className="text-sm font-medium text-[#0B0B0C] dark:text-zinc-200">
                              Local Government Certificate of Origin
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Stamped</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#2E82F7]" />
                            <span className="text-sm font-medium text-[#0B0B0C] dark:text-zinc-200">
                              NPC Birth Certificate or Age Declaration
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#2E82F7]" />
                            <span className="text-sm font-medium text-[#0B0B0C] dark:text-zinc-200">
                              Guarantor&apos;s Form + High Court Attestation
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Sworn</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]">
                          <div className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-[#2E82F7]" />
                            <span className="text-sm font-medium text-[#0B0B0C] dark:text-zinc-200">
                              Guarantor&apos;s Valid National ID Copy
                            </span>
                          </div>
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Attached</span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="pt-3 border-t border-[#EAEAE6] dark:border-white/8 flex items-center justify-between text-xs font-mono text-[#57575e] dark:text-zinc-400">
                <span>Deterministic rules engine</span>
                <span className="text-[#2E82F7] font-semibold">Zero guesswork</span>
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
            <div className="rounded-2xl sm:rounded-3xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 sm:p-7 shadow-xl shadow-blue-500/5">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE6] dark:border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-base sm:text-lg text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Client-Side Document Auditor
                    </h4>
                    <p className="font-mono text-xs text-[#57575e] dark:text-zinc-400">
                      Pre-submission technical validation
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReAudit}
                  aria-label="Re-run document auditor"
                  className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-full border border-[#D8D8D2] dark:border-white/10 text-[#57575e] dark:text-zinc-300 hover:text-[#0B0B0C] dark:hover:text-white hover:bg-[#F5F5F0] dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${auditing ? "animate-spin text-[#2E82F7]" : ""}`} />
                  <span>Re-audit</span>
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="p-3.5 rounded-xl border border-[#EAEAE6] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#17171a] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Passport Photo (35×45mm standard)
                    </div>
                    <div className="text-xs text-[#57575e] dark:text-zinc-400 mt-0.5">
                      142KB &bull; 820×1054px &bull; White background (RGB 255, 255, 255)
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    Passed
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#EAEAE6] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#17171a] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      Maximum File Size Check (&lt; 200KB limit)
                    </div>
                    <div className="text-xs text-[#57575e] dark:text-zinc-400 mt-0.5">
                      142KB conforms to NIS portal strict 200KB upload ceiling
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    Passed
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#EAEAE6] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#17171a] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                      NIN Identity Slip Format
                    </div>
                    <div className="text-xs text-[#57575e] dark:text-zinc-400 mt-0.5">
                      11-digit numerical length and formatting validated
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                    Passed
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAEAE6] dark:border-white/8 flex items-center gap-1.5 text-xs font-mono text-[#57575e] dark:text-zinc-400">
                <ShieldCheck className="h-3.5 w-3.5 text-[#2E82F7]" />
                Zero cloud storage: files analyzed in temporary memory
              </div>
            </div>
          </div>

          {/* Text Right */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>Pre-Flight Document Validation</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
              Every document, checked before you leave home.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              The number one reason capture officers turn applicants away is an oversized photo file, missing LGA stamp, or a mismatch in name order between NIN and passport slip.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Zed inspects your image pixel dimensions, tests byte limits against strict 200KB government server thresholds, and confirms your name sequence before you travel to the center.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors group"
              >
                <span>Audit your documents in Zed</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#2E82F7]" />
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D8D8D2] dark:border-white/10 bg-white dark:bg-[#141416] text-[#2E82F7] text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7]" />
              <span>Resilient Local-First Architecture</span>
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] leading-tight">
              Works when your network doesn&apos;t.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Immigration basement capture rooms, CAC queue halls, and rural NYSC orientation camps are notorious cellular dead zones. Standard web applications freeze or crash when you lose connectivity.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#57575e] dark:text-zinc-400 leading-relaxed">
              Zed is built offline-first as an installable Progressive Web App. All guides, verified fee tables, and procedural checklists remain cached on your device.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B0B0C] dark:text-white hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors group"
              >
                <span>Get started with offline playbooks</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#2E82F7]" />
              </Link>
            </div>
          </div>

          {/* Mockup Right */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl sm:rounded-3xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#141416] p-6 sm:p-7 shadow-xl shadow-blue-500/5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#EAEAE6] dark:border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#2E82F7]/10 text-[#2E82F7] flex items-center justify-center">
                    {isOffline ? (
                      <WifiOff className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Wifi className="h-5 w-5 text-[#2E82F7]" />
                    )}
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
                    Network Simulation:
                  </span>
                </div>

                <div className="inline-flex p-1 rounded-full bg-[#EFEFEA] dark:bg-white/5 border border-[#E5E5E0] dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsOffline(false)}
                    className={`px-3.5 py-1 text-xs font-mono font-medium rounded-full transition-all cursor-pointer ${
                      !isOffline
                        ? "bg-white dark:bg-[#202024] text-[#0B0B0C] dark:text-white shadow-xs font-semibold"
                        : "text-[#57575e] dark:text-zinc-400 hover:text-[#0B0B0C] dark:hover:text-white"
                    }`}
                  >
                    Online Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOffline(true)}
                    className={`px-3.5 py-1 text-xs font-mono font-medium rounded-full transition-all cursor-pointer ${
                      isOffline
                        ? "bg-white dark:bg-[#202024] text-[#0B0B0C] dark:text-white shadow-xs font-semibold"
                        : "text-[#57575e] dark:text-zinc-400 hover:text-[#0B0B0C] dark:hover:text-white"
                    }`}
                  >
                    Simulate Offline (0-Bar)
                  </button>
                </div>
              </div>

              <div className="py-5 space-y-4">
                <div
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isOffline
                      ? "border-amber-500/30 bg-amber-500/[0.05]"
                      : "border-[#2E82F7]/25 bg-[#2E82F7]/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8] flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOffline ? "bg-amber-500" : "bg-[#2E82F7] animate-pulse"
                        }`}
                      />
                      {isOffline ? "Offline Mode (Service Worker Active)" : "Online Mode (Illustration)"}
                    </span>
                    <span className="font-mono text-xs text-[#57575e] dark:text-zinc-400">
                      {isOffline ? "Offline ready" : "Connected"}
                    </span>
                  </div>

                  <p className="text-xs text-[#57575e] dark:text-zinc-400 leading-relaxed">
                    {isOffline
                      ? "All procedural milestones, document checklists, and statutory fee calculations remain completely readable and responsive from your device's IndexedDB storage."
                      : "Verified checklist updates and guidelines synced locally to your device in the background."}
                  </p>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#EAEAE6] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#17171a]">
                    <span className="text-[#0B0B0C] dark:text-zinc-200">Passport Renewal Checklist Cache</span>
                    <span className="text-[#2E82F7] font-semibold">Ready locally</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#EAEAE6] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#17171a]">
                    <span className="text-[#0B0B0C] dark:text-zinc-200">Official Statutory Fee Table</span>
                    <span className="text-[#2E82F7] font-semibold">Ready locally</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[#EAEAE6] dark:border-white/6 bg-[#FAFAF8] dark:bg-[#17171a]">
                    <span className="text-[#0B0B0C] dark:text-zinc-200">Document Auditor Engine</span>
                    <span className="text-[#2E82F7] font-semibold">Runs in WebWorker</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAEAE6] dark:border-white/8 flex items-center justify-between text-xs font-mono text-[#57575e] dark:text-zinc-400">
                <span>Progressive Web App</span>
                <span className="text-[#2E82F7] font-semibold">Installable on iOS &amp; Android</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
