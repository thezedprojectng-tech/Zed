import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { CookieBanner } from "@/components/site/CookieBanner";
import { SmoothScrollProvider } from "@/components/site/SmoothScrollProvider";

export const metadata: Metadata = {
  title: {
    default: "Zed – Nigerian paperwork, made simple",
    template: "%s | Zed",
  },
  description:
    "Step-by-step guides for your passport, NYSC, NIN and BVN, and business registration. Track your progress, check your documents, and keep going offline.",
  openGraph: {
    title: "Zed – Nigerian paperwork, made simple",
    description:
      "Step-by-step guides for your passport, NYSC, NIN and BVN, and business registration. Track your progress, check your documents, and keep going offline.",
    url: "https://zedproject.ng",
    siteName: "Zed",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zed – Nigerian paperwork, made simple",
    description:
      "Step-by-step guides for your passport, NYSC, NIN and BVN, and business registration.",
    site: "@thezedprojectng",
    creator: "@thezedprojectng",
  },
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScrollProvider>
      <div className="min-h-dvh bg-[#FAFAF8] text-[#0B0B0C] flex flex-col font-sans selection:bg-[#2E82F7] selection:text-[#0a2a5e]">
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
        <main id="main-content" className="flex-1 w-full flex flex-col">
          {children}
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

