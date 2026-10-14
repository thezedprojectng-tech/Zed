"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useSiteAuth } from "./useSiteAuth";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
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
          {/* Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] rounded-sm"
          >
            <span className="font-display font-bold text-2xl sm:text-[26px] tracking-tight text-[#0B0B0C]">
              Zed
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e]" />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Marketing Navigation" className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative py-1 text-sm font-medium text-[#57575e] hover:text-[#0B0B0C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] rounded-sm"
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]"
                >
                  <span>Open Zed</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-[#57575e] hover:text-[#0B0B0C] px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] rounded-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-4 py-2 bg-[#0B0B0C] hover:bg-[#1a1a1e] text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]"
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
              className="md:hidden h-9 w-9 rounded-lg border border-[#E8E8E4] flex items-center justify-center text-[#0B0B0C] hover:bg-[#f4f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] cursor-pointer transition-colors"
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
                className="py-2.5 text-base font-medium text-[#0B0B0C] hover:text-[#3ecf8e] transition-colors"
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
          </div>
        </div>
      )}
    </header>
  );
}
