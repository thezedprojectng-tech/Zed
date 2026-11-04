import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  GraduationCap,
  Briefcase,
  ExternalLink,
  ChevronLeft,
  ShieldAlert,
  Clock,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { getPublishedAlumniProfileById } from "@/lib/alumni-office-hours/queries";
import { DISCLAIMER_TEXT } from "@/lib/alumni-office-hours/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublishedAlumniProfileById(id);

  if (!profile) {
    return {
      title: "Alumni Profile Not Found | Zed",
    };
  }

  return {
    title: `${profile.display_name} — Alumni Office Hours | Zed`,
    description: `${profile.occupation} · Class of ${profile.graduation_year} from ${profile.institution}. Career advice on ${profile.field}.`,
    openGraph: {
      title: `${profile.display_name} — Alumni Office Hours | Zed`,
      description: `${profile.occupation} · ${profile.institution}`,
      url: `https://zedproject.ng/alumni-office-hours/${profile.id}`,
    },
  };
}

export default async function AlumniProfileDetailPage({ params }: ProfilePageProps) {
  const { id } = await params;
  const profile = await getPublishedAlumniProfileById(id);

  if (!profile) {
    notFound();
  }

  const isLinkedIn = profile.contact_url.includes("linkedin.com");
  const isX = profile.contact_url.includes("x.com") || profile.contact_url.includes("twitter.com");
  const contactLabel = isLinkedIn
    ? "Contact on LinkedIn"
    : isX
      ? "Contact on X"
      : "Contact Alumni";

  return (
    <main id="main-content" className="w-full flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-8">
        {/* Back navigation */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/alumni-office-hours"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Alumni Directory</span>
          </Link>
        </nav>

        {/* Safety Notice Banner */}
        <aside
          aria-label="Mentorship Safety Notice"
          className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 sm:p-5 text-card-foreground backdrop-blur-xs flex items-start gap-3.5"
        >
          <ShieldAlert
            className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
            <p className="font-semibold text-foreground">Important Safety Notice</p>
            <p>{DISCLAIMER_TEXT}</p>
          </div>
        </aside>

        {/* Main Profile Card */}
        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-8 shadow-xs">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-border pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal">
                  {profile.field}
                </Badge>
                <Badge variant="secondary" className="text-xs font-normal">
                  Class of {profile.graduation_year}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground font-display">
                {profile.display_name}
              </h1>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground/90">
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span>{profile.occupation}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span>{profile.institution}</span>
                </p>
              </div>
            </div>

            {/* Direct Contact Button */}
            <div className="shrink-0 pt-2 sm:pt-0">
              <Button asChild size="lg" className="w-full sm:w-auto shadow-sm gap-2">
                <a
                  href={profile.contact_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  <span>{contactLabel}</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </header>

          {/* Bio Section */}
          <section aria-labelledby="bio-heading" className="space-y-3">
            <h2 id="bio-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              About the Alumnus
            </h2>
            <div className="text-sm sm:text-base text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
              {profile.bio}
            </div>
          </section>

          {/* Topics Section */}
          <section aria-labelledby="topics-heading" className="space-y-3 border-t border-border pt-6">
            <h2 id="topics-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Topics &amp; Guidance Offered</span>
            </h2>
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 sm:p-5 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {profile.topics}
            </div>
          </section>

          {/* Availability Section */}
          <section aria-labelledby="availability-heading" className="space-y-3 border-t border-border pt-6">
            <h2 id="availability-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Availability &amp; Format</span>
            </h2>
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 sm:p-5 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {profile.availability}
            </div>
          </section>

          {/* Contact External Notice */}
          <footer className="border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Conversations occur on external networks ({isLinkedIn ? "LinkedIn" : "X"}). Keep discussions respectful and educational.
            </p>
            <Button asChild variant="outline" className="gap-2 shrink-0">
              <a
                href={profile.contact_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <span>{contactLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </Button>
          </footer>
        </article>
      </div>
    </main>
  );
}

