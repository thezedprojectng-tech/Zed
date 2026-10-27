"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  AlertTriangle,
  X,
  PlusCircle,
} from "lucide-react";
import type { Internship } from "@/lib/internships/types";
import {
  INTERNSHIP_FIELDS,
  INTERNSHIP_WORK_MODES,
  INTERNSHIP_PAID_STATUSES,
  INTERNSHIP_TYPES,
} from "@/lib/internships/constants";

interface InternshipFeedClientProps {
  initialInternships: Internship[];
}

export function InternshipFeedClient({ initialInternships }: InternshipFeedClientProps) {
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [paidStatusFilter, setPaidStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredInternships = useMemo(() => {
    return initialInternships.filter((item) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesOrg = item.organization.toLowerCase().includes(query);
        const matchesLoc = item.location.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesOrg && !matchesLoc && !matchesDesc) {
          return false;
        }
      }

      if (fieldFilter !== "all" && item.field !== fieldFilter) return false;
      if (workModeFilter !== "all" && item.work_mode !== workModeFilter) return false;
      if (paidStatusFilter !== "all" && item.paid_status !== paidStatusFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;

      return true;
    });
  }, [initialInternships, search, fieldFilter, workModeFilter, paidStatusFilter, typeFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    fieldFilter !== "all" ||
    workModeFilter !== "all" ||
    paidStatusFilter !== "all" ||
    typeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setFieldFilter("all");
    setWorkModeFilter("all");
    setPaidStatusFilter("all");
    setTypeFilter("all");
  };

  const getPaidBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">Paid</span>;
      case "stipend":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">Stipend</span>;
      case "unpaid":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">Unpaid</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* ── Header & Action ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF4FF] dark:bg-[#2E82F7]/10 text-[#2E82F7] border border-[#2E82F7]/20">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Opportunity Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Internship Radar
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Curated tracking of internship, SIWES, and industrial training placements across Nigeria. Submitted by the community, reviewed for legitimacy.
          </p>
        </div>

        <Link
          href="/internships/submit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#2E82F7] hover:bg-[#256fd1] text-white shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Submit an Opportunity</span>
        </Link>
      </div>

      {/* ── Scam Safety Notice ── */}
      <div
        role="region"
        aria-label="Safety advice"
        className="rounded-2xl p-4 sm:p-5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 flex items-start gap-3.5"
      >
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            Never pay to apply.
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Legitimate organizations do not charge application, registration, processing, or interview fees. Zed does not endorse listings. If an employer demands payment, do not proceed and{" "}
            <Link
              href="/contact?subject=Report%20suspicious%20internship%20listing"
              className="underline font-semibold hover:text-amber-950 dark:hover:text-amber-100"
            >
              report it to our team
            </Link>.
          </p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            placeholder="Search by title, organization, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20 focus:border-[#2E82F7] text-zinc-900 dark:text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Field */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Field
            </label>
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2E82F7]"
            >
              <option value="all">All Fields</option>
              {INTERNSHIP_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Work Mode
            </label>
            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2E82F7]"
            >
              <option value="all">All Modes</option>
              {INTERNSHIP_WORK_MODES.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>

          {/* Paid Status */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Compensation
            </label>
            <select
              value={paidStatusFilter}
              onChange={(e) => setPaidStatusFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2E82F7]"
            >
              <option value="all">All Compensation</option>
              {INTERNSHIP_PAID_STATUSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Program Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2E82F7]"
            >
              <option value="all">All Types</option>
              {INTERNSHIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-500">
            <span>
              Showing {filteredInternships.length} of {initialInternships.length} opportunities
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 font-semibold text-[#2E82F7] hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Listings Grid ── */}
      {filteredInternships.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
          <Briefcase className="h-10 w-10 text-zinc-400 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            No opportunities match your criteria
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search terms or clearing your filter criteria to view more listings.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInternships.map((internship) => (
            <Link
              key={internship.id}
              href={`/internships/${internship.id}`}
              className="group block p-5 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-[#2E82F7]/50 dark:hover:border-[#2E82F7]/50 shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-[#2E82F7] transition-colors line-clamp-1">
                    {internship.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{internship.organization}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {getPaidBadge(internship.paid_status)}
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {internship.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <MapPin className="h-3 w-3" />
                  {internship.location} ({internship.work_mode})
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Briefcase className="h-3 w-3" />
                  {internship.type.replace("-", " ")}
                </span>

                {internship.deadline && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 ml-auto">
                    <Calendar className="h-3 w-3" />
                    Deadline: {new Date(internship.deadline).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
