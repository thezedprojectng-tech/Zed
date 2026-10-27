import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { getInternshipById } from "@/lib/internships/queries";

export const revalidate = 60;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SingleInternshipPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SingleInternshipPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return { title: "Opportunity Not Found" };
  }

  const item = await getInternshipById(id);
  if (!item) {
    return { title: "Opportunity Not Found" };
  }

  return {
    title: `${item.title} at ${item.organization} — Internship Radar`,
    description: item.description.slice(0, 160),
    openGraph: {
      title: `${item.title} at ${item.organization}`,
      description: item.description.slice(0, 160),
      url: `https://zedproject.ng/internships/${item.id}`,
      type: "website",
    },
  };
}

export default async function SingleInternshipPage({
  params,
}: SingleInternshipPageProps) {
  const { id } = await params;

  // Strict UUID validation: prevents static routes from being evaluated as IDs
  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  const internship = await getInternshipById(id);
  if (!internship) {
    notFound();
  }

  const isHttpsApply =
    internship.apply_url && /^https:\/\/[^\s@]+$/i.test(internship.apply_url);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* ── Back Navigation ── */}
      <div>
        <Link
          href="/internships"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-[#2E82F7] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to all opportunities</span>
        </Link>
      </div>

      {/* ── Header Card ── */}
      <div className="bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF4FF] dark:bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20 uppercase tracking-wider">
              {internship.field}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
              {internship.type.replace("-", " ")}
            </span>
            {internship.paid_status === "paid" && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                Paid Opportunity
              </span>
            )}
            {internship.paid_status === "stipend" && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                Monthly Stipend
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {internship.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 pt-1">
            <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-200">
              <Building2 className="h-4 w-4 text-zinc-400" />
              <span>{internship.organization}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <span>{internship.location} ({internship.work_mode})</span>
            </div>
            {internship.deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>
                  Deadline:{" "}
                  {new Date(internship.deadline).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Primary Apply Action ── */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
          {isHttpsApply && (
            <a
              href={internship.apply_url!}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#2E82F7] hover:bg-[#256fd1] text-white shadow-xs transition-colors"
            >
              <span>Apply on Company Site</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {internship.apply_email && (
            <a
              href={`mailto:${internship.apply_email}?subject=${encodeURIComponent(`Application for ${internship.title}`)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Apply via Email</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Scam Safety Box (Required on every page) ── */}
      <div
        role="region"
        aria-label="Safety advice"
        className="rounded-2xl p-5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-2 text-xs sm:text-sm leading-relaxed"
      >
        <div className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Safety Warning: Never pay to apply</span>
        </div>
        <p className="text-amber-800 dark:text-amber-300">
          Never pay to apply. Zed does not verify or endorse these opportunities. If this employer requests an application fee, screening charge, or deposit, do not pay.
        </p>
        <div className="pt-1">
          <Link
            href={`/contact?subject=${encodeURIComponent(`Report internship ${internship.id}`)}`}
            className="inline-flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-100 underline hover:text-amber-950"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Report this suspicious listing</span>
          </Link>
        </div>
      </div>

      {/* ── Role Description & Details ── */}
      <div className="bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Role Description
          </h2>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {internship.description}
          </div>
        </div>

        {internship.eligibility && (
          <div className="space-y-3 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Eligibility &amp; Requirements
            </h2>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {internship.eligibility}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
