"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowUp, MapPin } from "lucide-react";
import { openCookieSettings } from "./CookieBanner";
import { useSiteAuth } from "./useSiteAuth";
import { SOCIAL_LINKS, XIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from "@/data/socials";

const PRODUCT_LINKS = [
  { href: "/#zed-nav", label: "Zed Nav" },
  { href: "/#ecosystem", label: "Ecosystem" },
  { href: "/#architecture", label: "Architecture" },
  { href: "/#token-engine", label: "$ZED Mining" },
  { href: "/fund", label: "Fund Your Idea" },
  { href: "/whitepaper", label: "White Paper" },
  { href: "/careers", label: "Careers" },
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
    <footer className="w-full bg-[#0D0D0F] text-white selection:bg-[#2E82F7] selection:text-[#0a2a5e]">

      {/* ── Top divider bar ──────────────────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Main footer body ─────────────────────────────────────────────── */}
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* ── Brand column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Brand Logo */}
            <Link
              href="/"
              className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-sm py-1"
              aria-label="The Zed Project Home"
            >
              <Image
                src="/icons/zed-logo-full-light.png"
                alt="The Zed Project"
                width={160}
                height={80}
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>

            {/* Mission statement */}
            <p className="font-sans text-sm text-[#8a8a94] leading-relaxed max-w-xs">
              The digital operating system for Nigerian Gen Z. Demystifying civil procedures, unlocking practical digital skills, escrow freelance micro-gigs, and campus communities.
            </p>

            {/* CTA */}
            {isAuthenticated ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2E82F7] hover:text-white transition-colors group"
              >
                <span>Open your dashboard</span>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2E82F7] hover:text-white transition-colors group"
              >
                <span>Create a free account</span>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            )}

            {/* Location badge */}
            <div className="inline-flex items-center gap-1.5 text-xs text-[#5a5a64] font-mono">
              <MapPin className="h-3 w-3 text-[#2E82F7]" />
              <span>Lagos, Nigeria</span>
            </div>

            {/* Social handles */}
            <div className="pt-2 space-y-2">
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[#5a5a64]">
                Join the Community
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={SOCIAL_LINKS.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.whatsapp.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[#9c9ca8] hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.x.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[#9c9ca8] hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.instagram.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[#9c9ca8] hover:text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 transition-colors"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.tiktok.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.tiktok.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[#9c9ca8] hover:text-[#ff0050] hover:border-[#ff0050]/40 hover:bg-[#ff0050]/10 transition-colors"
                >
                  <TikTokIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* ── Link columns ─────────────────────────────────────────────── */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-6 lg:pl-8">

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
                      className="font-sans text-sm text-[#2E82F7] hover:text-white transition-colors inline-flex items-center gap-1"
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

            {/* Community */}
            <div>
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#5a5a64] font-medium mb-5">
                Community
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href={SOCIAL_LINKS.whatsapp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span>WhatsApp</span>
                    <ArrowUpRight className="h-3 w-3 text-[#5a5a64] group-hover:text-white transition-colors" />
                  </a>
                </li>
                <li>
                  <a
                    href={SOCIAL_LINKS.x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span>X (Twitter)</span>
                    <ArrowUpRight className="h-3 w-3 text-[#5a5a64] group-hover:text-white transition-colors" />
                  </a>
                </li>
                <li>
                  <a
                    href={SOCIAL_LINKS.instagram.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm text-[#9c9ca8] hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span>Instagram</span>
                    <ArrowUpRight className="h-3 w-3 text-[#5a5a64] group-hover:text-white transition-colors" />
                  </a>
                </li>
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
              Zed is an independent platform and is not affiliated with or endorsed by any government agency.
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
