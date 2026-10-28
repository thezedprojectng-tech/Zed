import type { Metadata } from "next";
import { AmbassadorForm } from "./AmbassadorForm";

export const metadata: Metadata = {
  title: "Campus Ambassadors | Zed",
  description:
    "Represent Zed on your campus and help fellow students discover tools for Nigerian paperwork, civic procedures, and digital skills.",
  openGraph: {
    title: "Campus Ambassadors | Zed",
    description:
      "Represent Zed on your campus and help fellow students discover tools for Nigerian paperwork, civic procedures, and digital skills.",
    url: "https://zedproject.ng/ambassadors",
    siteName: "Zed",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Ambassadors | Zed",
    description:
      "Represent Zed on your campus and help fellow students discover tools for Nigerian paperwork, civic procedures, and digital skills.",
    site: "@thezedprojectng",
  },
};

export default function AmbassadorsPage() {
  return (
    <main id="main-content" className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 space-y-10">
        {/* Page Header & Intro */}
        <header className="space-y-4 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
            COMMUNITY & CAMPUS
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Campus Ambassadors
          </h1>
          <p className="font-sans text-base sm:text-lg text-muted-foreground leading-relaxed">
            Represent Zed on your campus and help fellow students discover digital tools for Nigerian paperwork, civic procedures, and practical digital skills.
          </p>
        </header>

        {/* Application Form */}
        <section aria-labelledby="application-form-heading">
          <h2 id="application-form-heading" className="sr-only">
            Campus Ambassador Application Form
          </h2>
          <AmbassadorForm />
        </section>
      </div>
    </main>
  );
}

