"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import {
  mentorshipApplicationSchema,
  type MentorshipApplicationInput,
  EXPERIENCE_LEVEL_OPTIONS,
  PREFERRED_FORMAT_OPTIONS,
} from "@/lib/mentorship/schema";
import { submitMentorshipApplication } from "@/lib/mentorship/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MentorshipForm() {
  const [formData, setFormData] = useState<
    Partial<MentorshipApplicationInput> & { ageRaw: string }
  >({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    age: undefined,
    ageRaw: "",
    institution: "",
    isStudent: false,
    interestArea: "",
    experienceLevel: undefined,
    skills: "",
    goals: "",
    availability: "",
    preferredFormat: undefined,
    consent: false,
    hpCompanyField: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  const isProd = process.env.NODE_ENV === "production";

  const handleChange = (
    field: keyof MentorshipApplicationInput | "ageRaw",
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const schemaKey = field === "ageRaw" ? "age" : field;
    if (fieldErrors[schemaKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[schemaKey];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const candidateData = {
      ...formData,
      age: formData.ageRaw !== "" ? Number(formData.ageRaw) : undefined,
      turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
    };

    const clientParse = mentorshipApplicationSchema.safeParse(candidateData);
    if (!clientParse.success) {
      const errMap: Record<string, string> = {};
      for (const issue of clientParse.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errMap[key]) {
          errMap[key] = issue.message;
        }
      }
      setFieldErrors(errMap);
      setFormError("Please correct the highlighted fields before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitMentorshipApplication({
        ...clientParse.data,
        turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(
          result.error || "Unable to submit your application. Please try again."
        );
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch {
      setFormError("A network error occurred. Please try again.");
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sm:p-10 shadow-xs text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            Application Received
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            Thank you for applying for mentorship with Zed. Applying is free. Our team will review your application and reach out to you by email if matched.
          </p>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                fullName: "",
                email: "",
                phone: "",
                location: "",
                age: undefined,
                ageRaw: "",
                institution: "",
                isStudent: false,
                interestArea: "",
                experienceLevel: undefined,
                skills: "",
                goals: "",
                availability: "",
                preferredFormat: undefined,
                consent: false,
                hpCompanyField: "",
              });
              setTurnstileToken(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 font-sans text-xs sm:text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            <span>Submit another application</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6"
    >
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="font-sans text-xs sm:text-sm font-medium">{formError}</p>
        </div>
      )}

      {/* Honeypot field (hidden from sighted and screen-reader users) */}
      <div style={{ display: "none" }} aria-hidden="true" className="hidden">
        <label htmlFor="mentorship_hp_field">Company</label>
        <input
          id="mentorship_hp_field"
          type="text"
          name="hpCompanyField"
          tabIndex={-1}
          autoComplete="off"
          value={formData.hpCompanyField || ""}
          onChange={(e) => handleChange("hpCompanyField", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_full_name"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_full_name"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Chidinma Okafor"
            value={formData.fullName || ""}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.fullName ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.fullName && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_email"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Email Address <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_email"
            type="email"
            required
            autoComplete="email"
            placeholder="e.g. chidinma@example.com"
            value={formData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.email ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.email && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        {/* Phone / WhatsApp */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_phone"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Phone / WhatsApp <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="e.g. 08098765432"
            value={formData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.phone ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.phone && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.phone}</p>
          )}
        </div>

        {/* Location (State / City) */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_location"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Location (State / City) <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_location"
            type="text"
            required
            placeholder="e.g. Ikeja, Lagos"
            value={formData.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.location ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.location && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.location}</p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_age"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Age <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_age"
            type="number"
            required
            min={21}
            max={100}
            inputMode="numeric"
            placeholder="e.g. 22"
            value={formData.ageRaw || ""}
            onChange={(e) => handleChange("ageRaw", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.age ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.age && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.age}</p>
          )}
        </div>

        {/* Area of Interest — free text */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_interest_area"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Area of Interest <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_interest_area"
            type="text"
            required
            placeholder="e.g. web development, data analysis, UI design"
            value={formData.interestArea || ""}
            onChange={(e) => handleChange("interestArea", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.interestArea ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.interestArea && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.interestArea}</p>
          )}
        </div>

        {/* Experience Level — shadcn Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_experience_level"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Experience Level <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.experienceLevel || ""}
            onValueChange={(val) => handleChange("experienceLevel", val)}
          >
            <SelectTrigger
              id="mentorship_experience_level"
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                fieldErrors.experienceLevel
                  ? "border-destructive ring-1 ring-destructive"
                  : "border-input"
              }`}
            >
              <SelectValue placeholder="Select current experience level" />
            </SelectTrigger>
            <SelectContent position="popper">
              {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.experienceLevel && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.experienceLevel}</p>
          )}
        </div>

        {/* Availability */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_availability"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Availability <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_availability"
            type="text"
            required
            placeholder="e.g. Weekends or weekday evenings (5-8 hrs/week)"
            value={formData.availability || ""}
            onChange={(e) => handleChange("availability", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.availability ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.availability && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.availability}</p>
          )}
        </div>

        {/* Preferred Format — shadcn Select */}
        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor="mentorship_preferred_format"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Preferred Format <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.preferredFormat || ""}
            onValueChange={(val) => handleChange("preferredFormat", val)}
          >
            <SelectTrigger
              id="mentorship_preferred_format"
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                fieldErrors.preferredFormat
                  ? "border-destructive ring-1 ring-destructive"
                  : "border-input"
              }`}
            >
              <SelectValue placeholder="Select preferred engagement format" />
            </SelectTrigger>
            <SelectContent position="popper">
              {PREFERRED_FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.preferredFormat && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.preferredFormat}</p>
          )}
        </div>
      </div>

      {/* Your skills */}
      <div className="space-y-1.5">
        <label
          htmlFor="mentorship_skills"
          className="block font-sans text-xs font-semibold text-foreground"
        >
          Your Skills <span className="text-destructive">*</span>
        </label>
        <p className="font-sans text-xs text-muted-foreground">
          List at least one skill you already have.
        </p>
        <input
          id="mentorship_skills"
          type="text"
          required
          placeholder="e.g. HTML, Python basics, Figma, Microsoft Excel"
          value={formData.skills || ""}
          onChange={(e) => handleChange("skills", e.target.value)}
          className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            fieldErrors.skills ? "border-destructive ring-1 ring-destructive" : "border-input"
          }`}
        />
        {fieldErrors.skills && (
          <p className="font-sans text-xs text-destructive">{fieldErrors.skills}</p>
        )}
      </div>

      {/* Goals with character counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="mentorship_goals"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Goals &amp; What You Hope to Learn <span className="text-destructive">*</span>
          </label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {(formData.goals || "").length} / 1000
          </span>
        </div>
        <textarea
          id="mentorship_goals"
          required
          rows={4}
          placeholder="Describe your learning objectives, what skills you are looking to develop, and any projects you want to build (minimum 20 characters)..."
          value={formData.goals || ""}
          onChange={(e) => handleChange("goals", e.target.value)}
          className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed resize-y ${
            fieldErrors.goals ? "border-destructive ring-1 ring-destructive" : "border-input"
          }`}
        />
        {fieldErrors.goals && (
          <p className="font-sans text-xs text-destructive">{fieldErrors.goals}</p>
        )}
      </div>

      {/* University section */}
      <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
        <p className="font-sans text-xs font-semibold text-foreground">
          University Details <span className="text-destructive">*</span>
        </p>

        {/* University name */}
        <div className="space-y-1.5">
          <label
            htmlFor="mentorship_institution"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            University <span className="text-destructive">*</span>
          </label>
          <input
            id="mentorship_institution"
            type="text"
            required
            placeholder="e.g. University of Lagos"
            value={formData.institution || ""}
            onChange={(e) => handleChange("institution", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.institution ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.institution && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.institution}</p>
          )}
        </div>

        {/* Student confirmation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={formData.isStudent || false}
            onChange={(e) => handleChange("isStudent", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
          />
          <span className="font-sans text-xs text-foreground leading-normal">
            I am currently a student at a university{" "}
            <span className="text-destructive">*</span>
          </span>
        </label>
        {fieldErrors.isStudent && (
          <p className="font-sans text-xs text-destructive">{fieldErrors.isStudent}</p>
        )}
      </div>

      {/* Consent Checkbox */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={formData.consent || false}
            onChange={(e) => handleChange("consent", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
          />
          <span className="font-sans text-xs text-muted-foreground leading-normal">
            I consent to Zed processing my personal information for the purpose of evaluating and administering my mentorship application in accordance with the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {fieldErrors.consent && (
          <p className="font-sans text-xs text-destructive">{fieldErrors.consent}</p>
        )}
      </div>

      {/* Cloudflare Turnstile */}
      {siteKey && (
        <div className="flex justify-center sm:justify-start pt-1">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-sans text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <span>Submit Application</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
