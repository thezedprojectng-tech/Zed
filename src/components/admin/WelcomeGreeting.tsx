"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface GreetingItem {
  phrase: string;
  language: string;
  lang: string;
  dir?: "ltr" | "rtl";
}

const GREETINGS: GreetingItem[] = [
  { phrase: "Welcome", language: "English", lang: "en" },
  { phrase: "Káàbọ̀", language: "Yoruba", lang: "yo" },
  { phrase: "Nnọọ", language: "Igbo", lang: "ig" },
  { phrase: "Barka da zuwa", language: "Hausa", lang: "ha" },
  { phrase: "Welcome oh", language: "Pidgin", lang: "pcm" },
  { phrase: "Bienvenue", language: "French", lang: "fr" },
  { phrase: "Karibu", language: "Swahili", lang: "sw" },
  { phrase: "Bienvenido", language: "Spanish", lang: "es" },
  { phrase: "Bem-vindo", language: "Portuguese", lang: "pt" },
  { phrase: "مرحبًا", language: "Arabic", lang: "ar", dir: "rtl" },
];

export function WelcomeGreeting() {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isTabHidden, setIsTabHidden] = React.useState(false);

  // 1. Detect document visibility change
  React.useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // 2. Rotate every 3.5s unless paused, tab is hidden, or reduced motion
  React.useEffect(() => {
    if (shouldReduceMotion || isPaused || isTabHidden) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [shouldReduceMotion, isPaused, isTabHidden]);

  // When prefers-reduced-motion is true, always stick to English
  const current = shouldReduceMotion ? GREETINGS[0] : GREETINGS[index];

  return (
    <div
      role="region"
      aria-label="Welcome, Admin"
      aria-live="off"
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative flex items-center select-none outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md py-0.5 px-1 min-w-[140px] sm:min-w-[240px]"
    >
      <div className="flex items-center overflow-hidden">
        {shouldReduceMotion ? (
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-sm font-semibold tracking-tight text-foreground font-sans">
              Welcome, Admin
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.phrase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-baseline gap-1.5 leading-none"
            >
              <span className="text-sm font-semibold tracking-tight text-foreground font-sans">
                <span
                  lang={current.lang}
                  dir={current.dir || "ltr"}
                  className="inline-block"
                >
                  {current.phrase}
                </span>
                <span>, Admin</span>
              </span>

              <span className="hidden sm:inline-block text-[11px] font-normal text-muted-foreground/75 tracking-normal">
                ({current.language})
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

