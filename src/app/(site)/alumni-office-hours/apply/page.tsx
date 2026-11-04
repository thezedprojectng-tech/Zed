import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, GraduationCap, ShieldCheck, HeartHandshake } from "lucide-react";
import { AlumniApplyForm } from "./AlumniApplyForm";

export const metadata: Metadata = {
  title: "Apply to Host Alumni Office Hours | Zed",
  description:
    "Volunteer to mentor Nigerian university students. Share your career journey, answer questions, and help the next generation of graduates.",
  openGraph: {
    title: "Apply to Host Alumni Office Hours | Zed",
    description:
      "Volunteer to mentor Nigerian university students. Share your career journey and help undergraduates succeed.",
    url: "https://zedproject.ng/alumni-office-hours/apply",
  },
};

export default function AlumniApplyPage() {
  return (
    <main id="main-content" className="w-full flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-8">
        {/* Navigation */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/alumni-office-hours"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Alumni Directory</span>
          </Link>
        </nav>

        {/* Page Header */}
        <header className="space-y-3 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-medium">
            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Alumni Volunteer Application</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-display">
            Host Alumni Office Hours
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Give back to students and young graduates navigating their early careers. Applications are reviewed by the Zed team before appearing in the directory.
          </p>
        </header>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <HeartHandshake className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Free &amp; Flexible</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              You define how much time you give—even 1 hour a month makes a massive difference for an eager student.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span>Vetted &amp; Safe</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Your email address is kept private. Students connect with you directly through your verified LinkedIn or X profile.
            </p>
          </div>
        </div>

        {/* Application Form */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <AlumniApplyForm />
        </div>
      </div>
    </main>
  );
}

