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

      {/* Search and Filters Toolbar */}
      <section aria-label="Directory filters" className="space-y-4">
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
              className="pl-10 h-10 w-full bg-card border-border rounded-lg"
              aria-label="Search alumni profiles"
            />
          </div>

          <div className="sm:col-span-4">
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger
                className="h-10 w-full bg-card border-border rounded-lg"
                aria-label="Filter by professional field"
              >
                <div className="flex items-center gap-2 truncate text-xs sm:text-sm">
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
              className="h-7 px-2 text-xs gap-1 hover:text-foreground cursor-pointer"
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
          aria-label="Empty directory"
          className="rounded-lg border border-border bg-card/40 p-8 sm:p-12 text-center space-y-4"
        >
          <div className="w-10 h-10 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <GraduationCap className="w-5 h-5" aria-hidden="true" />
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
              <Button asChild variant="outline" size="sm" className="rounded-lg text-xs">
                <Link href="/alumni-office-hours/apply">Apply to host office hours</Link>
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section
          aria-label="Alumni profiles directory"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredProfiles.map((profile) => (
            <article
              key={profile.id}
              className="group flex flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-2xs hover:border-border/80 transition-all duration-200"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {profile.display_name}
                    </h2>
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <span className="truncate">{profile.occupation}</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[11px] font-normal rounded-md">
                    {profile.field}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground border-y border-border/60 py-2.5">
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
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Can advise on:
                    </p>
                    <p className="text-xs text-foreground/90 line-clamp-2">
                      {profile.topics}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Free mentorship</span>
                <Link
                  href={`/alumni-office-hours/${profile.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                >
                  <span>View profile</span>
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

