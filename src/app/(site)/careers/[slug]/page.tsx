import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Flame,
  Calendar,
  Briefcase,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { CAREERS_WHATSAPP_DISPLAY, type JobLocation } from "@/data/careers";
import { buildApplyUrl } from "@/lib/careers/helpers";
import { getPublishedRoles, getRoleBySlug } from "@/lib/careers/queries";
import { WhatsAppIcon } from "@/data/socials";

export const revalidate = 60;

const locationVariant: Record<JobLocation, string> = {
  Remote:
    "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  Hybrid:
    "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  "On-site":
    "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const publishedRoles = await getPublishedRoles();
  return publishedRoles.map((job) => ({
    slug: job.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getRoleBySlug(slug);

  if (!job) {
    return {
      title: "Role Not Found | Zed Careers",
      description: "The requested job opening could not be found.",
    };
  }

  return {
    title: `${job.title} — Careers at Zed`,
    description: job.summary,
    openGraph: {
      title: `${job.title} | Careers at Zed`,
      description: job.summary,
      url: `https://zedproject.ng/careers/${job.slug}`,
      type: "website",
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getRoleBySlug(slug);

  if (!job) {
    notFound();
  }

  const applyUrl = buildApplyUrl(job);

  // Safe ISO date display
  const formattedDate = (() => {
    try {
      const date = new Date(job.postedAt);
      if (isNaN(date.getTime())) return job.postedAt;
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch {
      return job.postedAt;
    }
  })();

  return (
    <div className="w-full flex-1 py-8 sm:py-16 px-4 sm:px-6 lg:px-8 pb-28 sm:pb-16">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Navigation Breadcrumb / Back Link */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <ArrowLeft className="size-4 motion-reduce:transform-none transition-transform group-hover:-translate-x-1" />
            <span>Back to all open roles</span>
          </Link>
        </nav>

        {/* Role Header */}
        <header className="space-y-4 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Briefcase className="size-3" />
              {job.department}
            </span>

            {job.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                <Flame className="size-2.5" />
                Hot
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            {job.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {job.summary}
          </p>

          {/* Badges / Metadata pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${locationVariant[job.location]}`}
            >
              <MapPin className="size-3" />
              <span>{job.location}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" />
              <span>{job.type}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Calendar className="size-3" />
              <span>Posted {formattedDate}</span>
            </span>
          </div>
        </header>

        {/* Detail Content Sections */}
        <div className="space-y-10">
          {/* About the role */}
          <section aria-labelledby="about-heading" className="space-y-4">
            <h2 id="about-heading" className="text-xl sm:text-2xl font-bold text-foreground">
              About the role
            </h2>
            <div className="space-y-3 text-sm sm:text-base text-foreground/90 leading-relaxed">
              {job.about.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* Responsibilities */}
          <section aria-labelledby="responsibilities-heading" className="space-y-4">
            <h2
              id="responsibilities-heading"
              className="text-xl sm:text-2xl font-bold text-foreground"
            >
              Responsibilities
            </h2>
            <ul className="space-y-2.5 text-sm sm:text-base text-foreground/90">
              {job.responsibilities.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Requirements */}
          <section aria-labelledby="requirements-heading" className="space-y-4">
            <h2
              id="requirements-heading"
              className="text-xl sm:text-2xl font-bold text-foreground"
            >
              Requirements
            </h2>
            <ul className="space-y-2.5 text-sm sm:text-base text-foreground/90">
              {job.requirements.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Nice to have (only rendered if present) */}
          {job.niceToHave && job.niceToHave.length > 0 && (
            <section aria-labelledby="nicetohave-heading" className="space-y-4">
              <h2
                id="nicetohave-heading"
                className="text-xl sm:text-2xl font-bold text-foreground"
              >
                Nice to have
              </h2>
              <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                {job.niceToHave.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="inline-block size-1.5 rounded-full bg-muted-foreground/60 shrink-0 mt-2" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* How to Apply Section */}
          <section
            aria-labelledby="apply-heading"
            className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <div className="space-y-2">
              <h2 id="apply-heading" className="text-xl sm:text-2xl font-bold text-foreground">
                How to apply
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                To apply for this role, send a message to our hiring team on WhatsApp. Please include
                your full name, a brief introduction, and a link to your CV or portfolio.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Direct WhatsApp contact
              </span>
              <p className="font-mono text-base sm:text-lg font-semibold text-foreground">
                {CAREERS_WHATSAPP_DISPLAY}
              </p>
              <p className="text-xs text-muted-foreground">
                Clicking the apply button will pre-fill a message with this role&apos;s title.
              </p>
            </div>

            <div>
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white text-base font-semibold rounded-xl shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
              >
                <WhatsAppIcon className="size-5 shrink-0" />
                <span>Apply on WhatsApp</span>
                <ExternalLink className="size-4 shrink-0" />
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Mobile Bottom Bar */}
      <div
        aria-label="Mobile Application Bar"
        className="fixed bottom-0 inset-x-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-40 sm:hidden shadow-lg"
      >
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white text-base font-semibold rounded-xl shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
        >
          <WhatsAppIcon className="size-5 shrink-0" />
          <span>Apply on WhatsApp</span>
          <ExternalLink className="size-4 shrink-0" />
        </a>
      </div>
    </div>
  );
}
