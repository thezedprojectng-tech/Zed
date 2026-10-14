"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AccordionItemData {
  id?: string;
  question: string;
  answer: string | React.ReactNode;
}

interface AccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
  defaultOpenIndex?: number;
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIndex,
}: AccordionProps) {
  const baseId = useId();
  const [openIndices, setOpenIndices] = useState<number[]>(
    defaultOpenIndex !== undefined ? [defaultOpenIndex] : []
  );

  const toggleItem = (idx: number) => {
    if (allowMultiple) {
      if (openIndices.includes(idx)) {
        setOpenIndices(openIndices.filter((i) => i !== idx));
      } else {
        setOpenIndices([...openIndices, idx]);
      }
    } else {
      if (openIndices.includes(idx)) {
        setOpenIndices([]);
      } else {
        setOpenIndices([idx]);
      }
    }
  };

  return (
    <div className="divide-y divide-[#E8E8E4] border-y border-[#E8E8E4]">
      {items.map((item, idx) => {
        const isOpen = openIndices.includes(idx);
        const headerId = `${baseId}-header-${idx}`;
        const panelId = `${baseId}-panel-${idx}`;

        return (
          <div key={idx} className="group">
            <button
              id={headerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleItem(idx)}
              className="w-full py-5 sm:py-6 text-left flex items-center justify-between gap-4 transition-colors hover:text-[#2E82F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-sm cursor-pointer"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <span className="font-mono text-xs text-[#A0A09A] font-medium select-none">
                  0{idx + 1}
                </span>
                <span className="font-display text-base sm:text-lg font-semibold tracking-tight text-[#0B0B0C] group-hover:text-[#2E82F7] transition-colors">
                  {item.question}
                </span>
              </div>

              <div
                className={`flex-shrink-0 h-7 w-7 rounded-full border border-[#E8E8E4] flex items-center justify-center text-[#57575e] transition-all duration-200 ${
                  isOpen ? "rotate-180 bg-[#2E82F7]/10 text-[#1a4fad] border-[#2E82F7]/30" : "bg-transparent"
                }`}
                aria-hidden="true"
              >
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 pl-8 sm:pl-12 font-sans text-sm sm:text-base text-[#57575e] leading-relaxed max-w-3xl">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
