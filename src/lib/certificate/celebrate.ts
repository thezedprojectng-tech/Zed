import confetti from "canvas-confetti";

const STORAGE_PREFIX = "zed-cert-celebrated";
const FALLBACK_BRAND_COLORS = ["#14b8a6", "#f59e0b", "#8b5cf6", "#10b981"];

export type CelebrationMoment = "eligible" | "issued";

function getStorageKey(trackId: string, moment: CelebrationMoment): string {
  return `${STORAGE_PREFIX}:${trackId}:${moment}`;
}

export function hasSeenCelebration(
  trackId: string,
  moment: CelebrationMoment
): boolean {
  try {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(getStorageKey(trackId, moment)) === "1";
  } catch {
    return false;
  }
}

export function markCelebrationSeen(
  trackId: string,
  moment: CelebrationMoment
): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getStorageKey(trackId, moment), "1");
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function prefersReducedMotion(): boolean {
  try {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function getBrandConfettiColors(): string[] {
  try {
    if (typeof window === "undefined") return FALLBACK_BRAND_COLORS;
    const styles = getComputedStyle(document.documentElement);
    const tokens = [
      styles.getPropertyValue("--data-mining").trim(),
      styles.getPropertyValue("--data-flows").trim(),
      styles.getPropertyValue("--data-signups").trim(),
      styles.getPropertyValue("--data-verified").trim(),
    ].filter(Boolean);
    return tokens.length === 4 ? tokens : FALLBACK_BRAND_COLORS;
  } catch {
    return FALLBACK_BRAND_COLORS;
  }
}

/**
 * Fires a ~2 second brand-colored confetti burst unless prefers-reduced-motion is active.
 * Returns a cleanup function to stop the animation early on unmount.
 */
export function fireCelebrationConfetti(): () => void {
  if (prefersReducedMotion()) {
    return () => {};
  }

  const colors = getBrandConfettiColors();
  const durationMs = 2000;
  const end = Date.now() + durationMs;
  let rafId = 0;
  let cancelled = false;

  const frame = () => {
    if (cancelled) return;
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      rafId = window.requestAnimationFrame(frame);
    }
  };

  rafId = window.requestAnimationFrame(frame);

  return () => {
    cancelled = true;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  };
}

export function getWhatsAppShareUrl(
  courseTitle: string,
  verifyUrl: string
): string {
  const message = `I just earned my ${courseTitle} certificate on Zed! Verify it here: ${verifyUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
