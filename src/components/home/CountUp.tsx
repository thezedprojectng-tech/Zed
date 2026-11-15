"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  className?: string;
}

/**
 * Lightweight count-up animation for plain integers only (streak, lessons, referrals).
 * NEVER used for currency or ZED balances.
 * Guarantees zero hydration mismatch by rendering the exact value on SSR and initial client pass.
 */
export function CountUp({ value, className }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (value <= 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 600; // 600ms
    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(ease * value));

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    setDisplayValue(0);
    const animId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <span className={className}>{mounted ? displayValue : value}</span>;
}
