"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  Briefcase,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  Flame,
  Globe2,
  Zap,
  Users2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jobs as defaultJobs, type Job, type JobLocation } from "@/data/careers";
import { getDepartments, buildApplyUrl, type DepartmentOption } from "@/lib/careers/helpers";
import { FadeIn } from "@/components/site/FadeIn";

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
    "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  Hybrid:
    "bg-blue-50 text-primary border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  "On-site":
    "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
};

const VALUES = [
  {
    num: "01",
    icon: Zap,
    title: "Mission-Driven Impact",
    desc: "Solve actual administrative friction, middleman inflation, and document rejections for millions of Nigerian youth.",
  },
  {
    num: "02",
    icon: Globe2,
    title: "Remote & Async First",
    desc: "Work with autonomy from Lagos, Abuja, Ibadan, or anywhere with an internet connection. We value output, not seat-time.",
  },
  {
    num: "03",
    icon: Users2,
    title: "High Ownership Culture",
    desc: "Small, decisive engineering and product teams with direct input into product direction and rapid weekly releases.",
  },
];

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
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold",
        "transition-all duration-200 outline-none cursor-pointer border shadow-2xs",
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 ring-2 ring-primary/20"
          : "bg-card text-muted-foreground border-border hover:border-border/80 hover:text-foreground"
      )}
    >
      <span>{dept.label}</span>
      {dept.value !== "all" && (
        <span
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
            isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
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
    <li className="border-b border-border/60 last:border-b-0">
      <Link
        href={`/careers/${job.slug}`}
        aria-label={`View ${job.title} role`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl group"
      >
        <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 rounded-2xl hover:bg-muted/50 transition-colors duration-200">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                {job.title}
              </h3>
              {job.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                  <Flame className="size-2.5" />
                  Priority Role
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {job.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0 pt-1 sm:pt-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                locationVariant[job.location]
              )}
            >
              <MapPin className="size-3" />
              {job.location}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-mono font-medium text-muted-foreground">
              <Clock className="size-3" />
              {job.type}
            </span>

            <span className="ml-auto flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground sm:ml-2 shadow-2xs">
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 duration-200" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function CareersList({
  badge = "Careers at Zed",
  heading = "Build the operating system for",
  headingHighlight = "Nigerian youth",
  description = "Join a mission-driven team engineering high-reliability civic software, practical digital tools, and economic opportunity for the next generation.",
  jobs = defaultJobs,
  className,
}: CareersListProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const shouldReduceMotion = useReducedMotion();

  const departments = useMemo(() => getDepartments(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    return activeTab === "all" ? jobs : jobs.filter((j) => j.department === activeTab);
  }, [jobs, activeTab]);

  const countByDept = (value: string) => {
    return value === "all" ? jobs.length : jobs.filter((j) => j.department === value).length;
  };

  const whatsappUrl = buildApplyUrl();

  return (
    <div className={cn("w-full flex-1 flex flex-col items-center justify-start pb-20 overflow-hidden", className)}>
      {/* ── Top Hero Section with Ambient Glow ───────────────────────────── */}
      <section className="relative w-full pt-0 pb-16 sm:pt-0 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Ambient Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Breadcrumb & Badge Header */}
        <div className="w-full flex justify-between items-center max-w-5xl px-2">
          <nav aria-label="Breadcrumb">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </Link>
          </nav>

          {badge && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-primary text-xs font-semibold shadow-2xs">
              
              <span>{badge}</span>
            </div>
          )}
        </div>

        {/* Hero Title & Subtitle */}
        <FadeIn className="space-y-6 max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            {heading}{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {headingHighlight}
            </span>
          </h1>

          {description && (
            <p className="font-sans text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </FadeIn>
      </section>

      {/* ── Culture & Values Bento Grid ───────────────────────────────────── */}
      <section aria-label="Company Values" className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {VALUES.map((val, idx) => {
            const Icon = val.icon;
            return (
              <FadeIn key={val.num} delay={idx * 0.05} className="h-full">
                <div className="h-full p-6 sm:p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">
                      {val.num}
                    </span>
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h2 className="font-display font-bold text-base sm:text-lg text-foreground">
                    {val.title}
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── Open Roles Section ────────────────────────────────────────────── */}
      <section aria-label="Open Positions" className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8 mb-16">
        <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground">
              Open Positions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Filter by department to view active roles
            </p>
          </div>

          {/* Department filter tabs */}
          {departments.length > 1 && (
            <nav aria-label="Department filters" className="flex flex-wrap gap-2">
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
        </FadeIn>

        {/* Roles list card container */}
        <FadeIn delay={0.1}>
          <div className="rounded-3xl border border-border/90 bg-card p-3 sm:p-6 shadow-xl">
            {filteredJobs.length > 0 ? (
              <ul role="list" aria-label="Open positions" className="divide-y divide-border/60">
                {filteredJobs.map((job) => (
                  <JobRow key={job.slug} job={job} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Briefcase className="size-5" />
                </span>
                <p className="font-display font-bold text-base text-foreground">
                  No open roles in this department right now
                </p>
                <p className="max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We are constantly growing. Check back soon or send an open pitch via WhatsApp below!
                </p>
              </div>
            )}
          </div>
        </FadeIn>
      </section>

      {/* ── Open Application WhatsApp & Email Banner ──────────────────────── */}
      <section className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={0.15}>
          <aside
            aria-label="Open Application"
            className="rounded-3xl border border-border/90 bg-card p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"
            />

            <div className="relative z-10 flex items-center gap-5">
              <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
                <MessageCircle className="size-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
                  Don&apos;t see an exact fit?
                </h3>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg">
                  We frequently create roles for extraordinary engineers, community builders, and content creators. Send your profile directly to our team.
                </p>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/25 transition-all shrink-0 active:scale-95"
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight className="size-4" />
            </a>
          </aside>
        </FadeIn>
      </section>
    </div>
  );
}

export default CareersList;