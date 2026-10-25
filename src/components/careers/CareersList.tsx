"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, ArrowRight, MapPin, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { jobs as defaultJobs, type Job, type JobLocation } from "@/data/careers";
import { getDepartments, buildApplyUrl, type DepartmentOption } from "@/lib/careers/helpers";

export interface CareersListProps {
  badge?: string;
  heading?: string;
  headingHighlight?: string;
  description?: string;
  jobs?: Job[];
  className?: string;
}

const locationVariant: Record<JobLocation, string> = {
  Remote:
    "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  Hybrid:
    "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  "On-site":
    "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
};

function DeptTab({
  dept,
  isActive,
  count,
  onClick,
}: {
  dept: DepartmentOption;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium",
        "transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer",
        isActive
          ? "bg-foreground text-background shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <span>{dept.label}</span>
      {dept.value !== "all" && (
        <span
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
            isActive ? "bg-background/20 text-background" : "bg-border text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function JobRow({ job }: { job: Job }) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={`/careers/${job.slug}`}
        aria-label={`View ${job.title} role`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-colors"
      >
        <div className="group relative flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-6 transition-colors duration-150">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors sm:text-base">
                {job.title}
              </h3>
              {job.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                  <Flame className="size-2.5" />
                  Hot
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm line-clamp-1">
              {job.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                locationVariant[job.location]
              )}
            >
              <MapPin className="size-2.5" />
              {job.location}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <Clock className="size-2.5" />
              {job.type}
            </span>

            <span className="ml-auto flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-300 group-hover:bg-foreground group-hover:text-background sm:ml-3">
              <ArrowRight className="size-3 motion-reduce:transform-none transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function OpenApplicationBanner() {
  const whatsappUrl = buildApplyUrl();

  return (
    <aside
      aria-label="Open Application Banner"
      className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background border border-border text-muted-foreground">
          <Briefcase className="size-3.5" />
        </span>
        <p className="text-sm text-muted-foreground">
          Don&apos;t see a fit? Tell us how you can help.
        </p>
      </div>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:underline underline-offset-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      >
        <span>Message us on WhatsApp</span>
        <ArrowRight className="size-3 motion-reduce:transform-none" />
      </a>
    </aside>
  );
}

export function CareersList({
  badge = "Join the team",
  heading = "Help us build the OS for",
  headingHighlight = "Nigerian Gen Z",
  description = "We are a small team building Zed. Explore open roles below.",
  jobs = defaultJobs,
  className,
}: CareersListProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const departments = useMemo(() => getDepartments(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    return activeTab === "all" ? jobs : jobs.filter((j) => j.department === activeTab);
  }, [jobs, activeTab]);

  const countByDept = (value: string) => {
    return value === "all" ? jobs.length : jobs.filter((j) => j.department === value).length;
  };

  return (
    <section className={cn("w-full py-8", className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <header className="mb-10 space-y-4 sm:mb-12">
          {badge && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <span>{badge}</span>
            </div>
          )}

          {(heading || headingHighlight) && (
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {heading}{" "}
              {headingHighlight && (
                <span className="relative inline-block">
                  <span className="relative z-10 text-foreground">{headingHighlight}</span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0.5 h-[6px] rounded-full bg-primary/15 dark:bg-primary/20"
                  />
                </span>
              )}
            </h1>
          )}

          {description && (
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base leading-relaxed">
              {description}
            </p>
          )}
        </header>

        {/* Department filter tabs (only when distinct departments exist) */}
        {departments.length > 1 && (
          <nav aria-label="Department filters" className="mb-8 flex flex-wrap gap-2">
            {departments.map((dept) => (
              <DeptTab
                key={dept.value}
                dept={dept}
                isActive={activeTab === dept.value}
                count={countByDept(dept.value)}
                onClick={() => setActiveTab(dept.value)}
              />
            ))}
          </nav>
        )}

        {/* Roles list or empty state */}
        <div className="rounded-xl border border-border bg-card px-4 sm:px-6">
          {filteredJobs.length > 0 ? (
            <ul role="list" aria-label="Open positions">
              {filteredJobs.map((job) => (
                <JobRow key={job.slug} job={job} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Briefcase className="size-4" />
              </span>
              <p className="text-sm font-semibold text-foreground">No open roles right now</p>
              <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                We don&apos;t have any open roles in this department at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Open application WhatsApp banner */}
        <OpenApplicationBanner />
      </div>
    </section>
  );
}

export default CareersList;
