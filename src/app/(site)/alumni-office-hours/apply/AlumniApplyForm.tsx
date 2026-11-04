"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowRight, AlertCircle, ExternalLink } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import {
  alumniApplicationSchema,
  type AlumniApplicationInput,
} from "@/lib/alumni-office-hours/schema";
import { submitAlumniApplication } from "@/lib/alumni-office-hours/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function AlumniApplyForm() {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<
    Omit<AlumniApplicationInput, "graduationYear"> & {
      gradYearRaw: string;
      hpCompanyField?: string;
    }
  >({
    fullName: "",
    email: "",
    gradYearRaw: "",
    institution: "",
    field: "",
    occupation: "",
    bio: "",
    topics: "",
    availability: "",
    contactUrl: "",
    consentPublic: false,
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
    field: keyof typeof formData,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const schemaKey = field === "gradYearRaw" ? "graduationYear" : field;
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

    const gradYearNum =
      formData.gradYearRaw.trim() !== "" ? Number(formData.gradYearRaw) : NaN;

    const candidateData = {
      fullName: formData.fullName,
      email: formData.email,
      graduationYear: isNaN(gradYearNum) ? undefined : gradYearNum,
      institution: formData.institution,
      field: formData.field,
      occupation: formData.occupation,
      bio: formData.bio,
      topics: formData.topics,
      availability: formData.availability,
      contactUrl: formData.contactUrl,
      consentPublic: formData.consentPublic,
      hpCompanyField: formData.hpCompanyField,
      turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
    };

    const clientParse = alumniApplicationSchema.safeParse(candidateData);
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
      const result = await submitAlumniApplication({
        ...clientParse.data,
        hpCompanyField: formData.hpCompanyField,
        turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(
          result.error || "We could not process your application. Please try again."
        );
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch {
      setFormError("A network error occurred. Please try submitting again.");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section
        aria-labelledby="success-heading"
        className="text-center py-10 sm:py-16 space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <h2 id="success-heading" className="text-2xl font-bold tracking-tight text-foreground font-display">
            Application Received!
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Thank you for volunteering to mentor students through Alumni Office Hours. Our team reviews every profile to verify details before publishing it to the public directory.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-4 max-w-md mx-auto text-xs text-muted-foreground leading-relaxed text-left space-y-1.5">
          <p className="font-semibold text-foreground">What happens next?</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>We review your credentials and contact link within 2-3 business days.</li>
            <li>Once approved, your profile will be live in the directory.</li>
            <li>You can request changes or removal anytime via our Contact page.</li>
          </ul>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/alumni-office-hours">Return to Alumni Directory</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-8 font-sans">
      {/* Honeypot anti-bot input */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="hp_company_field">Do not fill this out if you are human</label>
        <input
          id="hp_company_field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.hpCompanyField || ""}
          onChange={(e) => handleChange("hpCompanyField", e.target.value)}
        />
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to submit application</p>
            <p>{formError}</p>
          </div>
        </div>
      )}

      {/* Basic Personal Information */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground border-b border-border pb-2 w-full">
          1. Personal &amp; Academic Background
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-xs font-semibold text-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="fullName"
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Adebayo Olawale"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              aria-invalid={!!fieldErrors.fullName}
              className={fieldErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {fieldErrors.fullName && (
              <p className="text-[11px] text-destructive">{fieldErrors.fullName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-foreground">
              Email Address <span className="text-destructive">*</span>
            </label>
            <Input
              id="email"
              type="email"
              required
              maxLength={255}
              placeholder="adebayo@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!fieldErrors.email}
              className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            <p className="text-[10px] text-muted-foreground">
              Kept private. Used strictly for administrative review notifications.
            </p>
            {fieldErrors.email && (
              <p className="text-[11px] text-destructive">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="institution" className="text-xs font-semibold text-foreground">
              University / Polytechnic <span className="text-destructive">*</span>
            </label>
            <Input
              id="institution"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. University of Lagos (UNILAG)"
              value={formData.institution}
              onChange={(e) => handleChange("institution", e.target.value)}
              aria-invalid={!!fieldErrors.institution}
              className={fieldErrors.institution ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {fieldErrors.institution && (
              <p className="text-[11px] text-destructive">{fieldErrors.institution}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gradYearRaw" className="text-xs font-semibold text-foreground">
              Graduation Year <span className="text-destructive">*</span>
            </label>
            <Input
              id="gradYearRaw"
              type="number"
              min={1970}
              max={currentYear}
              step={1}
              required
              placeholder={`e.g. 2019 (1970 - ${currentYear})`}
              value={formData.gradYearRaw}
              onChange={(e) => handleChange("gradYearRaw", e.target.value)}
              aria-invalid={!!fieldErrors.graduationYear}
              className={fieldErrors.graduationYear ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            <p className="text-[10px] text-muted-foreground">
              Must be between 1970 and {currentYear}. Future years cannot apply.
            </p>
            {fieldErrors.graduationYear && (
              <p className="text-[11px] text-destructive">{fieldErrors.graduationYear}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Professional Background */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground border-b border-border pb-2 w-full">
          2. Current Role &amp; Area of Expertise
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="occupation" className="text-xs font-semibold text-foreground">
              Current Occupation / Role <span className="text-destructive">*</span>
            </label>
            <Input
              id="occupation"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Senior Product Designer at Moniepoint"
              value={formData.occupation}
              onChange={(e) => handleChange("occupation", e.target.value)}
              aria-invalid={!!fieldErrors.occupation}
              className={fieldErrors.occupation ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {fieldErrors.occupation && (
              <p className="text-[11px] text-destructive">{fieldErrors.occupation}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="field" className="text-xs font-semibold text-foreground">
              Field / Domain <span className="text-destructive">*</span>
            </label>
            <Input
              id="field"
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Software Engineering, FinTech, Data"
              value={formData.field}
              onChange={(e) => handleChange("field", e.target.value)}
              aria-invalid={!!fieldErrors.field}
              className={fieldErrors.field ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {fieldErrors.field && (
              <p className="text-[11px] text-destructive">{fieldErrors.field}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-xs font-semibold text-foreground">
            Short Bio (20 to 600 characters) <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="bio"
            required
            rows={3}
            maxLength={600}
            placeholder="Briefly describe your career path, your current focus, and what motivates you to mentor students..."
            value={formData.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            aria-invalid={!!fieldErrors.bio}
            className={fieldErrors.bio ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Minimum 20 characters</span>
            <span>{formData.bio.length} / 600</span>
          </div>
          {fieldErrors.bio && (
            <p className="text-[11px] text-destructive">{fieldErrors.bio}</p>
          )}
        </div>
      </fieldset>

      {/* Mentorship Offerings & Contact Link */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground border-b border-border pb-2 w-full">
          3. Mentorship Details &amp; Contact Channel
        </legend>

        <div className="space-y-1.5">
          <label htmlFor="topics" className="text-xs font-semibold text-foreground">
            Topics you can advise on <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="topics"
            required
            rows={2}
            maxLength={300}
            placeholder="e.g. Resume reviews, frontend architecture, breaking into international remote roles, SIWES prep"
            value={formData.topics}
            onChange={(e) => handleChange("topics", e.target.value)}
            aria-invalid={!!fieldErrors.topics}
            className={fieldErrors.topics ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.topics && (
            <p className="text-[11px] text-destructive">{fieldErrors.topics}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="availability" className="text-xs font-semibold text-foreground">
            Availability &amp; Format <span className="text-destructive">*</span>
          </label>
          <Input
            id="availability"
            type="text"
            required
            maxLength={200}
            placeholder="e.g. 1 hour on Saturday mornings via LinkedIn DMs or Google Meet"
            value={formData.availability}
            onChange={(e) => handleChange("availability", e.target.value)}
            aria-invalid={!!fieldErrors.availability}
            className={fieldErrors.availability ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {fieldErrors.availability && (
            <p className="text-[11px] text-destructive">{fieldErrors.availability}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contactUrl" className="text-xs font-semibold text-foreground">
            Public Contact Link (LinkedIn or X/Twitter profile) <span className="text-destructive">*</span>
          </label>
          <Input
            id="contactUrl"
            type="url"
            required
            maxLength={200}
            placeholder="https://www.linkedin.com/in/yourname or https://x.com/yourhandle"
            value={formData.contactUrl}
            onChange={(e) => handleChange("contactUrl", e.target.value)}
            aria-invalid={!!fieldErrors.contactUrl}
            className={fieldErrors.contactUrl ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          <p className="text-[10px] text-muted-foreground">
            Must start with https:// and belong to linkedin.com or x.com / twitter.com. This is the link students will click to reach you.
          </p>
          {fieldErrors.contactUrl && (
            <p className="text-[11px] text-destructive">{fieldErrors.contactUrl}</p>
          )}
        </div>
      </fieldset>

      {/* Consent & Privacy Notice */}
      <fieldset className="space-y-4 border-t border-border pt-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consentPublic"
            checked={formData.consentPublic}
            onCheckedChange={(checked) => handleChange("consentPublic", checked === true)}
            aria-invalid={!!fieldErrors.consentPublic}
            className="mt-1"
          />
          <div className="space-y-1">
            <label
              htmlFor="consentPublic"
              className="text-xs font-medium text-foreground leading-snug cursor-pointer block"
            >
              I agree that, if approved, my name, institution, occupation, bio, topics, availability and this link will be shown publicly on Zed. I can ask for removal at any time. <span className="text-destructive">*</span>
            </label>
            {fieldErrors.consentPublic && (
              <p className="text-[11px] text-destructive">{fieldErrors.consentPublic}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Cloudflare Turnstile */}
      {siteKey && (
        <div className="flex flex-col items-center justify-center pt-2">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
          {fieldErrors.turnstileToken && (
            <p className="text-[11px] text-destructive mt-1">
              {fieldErrors.turnstileToken}
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto h-11 px-8 text-sm font-semibold shadow-sm gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <span>Submit Volunteer Application</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

