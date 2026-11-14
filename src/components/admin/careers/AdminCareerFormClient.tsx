"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Globe,
  Loader2,
  ExternalLink,
  Lock,
  Calendar,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import type { CareerRoleRow, CareerRoleStatus, JobLocation, JobType } from "@/data/careers";
import {
  slugify,
  parseLines,
  formatLines,
  LOCATION_OPTIONS,
  TYPE_OPTIONS,
  careerRoleSchema,
} from "@/lib/careers/validation";
import {
  adminSaveRoleAction,
  adminSetRoleStatusAction,
} from "@/lib/careers/admin-actions";
import { PanelSection } from "@/components/admin/primitives/PanelSection";
import { AdminCard } from "@/components/admin/primitives/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminCareerFormClientProps {
  mode: "create" | "edit";
  initialRole?: CareerRoleRow;
}

export function AdminCareerFormClient({
  mode,
  initialRole,
}: AdminCareerFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState(initialRole?.title || "");
  const [slug, setSlug] = useState(initialRole?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(mode === "edit");
  const [department, setDepartment] = useState(initialRole?.department || "");
  const [location, setLocation] = useState<JobLocation>(initialRole?.location || "Remote");
  const [type, setType] = useState<JobType>(initialRole?.type || "Full-time");
  const [featured, setFeatured] = useState<boolean>(initialRole?.featured || false);
  const [summary, setSummary] = useState(initialRole?.summary || "");

  // Multiline array states
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    formatLines(initialRole?.responsibilities)
  );
  const [requirementsText, setRequirementsText] = useState(
    formatLines(initialRole?.requirements)
  );
  const [niceToHaveText, setNiceToHaveText] = useState(
    formatLines(initialRole?.nice_to_have)
  );
  const [aboutText, setAboutText] = useState(
    formatLines(initialRole?.about)
  );

  // Status state
  const [status, setStatus] = useState<CareerRoleStatus>(initialRole?.status || "draft");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Slug locked if published or ever posted
  const isSlugLocked =
    mode === "edit" &&
    Boolean(initialRole?.status === "published" || initialRole?.posted_at);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManuallyEdited && !isSlugLocked) {
      setSlug(slugify(val));
    }
    if (fieldErrors.title) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(slugify(val));
    if (fieldErrors.slug) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  };

  // Dirty tracking
  const isDirty = useMemo(() => {
    if (mode === "create") {
      return Boolean(
        title.trim() ||
        department.trim() ||
        summary.trim() ||
        responsibilitiesText.trim() ||
        requirementsText.trim() ||
        niceToHaveText.trim() ||
        aboutText.trim()
      );
    }
    if (!initialRole) return false;
    return (
      title !== initialRole.title ||
      slug !== initialRole.slug ||
      department !== initialRole.department ||
      location !== initialRole.location ||
      type !== initialRole.type ||
      featured !== initialRole.featured ||
      summary !== initialRole.summary ||
      responsibilitiesText !== formatLines(initialRole.responsibilities) ||
      requirementsText !== formatLines(initialRole.requirements) ||
      niceToHaveText !== formatLines(initialRole.nice_to_have) ||
      aboutText !== formatLines(initialRole.about) ||
      status !== initialRole.status
    );
  }, [
    mode,
    initialRole,
    title,
    slug,
    department,
    location,
    type,
    featured,
    summary,
    responsibilitiesText,
    requirementsText,
    niceToHaveText,
    aboutText,
    status,
  ]);

  // Leave page dirty prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Save handler
  const handleSave = useCallback(() => {
    setFieldErrors({});

    const inputData = {
      title,
      slug,
      department,
      location,
      type,
      featured,
      summary,
      responsibilities: parseLines(responsibilitiesText),
      requirements: parseLines(requirementsText),
      nice_to_have: parseLines(niceToHaveText),
      about: parseLines(aboutText),
    };

    const parsed = careerRoleSchema.safeParse(inputData);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString() || "form";
        if (!errs[path]) errs[path] = issue.message;
      });
      setFieldErrors(errs);
      toast.error("Please fix the highlighted errors before saving");
      return;
    }

    startTransition(async () => {
      try {
        const res = await adminSaveRoleAction({
          id: initialRole?.id ?? null,
          input: inputData,
        });

        if (!res.ok) {
          toast.error(res.error || "Failed to save career role");
          return;
        }

        const roleId = res.data?.role_id || initialRole?.id;

        // If status changed in edit mode, sync it
        if (mode === "edit" && roleId && status !== initialRole?.status) {
          await adminSetRoleStatusAction({
            roleId,
            status,
            slug: res.data?.slug || slug,
          });
        }

        toast.success(
          mode === "create" ? "Career role created" : "Career role updated"
        );

        if (mode === "create" && roleId) {
          router.push(`/admin/careers/${roleId}/edit`);
        } else {
          router.refresh();
        }
      } catch {
        toast.error("An unexpected error occurred while saving");
      }
    });
  }, [
    title,
    slug,
    department,
    location,
    type,
    featured,
    summary,
    responsibilitiesText,
    requirementsText,
    niceToHaveText,
    aboutText,
    initialRole,
    mode,
    status,
    router,
  ]);

  // Shortcut Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return (
    <div className="max-w-[1120px] mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-md"
          >
            <Link href="/admin/careers">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to careers</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <h1 className="text-lg font-semibold text-foreground truncate font-sans">
            {mode === "create" ? "New career role" : `Edit ${initialRole?.title}`}
          </h1>
        </div>

        {mode === "edit" && initialRole?.status === "published" && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-md border-border"
          >
            <Link href={`/careers/${initialRole.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View live listing</span>
            </Link>
          </Button>
        )}
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Left Column: Form Sections */}
        <div className="space-y-8 min-w-0">
          {/* Basics Section */}
          <PanelSection
            title="Basics"
            description="Core role specifications visible in listings and application headers."
          >
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground block font-sans">
                  Role title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-10 text-sm rounded-md bg-card border-border"
                />
                {fieldErrors.title && (
                  <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground block font-sans">
                  Department *
                </label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Product, Growth"
                  className="h-10 text-sm rounded-md bg-card border-border"
                />
                {fieldErrors.department && (
                  <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                    {fieldErrors.department}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground block font-sans">
                    Location *
                  </label>
                  <Select value={location} onValueChange={(val: any) => setLocation(val)}>
                    <SelectTrigger className="h-10 text-xs rounded-md bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {LOCATION_OPTIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground block font-sans">
                    Employment type *
                  </label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="h-10 text-xs rounded-md bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground font-sans">
                    Feature this opening at the top of the careers page
                  </span>
                </label>
              </div>
            </div>
          </PanelSection>

          {/* Summary Section */}
          <PanelSection
            title="Summary"
            description="Brief highlight shown on search cards and social shares."
          >
            <div className="space-y-1.5 pt-1">
              <Textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="High-impact 1-2 sentence pitch describing who this person is and what they will build..."
                className="text-xs rounded-md bg-card border-border leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground font-sans">
                <span>Maximum 300 characters.</span>
                <span className="tabular-nums">{summary.length} / 300</span>
              </div>
              {fieldErrors.summary && (
                <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {fieldErrors.summary}
                </p>
              )}
            </div>
          </PanelSection>

          {/* Responsibilities Section */}
          <PanelSection
            title="Responsibilities"
            description="Key expectations and deliverables. Enter one bullet point per line."
          >
            <div className="space-y-1.5 pt-1">
              <Textarea
                rows={6}
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                placeholder="Architect and scale clean Next.js interfaces&#10;Collaborate with design and product leads&#10;Mentor junior engineering fellows"
                className="text-xs rounded-md bg-card border-border leading-relaxed font-sans"
              />
              <p className="text-xs text-muted-foreground font-sans">
                Each non-empty line becomes a distinct bullet in public specification.
              </p>
              {fieldErrors.responsibilities && (
                <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {fieldErrors.responsibilities}
                </p>
              )}
            </div>
          </PanelSection>

          {/* Requirements Section */}
          <PanelSection
            title="Requirements"
            description="Core skills and baseline competencies needed. Enter one bullet point per line."
          >
            <div className="space-y-1.5 pt-1">
              <Textarea
                rows={6}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder="3+ years production TypeScript and React experience&#10;Strong understanding of web accessibility standards&#10;Demonstrated product craftsmanship"
                className="text-xs rounded-md bg-card border-border leading-relaxed font-sans"
              />
              <p className="text-xs text-muted-foreground font-sans">
                Each non-empty line becomes a requirement bullet.
              </p>
              {fieldErrors.requirements && (
                <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {fieldErrors.requirements}
                </p>
              )}
            </div>
          </PanelSection>

          {/* Nice to Have Section */}
          <PanelSection
            title="Nice to have"
            description="Bonus qualifications and preferred experience. Enter one bullet point per line."
          >
            <div className="space-y-1.5 pt-1">
              <Textarea
                rows={5}
                value={niceToHaveText}
                onChange={(e) => setNiceToHaveText(e.target.value)}
                placeholder="Experience with Supabase or PostgreSQL schemas&#10;Background in youth education or civic technology in Nigeria"
                className="text-xs rounded-md bg-card border-border leading-relaxed font-sans"
              />
              <p className="text-xs text-muted-foreground font-sans">
                Optional benefits and bonuses. Leave blank if none.
              </p>
              {fieldErrors.nice_to_have && (
                <p className="text-xs font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {fieldErrors.nice_to_have}
                </p>
              )}
            </div>
          </PanelSection>

          {/* About Zed Section */}
          <PanelSection
            title="About the team"
            description="Overview of mission and workplace culture. Enter one bullet point per line."
          >
            <div className="space-y-1.5 pt-1">
              <Textarea
                rows={4}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Zed builds sovereign civic infrastructure for Nigerian students and youth."
                className="text-xs rounded-md bg-card border-border leading-relaxed font-sans"
              />
              <p className="text-xs text-muted-foreground font-sans">
                Leave blank to inherit the global platform boilerplate.
              </p>
            </div>
          </PanelSection>
        </div>

        {/* Right Sticky Column: Publish Card */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <AdminCard className="p-5 space-y-5 rounded-lg border-border">
            <h2 className="text-sm font-semibold text-foreground font-sans">
              Publishing &amp; URL
            </h2>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block font-sans">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val: CareerRoleStatus) => setStatus(val)}
                disabled={isPending}
              >
                <SelectTrigger className="h-9 text-xs rounded-md bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="draft">Draft (Internal)</SelectItem>
                  <SelectItem value="published">Published (Live)</SelectItem>
                  <SelectItem value="closed">Closed (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground block font-sans">
                  URL slug *
                </label>
                {isSlugLocked && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-sans">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </div>
              <div className="flex items-center rounded-md border border-border bg-background h-9 px-2.5 focus-within:ring-2 focus-within:ring-ring transition-shadow">
                <span className="font-sans text-muted-foreground text-xs select-none pr-1">
                  /careers/
                </span>
                <input
                  type="text"
                  value={slug}
                  disabled={isSlugLocked}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="frontend-engineer"
                  className="w-full bg-transparent font-mono text-xs text-foreground focus:outline-hidden disabled:opacity-60"
                />
              </div>
              {fieldErrors.slug && (
                <p className="text-[11px] font-medium text-[color:var(--data-negative-ink)] font-sans">
                  {fieldErrors.slug}
                </p>
              )}
            </div>

            {/* Posted / Created Metadata */}
            {initialRole?.posted_at && (
              <div className="text-xs text-muted-foreground space-y-1 border-t border-border/60 pt-3 font-sans">
                <div className="flex justify-between">
                  <span>First published:</span>
                  <span className="tabular-nums">
                    {new Date(initialRole.posted_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Dirty Status & Save Button */}
            <div className="pt-2 space-y-3">
              {isDirty && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-sans">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved changes</span>
                </div>
              )}

              <Button
                type="button"
                variant="default"
                disabled={isPending}
                onClick={handleSave}
                className="w-full h-10 text-xs rounded-md gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{mode === "create" ? "Create role" : "Save changes"}</span>
                  </>
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground font-sans">
                Shortcut: <kbd className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">Ctrl+S</kbd>
              </p>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-xs border-t border-border flex items-center justify-between gap-3 z-30">
        <div>
          {isDirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-sans flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs h-9 rounded-md"
          >
            <Link href="/admin/careers">Cancel</Link>
          </Button>
          <Button
            size="sm"
            variant="default"
            disabled={isPending}
            onClick={handleSave}
            className="text-xs h-9 rounded-md gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
