"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ShieldCheck,
  FileText,
} from "lucide-react";

const CHECKLIST_ITEMS = [
  {
    id: "nin-slip",
    title: "NIMC National Identity Slip",
    detail: "Must show full 11-digit number with standard QR code.",
  },
  {
    id: "birth-cert",
    title: "NPC Birth Certificate / Statutory Age Declaration",
    detail: "Issued by the National Population Commission.",
  },
  {
    id: "lga-letter",
    title: "Local Government Identification Letter",
    detail: "Origin certificate endorsed by your LGA chairman.",
  },
  {
    id: "passport-photos",
    title: "2× White-Background Passport Photos",
    detail: "35×45mm standard, neutral expression, no eyeglasses.",
  },
];

export function HeroMockup() {
  const shouldReduceMotion = useReducedMotion();
  const [tickedCount, setTickedCount] = useState(() => (shouldReduceMotion ? 2 : 1));
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Progressive micro-interaction: checklist ticks sequentially
  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = setInterval(() => {
      setTickedCount((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 2800);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  // Subtle 3D mouse parallax on desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 6, y: -y * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const progressVal = Math.round((tickedCount / 4) * 100);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 w-full max-w-2xl mx-auto"
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                rotateY: tilt.x,
                rotateX: tilt.y,
              }
        }
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="rounded-xl border border-[#E5E5E0] bg-white p-5 sm:p-7 shadow-xl shadow-black/[0.04] text-[#0B0B0C] relative overflow-hidden transition-colors"
      >
        {/* Mockup Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E5E5E0]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#2E82F7]/10 flex items-center justify-center text-[#2E82F7] border border-[#2E82F7]/20">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base text-[#0B0B0C]">
                  Standard e-Passport
                </h3>
                <span className="font-mono text-[11px] text-[#57575e] px-2 py-0.5 rounded-full bg-[#f4f4f0]">
                  32 Pages • 5-Yr
                </span>
              </div>
              <p className="font-mono text-xs text-[#57575e]">
                Nigeria Immigration Service • Check the official NIS fee
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#2E82F7]/10 text-[#1a4fad]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E82F7] animate-pulse" />
              Illustration
            </span>
          </div>
        </div>

        {/* Stepper Strip */}
        <div className="py-4 border-b border-[#E5E5E0]">
          <div className="flex items-center justify-between text-xs font-mono text-[#57575e] mb-2">
            <span className="font-semibold text-[#0B0B0C]">
              Step 2 of 5: Document Gathering
            </span>
            <span>29% Completed</span>
          </div>

          {/* Smooth Progress Bar */}
          <div className="h-1.5 w-full bg-[#f0f0eb] rounded-full overflow-hidden">
            <div
              style={{
                width: `${progressVal}%`,
                transition: shouldReduceMotion ? "none" : "width 900ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className="h-full bg-[#2E82F7] rounded-full"
            />
          </div>

          {/* Steps Indicator Dots */}
          <div className="grid grid-cols-5 gap-2 mt-3 text-[11px] font-mono">
            <div className="text-[#2E82F7] font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">1. Eligibility</span>
            </div>
            <div className="text-[#0B0B0C] font-bold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#2E82F7]" />
              <span className="hidden sm:inline">2. Documents</span>
            </div>
            <div className="text-[#8a8a92] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="hidden sm:inline">3. Portal Form</span>
            </div>
            <div className="text-[#8a8a92] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="hidden sm:inline">4. Biometrics</span>
            </div>
            <div className="text-[#8a8a92] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="hidden sm:inline">5. Collection</span>
            </div>
          </div>
        </div>

        {/* Live Document Checklist */}
        <div className="pt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#57575e] mb-1">
            <span>Required Filing Checklist</span>
            <span>Local verification</span>
          </div>

          {CHECKLIST_ITEMS.map((item, idx) => {
            const isTicked = idx < tickedCount;
            const isCurrent = idx === tickedCount;

            return (
              <div
                key={item.id}
                className={`flex items-start justify-between p-3 rounded-lg border transition-all duration-300 ${
                  isTicked
                    ? "border-[#2E82F7]/30 bg-[#2E82F7]/[0.03]"
                    : isCurrent
                    ? "border-[#0B0B0C]/20 bg-[#fafaf8]"
                    : "border-[#E5E5E0] bg-transparent opacity-75"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isTicked
                        ? "bg-[#2E82F7] text-[#0a2a5e]"
                        : isCurrent
                        ? "border-2 border-[#2E82F7]"
                        : "border border-[#8a8a92]"
                    }`}
                  >
                    {isTicked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-medium leading-snug transition-colors ${
                        isTicked
                          ? "text-[#0B0B0C]"
                          : isCurrent
                          ? "text-[#0B0B0C]"
                          : "text-[#57575e]"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-[#57575e] mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-[#57575e] flex-shrink-0 pt-0.5">
                  {isTicked ? (
                    <span className="text-[#1a4fad] font-semibold">Checked</span>
                  ) : isCurrent ? (
                    <span className="text-[#2E82F7] font-semibold">Next</span>
                  ) : (
                    "Pending"
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mockup Footer Notice */}
        <div className="mt-4 pt-3 border-t border-[#E5E5E0] flex items-center justify-between text-xs font-mono text-[#57575e]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2E82F7]" />
            Aligned with official NIS requirements
          </span>
          <span className="hidden sm:inline">Offline ready • 0 bytes network used</span>
        </div>
      </motion.div>
    </div>
  );
}
