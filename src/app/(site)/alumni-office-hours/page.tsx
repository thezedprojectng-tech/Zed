import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, Sparkles } from "lucide-react";
import { getPublishedAlumniProfiles } from "@/lib/alumni-office-hours/queries";
import { AlumniDirectoryClient } from "./AlumniDirectoryClient";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Alumni Office Hours — Vetted Nigerian Graduate Mentorship | Zed",
  description:
    "Direct career advice and mentorship from experienced Nigerian university alumni. Browse vetted alumni profiles and connect directly.",
  openGraph: {
    title: "Alumni Office Hours — Vetted Nigerian Graduate Mentorship | Zed",
    description:
      "Direct career advice and mentorship from experienced Nigerian university alumni.",
    url: "https://zedproject.ng/alumni-office-hours",
    type: "website",
  },
};

export default async function AlumniOfficeHoursPage() {
  const profiles = await getPublishedAlumniProfiles();

  return (
    <main id="main-content" className="w-full flex-1">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-8">
        {/* Header section */}
        <header className="space-y-4 border-b border-border pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-medium">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Alumni Network · Mentorship Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-display">
                Alumni Office Hours
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Connect with verified Nigerian graduates sharing industry insights, resume feedback, and career guidance. Free and accessible to all students.
              </p>
            </div>

            <div className="flex items-center shrink-0 pt-2 sm:pt-0">
              <Button asChild className="rounded-lg shadow-sm gap-2">
                <Link href="/alumni-office-hours/apply">
                  <span>Apply as an Alumnus</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Directory Client */}
        <AlumniDirectoryClient initialProfiles={profiles} />
      </div>
    </main>
  );
}

