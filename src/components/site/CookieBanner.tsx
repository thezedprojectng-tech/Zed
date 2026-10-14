"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, X } from "lucide-react";

export interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "zed_cookie_consent_v1";
export const OPEN_COOKIE_SETTINGS_EVENT = "zed:open-cookie-settings";

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
  }
}

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            essential: true,
            preferences: !!parsed.preferences,
            analytics: !!parsed.analytics,
          };
        }
      } catch {
        // fallback to defaults
      }
    }
    return {
      essential: true,
      preferences: true,
      analytics: false,
    };
  });

  useEffect(() => {
    // Check if consent has already been given
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Small timeout so banner appears naturally without layout flash
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Listen for custom event from footer or cookies page
    const handleOpenSettings = () => {
      setIsManaging(true);
      setIsOpen(true);
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    };
  }, []);

  const savePreferences = (prefs: {
    essential: boolean;
    preferences: boolean;
    analytics: boolean;
  }) => {
    const payload: CookiePreferences = {
      ...prefs,
      essential: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setIsOpen(false);
    setIsManaging(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      preferences: true,
      analytics: true,
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true,
      preferences: false,
      analytics: false,
    });
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Storage Consent"
      className="fixed bottom-5 left-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] rounded-xl border border-[#E5E5E0] dark:border-white/10 bg-[#ffffff] dark:bg-[#141416] p-5 shadow-2xl shadow-black/10 dark:shadow-black/60 text-[#0B0B0C] dark:text-[#FAFAF8] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {!isManaging ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
              <h3 className="font-display font-semibold text-sm text-[#0B0B0C] dark:text-[#FAFAF8]">
                Cookie &amp; Local Storage
              </h3>
            </div>
            <button
              type="button"
              onClick={handleRejectNonEssential}
              aria-label="Dismiss cookie notice"
              className="text-[#8a8a92] dark:text-[#6c6c74] hover:text-[#0B0B0C] dark:hover:text-[#FAFAF8] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="font-sans text-xs text-[#57575e] dark:text-[#9c9ca4] leading-relaxed">
            Zed uses cookies and client-side storage to enable offline PWA guides, preserve session security, and cache low-data resources across Nigerian networks. Zero third-party ad tracking or data sales.{" "}
            <Link
              href="/cookies"
              className="underline text-[#0B0B0C] dark:text-[#FAFAF8] hover:text-[#3ecf8e]"
            >
              Cookie Policy
            </Link>
            .
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="w-full py-2 px-3 bg-[#3ecf8e] hover:bg-[#34b77d] text-[#041f13] text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Accept all
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="flex-1 py-1.5 px-3 border border-[#E5E5E0] dark:border-white/10 text-[#0B0B0C] dark:text-[#FAFAF8] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-xs font-medium rounded-lg transition-all cursor-pointer"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => setIsManaging(true)}
                className="py-1.5 px-3 text-[#57575e] dark:text-[#9c9ca4] hover:text-[#0B0B0C] dark:hover:text-[#FAFAF8] text-xs font-medium transition-colors cursor-pointer"
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0] dark:border-white/10">
            <h3 className="font-display font-semibold text-sm text-[#0B0B0C] dark:text-[#FAFAF8]">
              Manage Storage Preferences
            </h3>
            <button
              type="button"
              onClick={() => setIsManaging(false)}
              aria-label="Back to summary"
              className="text-[#8a8a92] dark:text-[#6c6c74] hover:text-[#0B0B0C] dark:hover:text-[#FAFAF8] text-xs cursor-pointer"
            >
              Back
            </button>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {/* Essential Category */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8]/50 dark:bg-white/[0.02]">
              <div>
                <div className="font-medium text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Essential Storage
                </div>
                <p className="text-[#57575e] dark:text-[#9c9ca4] mt-0.5">
                  Service Worker caches &amp; session tokens. Always active.
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#3ecf8e] font-semibold uppercase pt-0.5">
                Required
              </span>
            </div>

            {/* Offline Preferences */}
            <label className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8]/50 dark:bg-white/[0.02] cursor-pointer">
              <div>
                <div className="font-medium text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Guide &amp; Checklist Bookmarks
                </div>
                <p className="text-[#57575e] dark:text-[#9c9ca4] mt-0.5">
                  Saves your checklist milestones locally in IndexedDB.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.preferences}
                onChange={(e) =>
                  setPreferences({ ...preferences, preferences: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-[#3ecf8e] rounded cursor-pointer"
              />
            </label>

            {/* Performance Analytics */}
            <label className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-[#E5E5E0] dark:border-white/10 bg-[#FAFAF8]/50 dark:bg-white/[0.02] cursor-pointer">
              <div>
                <div className="font-medium text-[#0B0B0C] dark:text-[#FAFAF8]">
                  Telemetry &amp; Diagnostics
                </div>
                <p className="text-[#57575e] dark:text-[#9c9ca4] mt-0.5">
                  Anonymous performance metrics to improve page load times.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences({ ...preferences, analytics: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-[#3ecf8e] rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveCustom}
              className="flex-1 py-2 px-3 bg-[#3ecf8e] hover:bg-[#34b77d] text-[#041f13] text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={() => setIsManaging(false)}
              className="py-2 px-3 border border-[#E5E5E0] dark:border-white/10 text-[#0B0B0C] dark:text-[#FAFAF8] text-xs font-medium rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
