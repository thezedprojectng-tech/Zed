"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, ShieldCheck, FileText, ChevronRight, Clock, AlertCircle } from "lucide-react";

const CHECKLIST_ITEMS = [
  { id: 1, title: "National Identity Number (NIN) Slip", detail: "NIMC validated • Name order confirmed" },
  { id: 2, title: "Birth Certificate / Age Declaration", detail: "National Population Commission copy" },
  { id: 3, title: "Local Government Certificate of Origin", detail: "LGA stamped • State of origin matched" },
  { id: 4, title: "Passport Photographs (35×45mm)", detail: "White background • Neutral expression" },
  { id: 5, title: "Proof of Address (Utility Bill)", detail: "Dated within last 90 days" },
];

export function HeroMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  // Mouse tilt on desktop
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 6, y: -y * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Live checklist ticking sequential state
  const [tickedCount, setTickedCount] = useState(0);
  const [progressVal, setProgressVal] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    // Animate progress bar to 29%
    const progressTimer = setTimeout(() => {
      setProgressVal(29);
    }, 200);

    // Stagger ticks
    const t1 = setTimeout(() => setTickedCount(1), 400);
    const t2 = setTimeout(() => setTickedCount(2), 800);
    const t3 = setTimeout(() => setTickedCount(3), 1200);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isInView]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full max-w-2xl mx-auto lg:max-w-none perspective-1000"
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : {
                rotateY: tilt.x,
                rotateX: tilt.y,
              }
        }
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="rounded-xl border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] p-5 sm:p-7 shadow-xl shadow-black/[0.04] dark:shadow-black/40 text-[#0B0B0C] dark:text-[#FAFAF8] relative overflow-hidden transition-colors"
      >
        {/* Mockup Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E5E5E0] dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#3ecf8e]/10 dark:bg-[#3ecf8e]/15 flex items-center justify-center text-[#3ecf8e] border border-[#3ecf8e]/20">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Standard e-Passport
                </h3>
                <span className="font-mono text-[11px] text-[#57575e] dark:text-[#9c9ca4] px-2 py-0.5 rounded-full bg-[#f4f4f0] dark:bg-white/[0.06]">
                  32 Pages • 5-Yr
                </span>
              </div>
              <p className="font-mono text-xs text-[#57575e] dark:text-[#9c9ca4]">
                Nigeria Immigration Service • Statutory fee: ₦35,000
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#3ecf8e]/10 text-[#0e7048] dark:text-[#3ecf8e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e] animate-pulse" />
              Verified Process
            </span>
          </div>
        </div>

        {/* Stepper Strip */}
        <div className="py-4 border-b border-[#E5E5E0] dark:border-white/10">
          <div className="flex items-center justify-between text-xs font-mono text-[#57575e] dark:text-[#9c9ca4] mb-2">
            <span className="font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
              Step 2 of 5: Document Gathering
            </span>
            <span>29% Completed</span>
          </div>

          {/* Smooth Progress Bar */}
          <div className="h-1.5 w-full bg-[#f0f0eb] dark:bg-white/[0.07] rounded-full overflow-hidden">
            <div
              style={{
                width: `${progressVal}%`,
                transition: shouldReduceMotion ? "none" : "width 900ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className="h-full bg-[#3ecf8e] rounded-full"
            />
          </div>

          {/* Steps Indicator Dots */}
          <div className="grid grid-cols-5 gap-2 mt-3 text-[11px] font-mono">
            <div className="text-[#3ecf8e] font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">1. Eligibility</span>
            </div>
            <div className="text-[#0B0B0C] dark:text-[#FAFAF8] font-bold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
              <span className="hidden sm:inline">2. Documents</span>
            </div>
            <div className="text-[#8a8a92] dark:text-[#6c6c74] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="hidden sm:inline">3. Portal Form</span>
            </div>
            <div className="text-[#8a8a92] dark:text-[#6c6c74] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="hidden sm:inline">4. Biometrics</span>
            </div>
            <div className="text-[#8a8a92] dark:text-[#6c6c74] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="hidden sm:inline">5. Collection</span>
            </div>
          </div>
        </div>

        {/* Live Document Checklist */}
        <div className="pt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#57575e] dark:text-[#9c9ca4] mb-1">
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
                    ? "border-[#3ecf8e]/30 bg-[#3ecf8e]/[0.03] dark:bg-[#3ecf8e]/[0.05]"
                    : isCurrent
                    ? "border-[#0B0B0C]/20 dark:border-white/20 bg-[#fafaf8] dark:bg-white/[0.02]"
                    : "border-[#E5E5E0] dark:border-white/10 bg-transparent opacity-75"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isTicked
                        ? "bg-[#3ecf8e] text-[#041f13]"
                        : isCurrent
                        ? "border-2 border-[#3ecf8e]"
                        : "border border-[#8a8a92] dark:border-[#6c6c74]"
                    }`}
                  >
                    {isTicked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-medium leading-snug transition-colors ${
                        isTicked
                          ? "text-[#0B0B0C] dark:text-[#FAFAF8]"
                          : isCurrent
                          ? "text-[#0B0B0C] dark:text-[#FAFAF8]"
                          : "text-[#57575e] dark:text-[#9c9ca4]"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-[#57575e] dark:text-[#9c9ca4] mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-[#57575e] dark:text-[#9c9ca4] flex-shrink-0 pt-0.5">
                  {isTicked ? (
                    <span className="text-[#0e7048] dark:text-[#3ecf8e] font-semibold">Checked</span>
                  ) : isCurrent ? (
                    <span className="text-[#3ecf8e] font-semibold">Next</span>
                  ) : (
                    "Pending"
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mockup Footer Notice */}
        <div className="mt-4 pt-3 border-t border-[#E5E5E0] dark:border-white/10 flex items-center justify-between text-xs font-mono text-[#57575e] dark:text-[#9c9ca4]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#3ecf8e]" />
            Audited against NIS Official Circular
          </span>
          <span className="hidden sm:inline">Offline ready • 0 bytes network used</span>
        </div>
      </motion.div>
    </div>
  );
}
