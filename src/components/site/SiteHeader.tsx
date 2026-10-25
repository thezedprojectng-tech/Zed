"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useSiteAuth } from "./useSiteAuth";
import { SOCIAL_LINKS, XIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from "@/data/socials";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/fund", label: "Fund Your Idea" },
  { href: "/whitepaper", label: "White Paper" },
  { href: "/careers", label: "Careers" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useSiteAuth();

  // Sticky nav: hide on scroll down, show on scroll up, show border after scrolling
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setHasScrolled(currentScrollY > 16);

          if (currentScrollY > 96) {
            if (currentScrollY > lastScrollY + 5) {
              setIsScrolledDown(true);
            } else if (currentScrollY < lastScrollY - 6) {
              setIsScrolledDown(false);
            }
          } else {
            setIsScrolledDown(false);
          }
          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolledDown && !isMobileMenuOpen ? "-translate-y-full" : "translate-y-0"
      } ${
        hasScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-[0_1px_0_0_#E8E8E4]"
          : "bg-transparent "
      }`}
    >
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-sm py-1"
            aria-label="The Zed Project Home"
          >
            <Image
              src="/icons/zed-logo-full-dark.png"
              alt="The Zed Project"
              width={160}
              height={80}
              priority
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Marketing Navigation" className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative py-1 text-sm font-medium text-[#57575e] hover:text-[#0B0B0C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-sm"
              >
                <span>{link.label}</span>
                <span className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#0B0B0C] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
              </a>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center space-x-3">
            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              {isAuthenticated ? (
                <Link
                  href="/home"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
                >
                  <span>Open Zed</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-[#57575e] hover:text-[#0B0B0C] px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] rounded-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-4 py-2 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7]"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden h-9 w-9 rounded-lg border border-[#E8E8E4] flex items-center justify-center text-[#0B0B0C] hover:bg-[#f4f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] cursor-pointer transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="md:hidden bg-white border-b border-[#E8E8E4] px-5 pt-4 pb-6 space-y-5"
        >
          <nav className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 text-base font-medium text-[#0B0B0C] hover:text-[#2E82F7] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#E8E8E4] space-y-2.5">
            {isAuthenticated ? (
              <Link
                href="/home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-medium rounded-lg transition-all"
              >
                <span>Open Zed</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 border border-[#E8E8E4] text-[#0B0B0C] text-sm font-medium rounded-lg hover:bg-[#f4f4f0] transition-all"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-medium rounded-lg transition-all"
                >
                  Get started
                </Link>
              </>
            )}

            {/* Social handles in mobile menu */}
            <div className="pt-3 border-t border-[#E8E8E4] flex items-center justify-between text-xs text-[#57575e]">
              <span className="font-mono text-[11px] uppercase tracking-wider">Community</span>
              <div className="flex items-center gap-2">
                <a
                  href={SOCIAL_LINKS.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.whatsapp.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-[#E8E8E4] flex items-center justify-center text-[#57575e] hover:text-[#25D366] hover:border-[#25D366]/40 transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.x.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-[#E8E8E4] flex items-center justify-center text-[#57575e] hover:text-[#0B0B0C] hover:border-black/30 transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.instagram.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-[#E8E8E4] flex items-center justify-center text-[#57575e] hover:text-[#E4405F] hover:border-[#E4405F]/40 transition-colors"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.tiktok.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LINKS.tiktok.ariaLabel}
                  className="h-8 w-8 rounded-lg border border-[#E8E8E4] flex items-center justify-center text-[#57575e] hover:text-[#0B0B0C] hover:border-black/30 transition-colors"
                >
                  <TikTokIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
