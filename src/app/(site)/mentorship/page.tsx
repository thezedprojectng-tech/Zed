import type { Metadata } from "next";
import { MentorshipForm } from "./MentorshipForm";

export const metadata: Metadata = {
  title: "Mentorship | Zed",
  description:
    "Apply for the Zed Mentorship programme. Get guidance from experienced practitioners in tech, design, data, and product.",
  openGraph: {
    title: "Mentorship | Zed",
    description:
      "Apply for the Zed Mentorship programme. Get guidance from experienced practitioners in tech, design, data, and product.",
    url: "https://zedproject.ng/mentorship",
    siteName: "Zed",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentorship | Zed",
    description:
      "Apply for the Zed Mentorship programme. Get guidance from experienced practitioners in tech, design, data, and product.",
    site: "@thezedprojectng",
  },
};

export default function MentorshipPage() {
  return (
    <main id="main-content" className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 space-y-10">
        {/* Page Header & Intro */}
        <header className="space-y-4 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
            COMMUNITY &amp; LEARNING
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Mentorship
          </h1>
          <p className="font-sans text-base sm:text-lg text-muted-foreground leading-relaxed">
            Apply to connect with practitioners who can guide your learning in software engineering, design, data, cybersecurity, or product. Applying is free. Applications are reviewed by the Zed team, and we will reach out by email if your application moves forward.
          </p>
        </header>

        {/* Application Form */}
        <section aria-labelledby="mentorship-form-heading">
          <h2 id="mentorship-form-heading" className="sr-only">
            Mentorship Application Form
          </h2>
          <MentorshipForm />
        </section>
      </div>
    </main>
  );
}

