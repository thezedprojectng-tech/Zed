"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;

      if (totalScroll > 0) {
        const percent = Math.min(100, Math.max(0, (currentScroll / totalScroll) * 100));
        setProgress(percent);
      }

      // Appears after scrolling 500px
      setIsVisible(currentScroll > 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // Square progress ring parameters
  const size = 44;
  const strokeWidth = 2.5;
  const padding = 4;
  const innerSize = size - padding * 2;
  const perimeter = innerSize * 4;
  const strokeDashoffset = perimeter - (progress / 100) * perimeter;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className={`fixed bottom-6 right-6 z-50 group flex items-center justify-center h-11 w-11 rounded-xl border border-[#E5E5E0] dark:border-white/10 bg-white dark:bg-[#141416] text-[#0B0B0C] dark:text-[#FAFAF8] shadow-md backdrop-blur-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] cursor-pointer ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      } hover:border-[#2E82F7] hover:bg-[#2E82F7] hover:text-white dark:hover:bg-[#2E82F7] dark:hover:text-white hover:shadow-lg hover:shadow-[#2E82F7]/20 active:scale-95`}
    >
      {/* Square SVG Progress Outline */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 44 44"
      >
        {/* Background track square */}
        <rect
          x={padding}
          y={padding}
          width={innerSize}
          height={innerSize}
          rx="9"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#E5E5E0] dark:text-white/10 group-hover:text-[#2E82F7]/20 transition-colors"
        />
        {/* Animated progress square */}
        <rect
          x={padding}
          y={padding}
          width={innerSize}
          height={innerSize}
          rx="9"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={perimeter}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-[#2E82F7] group-hover:text-white transition-all duration-100 ease-out"
          style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
        />
      </svg>

      {/* Arrow Icon */}
      <ArrowUp className="h-4 w-4 relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}