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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Page Header & Intro */}
        <header className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-primary">
            Community and learning
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Mentorship
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Apply to connect with practitioners who can guide your learning in software engineering, design, data, cybersecurity, or product. Applying is free. Applications are reviewed by the Zed team, and we will reach out by email if your application moves forward.
          </p>
        </header>

        {/* Application Form */}
        <section aria-labelledby="mentorship-form-heading">
          <h2 id="mentorship-form-heading" className="sr-only">
            Mentorship application form
          </h2>
          <MentorshipForm />
        </section>
      </div>
    </main>
  );
}

