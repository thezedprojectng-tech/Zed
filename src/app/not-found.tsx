import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { NotFoundHero } from "@/components/site/NotFoundHero";
import { ClosingCTA } from "@/components/site/ClosingCTA";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { CookieBanner } from "@/components/site/CookieBanner";
import { SmoothScrollProvider } from "@/components/site/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "Page Not Found (404) | Zed",
  description: "The page you are looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-dvh bg-[#FAFAF8] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-[#FAFAF8] flex flex-col font-sans selection:bg-[#2E82F7] selection:text-[#0a2a5e]">
        {/* Skip to Content for Keyboard Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0B0B0C] focus:text-[#FAFAF8] focus:border focus:border-[#2E82F7] focus:font-mono focus:text-xs uppercase tracking-wider rounded-md"
        >
          Skip to main content
        </a>

        {/* Global Marketing Site Header */}
        <SiteHeader />

        {/* Main Content Viewport */}
        <main id="main-content" className="flex-1 w-full flex flex-col pt-4">
          <NotFoundHero />
          <ClosingCTA />
        </main>

        {/* Global Marketing Site Footer */}
        <SiteFooter />

        {/* Floating Utilities */}
        <ScrollToTop />
        <CookieBanner />
      </div>
    </SmoothScrollProvider>
  );
}
