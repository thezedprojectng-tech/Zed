"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Briefcase,
  MapPin,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  CAREERS_WHATSAPP_DISPLAY,
  type CareerRoleRow,
  type JobLocation,
  type JobType,
} from "@/data/careers";
import {
  slugify,
  parseLines,
  formatLines,
  LOCATION_OPTIONS,
  TYPE_OPTIONS,
  type CareerRoleInput,
} from "@/lib/careers/validation";
import { adminSaveRoleAction } from "@/lib/careers/admin-actions";

interface AdminCareerFormClientProps {
  mode: "create" | "edit";
  initialRole?: CareerRoleRow;
}

export function AdminCareerFormClient({
  mode,
  initialRole,
}: AdminCareerFormClientProps) {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState(initialRole?.title || "");
  const [slug, setSlug] = useState(initialRole?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    mode === "edit"
  );
  const [department, setDepartment] = useState(initialRole?.department || "");
  const [location, setLocation] = useState<JobLocation>(
    initialRole?.location || "Remote"
  );
  const [type, setType] = useState<JobType>(
    initialRole?.type || "Full-time"
  );
  const [featured, setFeatured] = useState<boolean>(
    initialRole?.featured || false
  );
  const [summary, setSummary] = useState(initialRole?.summary || "");

  // Textarea multiline state
  const [aboutText, setAboutText] = useState(
    formatLines(initialRole?.about)
  );
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    formatLines(initialRole?.responsibilities)
  );
  const [requirementsText, setRequirementsText] = useState(
    formatLines(initialRole?.requirements)
  );
  const [niceToHaveText, setNiceToHaveText] = useState(
    formatLines(initialRole?.nice_to_have)
  );

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If a role is currently published or was ever published (posted_at is not null),
  // the slug is locked to avoid breaking external links.
  const isSlugLocked =
    mode === "edit" &&
    Boolean(initialRole?.status === "published" || initialRole?.posted_at);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isSlugManuallyEdited && !isSlugLocked) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(slugify(newSlug));
  };

  const parsedAbout = parseLines(aboutText);
  const parsedResponsibilities = parseLines(responsibilitiesText);
  const parsedRequirements = parseLines(requirementsText);
  const parsedNiceToHave = parseLines(niceToHaveText);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    const inputData: CareerRoleInput = {
      title,
      slug,
      department,
      location,
      type,
      featured,
      summary,
      about: parsedAbout,
      responsibilities: parsedResponsibilities,
      requirements: parsedRequirements,
      nice_to_have: parsedNiceToHave,
    };

    try {
      const res = await adminSaveRoleAction({
        id: mode === "edit" ? initialRole?.id : null,
        input: inputData,
      });

      if (!res.ok) {
        setErrorMessage(res.error);
        toast.error(res.error);
        setIsSaving(false);
        return;
      }

      toast.success(
        mode === "create"
          ? "Role created as draft."
          : "Role updated successfully."
      );

      router.push("/admin/careers");
      router.refresh();
    } catch {
      const msg = "Failed to save role. Please check your connection.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <Link
            href="/admin/careers"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to roles list</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "create" ? "Create Career Role" : `Edit Role: ${initialRole?.title}`}
          </h1>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "edit"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="size-3.5" />
              <span>Form</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="size-3.5" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 flex items-start gap-3 text-destructive text-sm">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to save role</p>
            <p className="text-xs leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {activeTab === "edit" ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Attributes */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
              Role Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Role Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
                <p className="text-[11px] text-muted-foreground">Between 3 and 120 characters.</p>
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    URL Slug <span className="text-destructive">*</span>
                  </label>
                  {isSlugLocked && (
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      Locked (already published)
                    </span>
                  )}
                </div>
                <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40 overflow-hidden">
                  <span className="pl-3 text-xs font-mono text-muted-foreground select-none">
                    /careers/
                  </span>
                  <input
                    type="text"
                    required
                    disabled={isSlugLocked}
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="senior-frontend-engineer"
                    className="w-full px-2 py-2 text-sm bg-transparent outline-none text-foreground font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Lowercase letters, numbers, and hyphens.
                </p>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Department <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Design, Product, Growth"
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
                <p className="text-[11px] text-muted-foreground">
                  Used automatically to build department filter tabs.
                </p>
              </div>

              {/* Location & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Location <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as JobLocation)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as JobType)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Featured Switch */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="featured-switch"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label
                htmlFor="featured-switch"
                className="text-xs sm:text-sm font-medium text-foreground cursor-pointer select-none"
              >
                Mark as &ldquo;Hot&rdquo; / Featured role (highlighted with flame badge)
              </label>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Summary <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {summary.length}/300
                </span>
              </div>
              <textarea
                required
                rows={2}
                maxLength={300}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A concise 1-2 sentence overview shown in the roles list and search previews."
                className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
              />
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground">
                Role Content & Specifications
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Type one item per line. Blank lines are automatically skipped. Plain text only.
              </p>
            </div>

            <div className="space-y-5">
              {/* About the role */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    About the role paragraphs ({parsedAbout.length}/5)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Max 5 paragraphs
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder={`You will shape our web platform.\nWe are looking for builders who take end-to-end ownership.`}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              {/* Responsibilities */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Responsibilities ({parsedResponsibilities.length}/15){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    At least 1 required before publishing (Max 15)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={responsibilitiesText}
                  onChange={(e) => setResponsibilitiesText(e.target.value)}
                  placeholder={`Develop accessible, responsive UI components for the web platform.\nWork with product and design to craft intuitive user flows.\nEnsure high performance and SEO best practices across public pages.`}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              {/* Requirements */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Requirements ({parsedRequirements.length}/15){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    At least 1 required before publishing (Max 15)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  placeholder={`3+ years of professional React and TypeScript experience.\nDeep understanding of semantic HTML, accessibility, and modern CSS.\nComfortable shipping iteratively and taking feedback.`}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              {/* Nice to have */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Nice to have ({parsedNiceToHave.length}/10)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Optional (Max 10)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={niceToHaveText}
                  onChange={(e) => setNiceToHaveText(e.target.value)}
                  placeholder={`Experience with Next.js App Router and Turbopack.\nActive open source portfolio or previous startup experience.`}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/careers"
              className="px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer disabled:opacity-50"
            >
              <Save className="size-4" />
              <span>{isSaving ? "Saving role..." : "Save Role"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Live Preview View */
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="size-4 text-primary" />
              <span>
                Previewing: <strong className="text-foreground">{title || "Untitled Role"}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className="text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              Return to editor
            </button>
          </div>

          {/* Role Preview Card */}
          <div className="rounded-2xl border border-border bg-background p-6 sm:p-10 max-w-3xl mx-auto space-y-10 shadow-xs">
            {/* Header */}
            <div className="space-y-4 border-b border-border pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <Briefcase className="size-3" />
                  {department || "Department"}
                </span>
                {featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                    <Flame className="size-2.5" />
                    Hot
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.15]">
                {title || "Job Title Preview"}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {summary || "A brief role summary will appear here."}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  <MapPin className="size-2.5" />
                  {location}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <Clock className="size-2.5" />
                  {type}
                </span>
              </div>
            </div>

            {/* About */}
            {parsedAbout.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">About the role</h2>
                <div className="space-y-2 text-sm text-foreground/90 leading-relaxed">
                  {parsedAbout.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {parsedResponsibilities.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Responsibilities</h2>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {parsedResponsibilities.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {parsedRequirements.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Requirements</h2>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {parsedRequirements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nice to have */}
            {parsedNiceToHave.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Nice to have</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {parsedNiceToHave.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="inline-block size-1.5 rounded-full bg-muted-foreground/60 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* How to apply preview */}
            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">How to apply</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Applicants send their full name, intro, and CV/portfolio link on WhatsApp:{" "}
                <strong className="text-foreground">{CAREERS_WHATSAPP_DISPLAY}</strong>
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white text-xs font-semibold rounded-lg opacity-90">
                  <span>Apply on WhatsApp</span>
                  <ExternalLink className="size-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
