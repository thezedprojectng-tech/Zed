"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { openCookieSettings } from "./CookieBanner";
import { useSiteAuth } from "./useSiteAuth";
import { SOCIAL_LINKS, XIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from "@/data/socials";

const PRODUCT_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/nav", label: "Zed Nav" },
  { href: "/mining", label: "$ZED Mining" },
  { href: "/skill", label: "Skill Academy" },
  { href: "/market", label: "Zed Market" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About Zed" },
  { href: "/fund", label: "Fund Your Idea" },
  { href: "/whitepaper", label: "White Paper" },
  { href: "/careers", label: "Careers" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

const SUPPORT_LINKS = [
  { href: "/contact", label: "Contact Us" },
  { href: "/#faq", label: "Frequently Asked Questions" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "mailto:thezedprojectng@gmail.com", label: "Email Support", external: true },
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
    <footer className="w-full bg-[#FAFAF8] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-[#FAFAF8] transition-colors border-t border-[#EAEAE6] dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-12">
        {/* ── Watermark & Copyright Section (Inspired by reference screenshot) ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 sm:pb-14 border-b border-[#EAEAE6] dark:border-white/10">
          {/* Giant Faint Brand Watermark */}
          <div
            aria-hidden="true"
            className="font-display text-[72px] sm:text-[110px] md:text-[140px] lg:text-[170px] font-black tracking-tighter text-[#0B0B0C]/[0.06] dark:text-white/[0.05] select-none leading-none -mb-3 sm:-mb-6 pointer-events-none"
          >
            Zed
          </div>

          {/* Right-aligned metadata */}
          <div className="sm:text-right space-y-1 text-xs sm:text-sm text-[#707078] dark:text-zinc-400 font-sans">
            <p className="font-medium text-[#0B0B0C] dark:text-zinc-200">
              All Rights Reserved.
            </p>
            <p>
              &copy; {new Date().getFullYear()} The Zed Project. Built for Nigerian Youth.
            </p>
          </div>
        </div>

        {/* ── 4-Column Footer Navigation ─────────────────────────────────── */}
        <div className="pt-12 sm:pt-16 grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-8">
          {/* Column 1: Brand & Socials (md:col-span-4) */}
          <div className="md:col-span-4 space-y-5">
            <Link
              href="/"
              className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-sm py-1"
              aria-label="The Zed Project Home"
            >
              {/* Logo: dark image for light background, light image for dark background */}
              <Image
                src="/icons/zed-logo-full-dark.png"
                alt="The Zed Project"
                width={150}
                height={75}
                className="h-8 w-auto object-contain dark:hidden"
              />
              <Image
                src="/icons/zed-logo-full-light.png"
                alt="The Zed Project"
                width={150}
                height={75}
                className="h-8 w-auto object-contain hidden dark:block"
              />
            </Link>

            <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400 leading-relaxed max-w-sm">
              Zed is the all-in-one digital operating system for Nigerian youth.
              Demystifying civil procedures, unlocking practical digital skills,
              and empowering the next generation.
            </p>

            {/* Circular Social Buttons (styled matching screenshot) */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={SOCIAL_LINKS.x.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LINKS.x.ariaLabel}
                className="h-9 w-9 rounded-full bg-[#0B0B0C] dark:bg-white/10 text-white flex items-center justify-center hover:bg-[#2E82F7] dark:hover:bg-[#2E82F7] transition-colors shadow-xs"
              >
                <XIcon className="h-4 w-4" />
              </a>
              <a
                href={SOCIAL_LINKS.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LINKS.instagram.ariaLabel}
                className="h-9 w-9 rounded-full bg-[#0B0B0C] dark:bg-white/10 text-white flex items-center justify-center hover:bg-[#2E82F7] dark:hover:bg-[#2E82F7] transition-colors shadow-xs"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href={SOCIAL_LINKS.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LINKS.whatsapp.ariaLabel}
                className="h-9 w-9 rounded-full bg-[#0B0B0C] dark:bg-white/10 text-white flex items-center justify-center hover:bg-[#2E82F7] dark:hover:bg-[#2E82F7] transition-colors shadow-xs"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
              <a
                href={SOCIAL_LINKS.tiktok.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LINKS.tiktok.ariaLabel}
                className="h-9 w-9 rounded-full bg-[#0B0B0C] dark:bg-white/10 text-white flex items-center justify-center hover:bg-[#2E82F7] dark:hover:bg-[#2E82F7] transition-colors shadow-xs"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Product (md:col-span-3) */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-[#0B0B0C] dark:text-[#FAFAF8]">
              Product
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#57575e] dark:text-zinc-400 hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated ? (
                <li>
                  <Link
                    href="/home"
                    className="text-[#2E82F7] font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>Dashboard</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    href="/signup"
                    className="text-[#2E82F7] font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>Get Started</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Company (md:col-span-3) */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-[#0B0B0C] dark:text-[#FAFAF8]">
              Company
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#57575e] dark:text-zinc-400 hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support (md:col-span-2) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-[#0B0B0C] dark:text-[#FAFAF8]">
              Support
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      className="text-[#57575e] dark:text-zinc-400 hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-[#57575e] dark:text-zinc-400 hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="text-[#57575e] dark:text-zinc-400 hover:text-[#2E82F7] dark:hover:text-[#2E82F7] transition-colors text-left cursor-pointer"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Sub-footer disclaimer & Scroll-to-top ──────────────────────── */}
        <div className="mt-12 sm:mt-16 pt-6 border-t border-[#EAEAE6] dark:border-white/10 flex justify-center gap-4">
          <p className="font-sans text-[11px] text-[#707078] dark:text-zinc-500 leading-relaxed">
            Zed is an independent platform and is not affiliated with, endorsed by, or representing any Nigerian government agency.
          </p>

         
        </div>
      </div>
    </footer>
  );
}
