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

  // Circular progress ring parameters
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className={`fixed bottom-6 right-6 z-50 group flex items-center justify-center h-12 w-12 rounded-full border border-border/80 bg-card/90 backdrop-blur-md text-foreground shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      } hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-2xl hover:scale-105 active:scale-95`}
    >
      {/* SVG Progress Ring */}
      <svg
        className="absolute inset-0 h-full w-full -rotate-90 p-1 pointer-events-none"
        viewBox="0 0 44 44"
      >
        {/* Background Track Circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted/40 group-hover:text-primary-foreground/20 transition-colors"
        />
        {/* Animated Progress Indicator Circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary group-hover:text-primary-foreground transition-all duration-100 ease-out"
        />
      </svg>

      {/* Arrow Icon */}
      <ArrowUp className="h-4 w-4 relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}