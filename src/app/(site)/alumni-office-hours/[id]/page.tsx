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
  BookOpen,
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
      : "Contact alumni";

  return (
    <main id="main-content" className="w-full flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Back navigation */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/alumni-office-hours"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to alumni directory</span>
          </Link>
        </nav>

        {/* Safety Notice Banner */}
        <aside
          aria-label="Mentorship safety notice"
          className="rounded-lg border border-border border-l-2 border-l-[var(--data-flows)] bg-card p-4 text-card-foreground flex items-start gap-3"
        >
          <ShieldAlert
            className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1 text-xs text-muted-foreground leading-relaxed font-sans">
            <p className="font-semibold text-foreground">Important safety notice</p>
            <p>{DISCLAIMER_TEXT}</p>
          </div>
        </aside>

        {/* Main Profile Card */}
        <article className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-6 shadow-2xs">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 border-b border-border pb-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal rounded-md">
                  {profile.field}
                </Badge>
                <Badge variant="secondary" className="text-xs font-normal rounded-md">
                  Class of {profile.graduation_year}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {profile.display_name}
              </h1>

              <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground">
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
              <Button asChild size="default" className="w-full sm:w-auto shadow-xs gap-2 rounded-lg text-xs sm:text-sm">
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
          <section aria-labelledby="bio-heading" className="space-y-2">
            <h2 id="bio-heading" className="text-xs font-semibold text-muted-foreground">
              About the alumnus
            </h2>
            <div className="text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
              {profile.bio}
            </div>
          </section>

          {/* Topics Section */}
          <section aria-labelledby="topics-heading" className="space-y-2 border-t border-border pt-5">
            <h2 id="topics-heading" className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Topics &amp; guidance offered</span>
            </h2>
            <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {profile.topics}
            </div>
          </section>

          {/* Availability Section */}
          <section aria-labelledby="availability-heading" className="space-y-2 border-t border-border pt-5">
            <h2 id="availability-heading" className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Availability &amp; format</span>
            </h2>
            <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {profile.availability}
            </div>
          </section>

          {/* Contact External Notice */}
          <footer className="border-t border-border pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Conversations occur on external networks ({isLinkedIn ? "LinkedIn" : "X"}). Keep discussions respectful and educational.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2 shrink-0 rounded-lg text-xs">
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

