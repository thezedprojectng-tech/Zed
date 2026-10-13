"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress =
        scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollY / scrollHeight) * 100)) : 0;

      setProgress(currentProgress);
      setVisible(scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  // SVG circular ring values (radius = 16, stroke = 2)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top of page"
      className="fixed bottom-20 md:bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground border-hairline shadow-md backdrop-blur-md transition-all hover:bg-secondary hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <svg
        className="absolute inset-0 h-10 w-10 -rotate-90 pointer-events-none"
        viewBox="0 0 40 40"
      >
        {/* Background track */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="2"
        />
        {/* Active progress arc */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-100 ease-out"
        />
      </svg>
      <ArrowUp className="h-4 w-4 relative z-10 text-foreground" />
    </button>
  );
}
