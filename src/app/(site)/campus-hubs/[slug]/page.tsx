import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowLeft,
  FileCheck2,
  Home,
  GraduationCap,
} from "lucide-react";
import { getPublishedCampusHubBySlug } from "@/lib/campus-hubs/queries";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

interface SingleCampusHubPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SingleCampusHubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getPublishedCampusHubBySlug(slug);

  if (!hub) {
    return { title: "Campus Hub Not Found" };
  }

  const desc =
    hub.summary ||
    `Clearance checklists, hostel accommodation guides, and departmental walkthroughs for ${hub.name}.`;

  return {
    title: `${hub.name} — Campus Hub & Student Guide`,
    description: desc.slice(0, 160),
    openGraph: {
      title: `${hub.name} — Campus Hub`,
      description: desc.slice(0, 160),
      url: `https://zedproject.ng/campus-hubs/${hub.slug}`,
      type: "article",
    },
  };
}

export default async function SingleCampusHubPage({
  params,
}: SingleCampusHubPageProps) {
  const { slug } = await params;
  const hub = await getPublishedCampusHubBySlug(slug);

  if (!hub) {
    notFound();
  }

  const hasClearance = Boolean(hub.clearance_guide && hub.clearance_guide.trim().length > 0);
  const hasHostel = Boolean(hub.hostel_guide && hub.hostel_guide.trim().length > 0);
  const hasDepartments = Boolean(hub.departments_guide && hub.departments_guide.trim().length > 0);

  const reviewDate = hub.last_reviewed_at || hub.updated_at || hub.created_at;
  const formattedReviewDate = new Date(reviewDate).toLocaleDateString("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main id="main-content" className="w-full flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Back navigation */}
        <div>
          <Link
            href="/campus-hubs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#2E82F7] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Campus Directory</span>
          </Link>
        </div>

        {/* Header Card */}
        <section
          aria-labelledby="hub-heading"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="font-mono text-xs gap-1.5 px-3 py-1 border-border bg-secondary/40 text-foreground"
              >
                <MapPin className="h-3.5 w-3.5 text-[#2E82F7]" />
                <span>{hub.state} State</span>
              </Badge>
              <Badge
                variant="secondary"
                className="font-mono text-xs px-2.5 py-0.5"
              >
                Official Campus Guide
              </Badge>
            </div>

            <div className="space-y-2">
              <h1
                id="hub-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground leading-tight"
              >
                {hub.name}
              </h1>
              {hub.summary && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {hub.summary}
                </p>
              )}
            </div>

            {/* Last Reviewed Timestamp */}
            <div className="pt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>Last reviewed: {formattedReviewDate}</span>
            </div>
          </div>

          {/* Required Notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="text-xs sm:text-sm leading-relaxed">
              Community-contributed guide. Always confirm with your institution&apos;s official notices.
            </p>
          </div>
        </section>

        {/* Guide Content Sections */}
        <div className="space-y-6">
          {/* Section 1: Clearance Guide */}
          {hasClearance && (
            <section
              aria-labelledby="clearance-heading"
              className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-2.5 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="clearance-heading"
                    className="text-lg sm:text-xl font-bold font-display text-foreground"
                  >
                    Clearance Guide &amp; Registration
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Step-by-step procedures, documentation checklist, and administrative requirements.
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground/90 font-sans">
                {hub.clearance_guide}
              </p>
            </section>
          )}

          {/* Section 2: Hostel Guide */}
          {hasHostel && (
            <section
              aria-labelledby="hostel-heading"
              className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-2.5 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="hostel-heading"
                    className="text-lg sm:text-xl font-bold font-display text-foreground"
                  >
                    Hostel &amp; Accommodation
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    On-campus hall allocation, portal procedures, and off-campus housing pointers.
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground/90 font-sans">
                {hub.hostel_guide}
              </p>
            </section>
          )}

          {/* Section 3: Departments Guide */}
          {hasDepartments && (
            <section
              aria-labelledby="departments-heading"
              className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-2.5 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="departments-heading"
                    className="text-lg sm:text-xl font-bold font-display text-foreground"
                  >
                    Departments &amp; Faculty
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Faculty walkthroughs, course registration notes, and departmental guidance.
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground/90 font-sans">
                {hub.departments_guide}
              </p>
            </section>
          )}

          {/* If all sections are empty */}
          {!hasClearance && !hasHostel && !hasDepartments && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center space-y-2">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                Detailed guides for this campus will be published soon.
              </p>
              <p className="text-xs text-muted-foreground">
                Clearance procedures and hostel information are currently being reviewed.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

