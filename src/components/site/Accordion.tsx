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

/**
 * Accordion styled as individual rounded cards with smooth expand/collapse,
 * matching the 2-column FAQ reference design.
 */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIndex = 0,
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
    <div className="space-y-3 sm:space-y-3.5">
      {items.map((item, idx) => {
        const isOpen = openIndices.includes(idx);
        const headerId = `${baseId}-header-${idx}`;
        const panelId = `${baseId}-panel-${idx}`;

        return (
          <div
            key={idx}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              isOpen
                ? "border-[#2E82F7]/40 dark:border-[#2E82F7]/50 bg-white dark:bg-[#141416] shadow-xs"
                : "border-[#EAEAE6] dark:border-white/8 bg-white/90 dark:bg-[#141416]/70 hover:border-[#D8D8D2] dark:hover:border-white/15"
            }`}
          >
            <button
              id={headerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleItem(idx)}
              className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-2xl"
            >
              <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8] pr-2">
                {item.question}
              </span>

              <div
                className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[#57575e] dark:text-zinc-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-[#2E82F7]" : ""
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
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed border-t border-[#F0F0EC] dark:border-white/5 pt-3.5">
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
