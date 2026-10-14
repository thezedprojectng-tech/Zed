"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowUp, MapPin } from "lucide-react";
import { openCookieSettings } from "./CookieBanner";
import { useSiteAuth } from "./useSiteAuth";

const PRODUCT_LINKS = [
  { href: "/#how-it-works", label: "Zed Nav" },
  { href: "/#ecosystem", label: "Ecosystem" },
  { href: "/#features", label: "Architecture" },
  { href: "/#token-engine", label: "$ZED Mining" },
  { href: "/#faq", label: "FAQ" },
];

const GUIDES_LINKS = [
  { href: "/nav/passport", label: "Nigerian Passport" },
  { href: "/nav/nysc", label: "NYSC Mobilization" },
  { href: "/nav/nin-bvn", label: "NIN & BVN" },
  { href: "/nav/cac", label: "CAC Registration" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function SiteFooter() {
  const { isAuthenticated } = useSiteAuth();

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <footer className="w-full bg-[#0D0D0F] text-white selection:bg-[#3ecf8e] selection:text-[#041f13]">

      {/* ── Top divider bar ──────────────────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Main footer body ─────────────────────────────────────────────── */}
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* ── Brand column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Wordmark */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] rounded-sm"
            >
              <span className="font-display font-bold text-2xl tracking-tight text-white">Zed</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e]" />
            </Link>

            {/* Mission statement */}
            <p className="font-sans text-sm text-[#8a8a94] leading-relaxed max-w-xs">
              The digital operating system for Nigerian Gen Z. Demystifying civil procedures, unlocking practical digital skills, escrow freelance micro-gigs, and campus communities.
            </p>

            {/* CTA */}
            {isAuthenticated ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3ecf8e] hover:text-white transition-colors group"
              >
                <span>Open your dashboard</span>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3ecf8e] hover:text-white transition-colors group"
              >
                <span>Create a free account</span>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            )}

            {/* Location badge */}
            <div className="inline-flex items-center gap-1.5 text-xs text-[#5a5a64] font-mono">
              <MapPin className="h-3 w-3 text-[#3ecf8e]" />
              <span>Lagos, Nigeria</span>
            </div>
          </div>

          {/* ── Link columns ─────────────────────────────────────────────── */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-6 lg:pl-8">

            {/* Product */}
            <div>
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#5a5a64] font-medium mb-5">
                Product
              </h4>
              <ul className="space-y-3">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                {isAuthenticated ? (
                  <li>
                    <Link
                      href="/home"
                      className="font-sans text-sm text-[#3ecf8e] hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>Open Zed</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors">
                        Sign in
                      </Link>
                    </li>
                    <li>
                      <Link href="/signup" className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors">
                        Create account
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Guides */}
            <div>
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#5a5a64] font-medium mb-5">
                Guides
              </h4>
              <ul className="space-y-3">
                {GUIDES_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#5a5a64] font-medium mb-5">
                Legal
              </h4>
              <ul className="space-y-3">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={openCookieSettings}
                    className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Cookie settings
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div className="mt-14 pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          <div className="space-y-1.5">
            <p className="font-mono text-xs text-[#5a5a64]">
              &copy; {new Date().getFullYear()} Zed. All rights reserved.
            </p>
            <p className="font-mono text-xs text-[#3d3d46] max-w-md leading-relaxed">
              Independent civic guide. Not affiliated with, endorsed by, or operated by any government agency.
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#5a5a64] hover:text-white transition-colors group cursor-pointer flex-shrink-0"
          >
            <span>Back to top</span>
            <span className="h-7 w-7 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/25 transition-colors">
              <ArrowUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
