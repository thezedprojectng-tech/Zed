"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  Briefcase,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { AlumniProfileRow } from "@/lib/alumni-office-hours/types";
import {
  DISCLAIMER_TEXT,
  COMMON_ALUMNI_FIELDS,
} from "@/lib/alumni-office-hours/constants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AlumniDirectoryClientProps {
  initialProfiles: AlumniProfileRow[];
}

export function AlumniDirectoryClient({
  initialProfiles,
}: AlumniDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");

  // Collect distinct fields from profiles or common fields
  const availableFields = useMemo(() => {
    const fieldsSet = new Set<string>();
    COMMON_ALUMNI_FIELDS.forEach((f) => fieldsSet.add(f));
    initialProfiles.forEach((p) => {
      if (p.field && p.field.trim().length > 0) {
        fieldsSet.add(p.field.trim());
      }
    });
    return Array.from(fieldsSet).sort();
  }, [initialProfiles]);

  const filteredProfiles = useMemo(() => {
    return initialProfiles.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        p.display_name.toLowerCase().includes(q) ||
        p.field.toLowerCase().includes(q) ||
        p.institution.toLowerCase().includes(q) ||
        p.occupation.toLowerCase().includes(q) ||
        p.topics.toLowerCase().includes(q);

      const matchesField =
        fieldFilter === "all" ||
        p.field.toLowerCase() === fieldFilter.toLowerCase();

      return matchesSearch && matchesField;
    });
  }, [initialProfiles, searchQuery, fieldFilter]);

  const hasActiveFilters = searchQuery.trim().length > 0 || fieldFilter !== "all";

  return (
    <div className="space-y-8">
      {/* Required Safety Disclaimer Banner */}
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

      {/* Search and Filters Toolbar */}
      <section aria-label="Directory Filters" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-8 relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search by name, institution, role, or field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-card"
              aria-label="Search alumni profiles"
            />
          </div>

          <div className="sm:col-span-4">
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger
                className="h-10 w-full bg-card"
                aria-label="Filter by professional field"
              >
                <div className="flex items-center gap-2 truncate">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All professional fields" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All professional fields</SelectItem>
                {availableFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              Showing {filteredProfiles.length} of {initialProfiles.length} published alumni
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFieldFilter("all");
              }}
              className="h-7 px-2 text-xs gap-1 hover:text-foreground"
            >
              <X className="h-3 w-3" />
              <span>Clear filters</span>
            </Button>
          </div>
        )}
      </section>

      {/* Directory Listings */}
      {filteredProfiles.length === 0 ? (
        <section
          aria-label="Empty Directory"
          className="rounded-xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base font-semibold text-foreground">
              {initialProfiles.length === 0
                ? "No alumni profiles published yet."
                : "No matching alumni profiles found."}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {initialProfiles.length === 0
                ? "Alumni volunteers are currently reviewing and submitting profiles. Check back soon or apply to host office hours."
                : "Try adjusting your search keywords or choosing a different field filter."}
            </p>
          </div>
          {initialProfiles.length === 0 && (
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/alumni-office-hours/apply">Apply to Host Office Hours</Link>
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section
          aria-label="Alumni Profiles Directory"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {filteredProfiles.map((profile) => (
            <article
              key={profile.id}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {profile.display_name}
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-foreground/80 flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <span className="truncate">{profile.occupation}</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[11px] font-normal">
                    {profile.field}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/60 py-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" aria-hidden="true" />
                    <span className="truncate">{profile.institution}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" aria-hidden="true" />
                    <span>Class of {profile.graduation_year}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {profile.bio}
                </p>

                {profile.topics && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Can Advise On:
                    </p>
                    <p className="text-xs text-foreground/90 line-clamp-2">
                      {profile.topics}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Free mentorship</span>
                <Link
                  href={`/alumni-office-hours/${profile.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                >
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

