"use client";

import { useState, useRef } from "react";
import { Loader2, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import {
  ambassadorApplicationSchema,
  type AmbassadorApplicationInput,
} from "@/lib/ambassadors/schema";
import { submitAmbassadorApplication } from "@/lib/ambassadors/actions";

export function AmbassadorForm() {
  const [formData, setFormData] = useState<Partial<AmbassadorApplicationInput>>({
    fullName: "",
    email: "",
    phone: "",
    institution: "",
    state: "",
    course: "",
    level: "",
    socialHandle: "",
    whyAmbassador: "",
    referralCode: "",
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
    field: keyof AmbassadorApplicationInput,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
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
      turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
    };

    const clientParse = ambassadorApplicationSchema.safeParse(candidateData);
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
      const result = await submitAmbassadorApplication({
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
            Thank you for applying to be a Campus Ambassador for Zed. Our team will review your application and reach out to you via email or phone.
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
                institution: "",
                state: "",
                course: "",
                level: "",
                socialHandle: "",
                whyAmbassador: "",
                referralCode: "",
                consent: false,
                hpCompanyField: "",
              });
              setTurnstileToken(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 font-sans text-xs sm:text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
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
      <div
        style={{ display: "none" }}
        aria-hidden="true"
        className="hidden"
      >
        <label htmlFor="ambassador_hp_field">Company</label>
        <input
          id="ambassador_hp_field"
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
            htmlFor="ambassador_full_name"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id="ambassador_full_name"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Adebayo Adeleke"
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
            htmlFor="ambassador_email"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Email Address <span className="text-destructive">*</span>
          </label>
          <input
            id="ambassador_email"
            type="email"
            required
            autoComplete="email"
            placeholder="e.g. adebayo@example.com"
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
            htmlFor="ambassador_phone"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Phone / WhatsApp <span className="text-destructive">*</span>
          </label>
          <input
            id="ambassador_phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="e.g. 08012345678"
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

        {/* Institution */}
        <div className="space-y-1.5">
          <label
            htmlFor="ambassador_institution"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Institution <span className="text-destructive">*</span>
          </label>
          <input
            id="ambassador_institution"
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

        {/* State */}
        <div className="space-y-1.5">
          <label
            htmlFor="ambassador_state"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            State (Institution Location) <span className="text-destructive">*</span>
          </label>
          <input
            id="ambassador_state"
            type="text"
            required
            placeholder="e.g. Lagos"
            value={formData.state || ""}
            onChange={(e) => handleChange("state", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.state ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.state && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.state}</p>
          )}
        </div>

        {/* Course / Department */}
        <div className="space-y-1.5">
          <label
            htmlFor="ambassador_course"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Course / Department <span className="text-destructive">*</span>
          </label>
          <input
            id="ambassador_course"
            type="text"
            required
            placeholder="e.g. Computer Science"
            value={formData.course || ""}
            onChange={(e) => handleChange("course", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.course ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.course && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.course}</p>
          )}
        </div>

        {/* Level or Year */}
        <div className="space-y-1.5">
          <label
            htmlFor="ambassador_level"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Level / Year <span className="text-destructive">*</span>
          </label>
          <input
            id="ambassador_level"
            type="text"
            required
            placeholder="e.g. 300 Level / Year 3"
            value={formData.level || ""}
            onChange={(e) => handleChange("level", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.level ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.level && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.level}</p>
          )}
        </div>

        {/* Social Handle (Optional) */}
        <div className="space-y-1.5">
          <label
            htmlFor="ambassador_social"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Social Handle <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <input
            id="ambassador_social"
            type="text"
            placeholder="e.g. @yourhandle on X or IG"
            value={formData.socialHandle || ""}
            onChange={(e) => handleChange("socialHandle", e.target.value)}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              fieldErrors.socialHandle ? "border-destructive ring-1 ring-destructive" : "border-input"
            }`}
          />
          {fieldErrors.socialHandle && (
            <p className="font-sans text-xs text-destructive">{fieldErrors.socialHandle}</p>
          )}
        </div>
      </div>

      {/* Why you want to be an ambassador */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="ambassador_why"
            className="block font-sans text-xs font-semibold text-foreground"
          >
            Why do you want to be a Campus Ambassador? <span className="text-destructive">*</span>
          </label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {(formData.whyAmbassador || "").length} / 1000
          </span>
        </div>
        <textarea
          id="ambassador_why"
          required
          rows={4}
          placeholder="Tell us what motivates you to represent Zed on your campus and how you plan to help fellow students discover the platform (minimum 30 characters)..."
          value={formData.whyAmbassador || ""}
          onChange={(e) => handleChange("whyAmbassador", e.target.value)}
          className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed resize-y ${
            fieldErrors.whyAmbassador ? "border-destructive ring-1 ring-destructive" : "border-input"
          }`}
        />
        {fieldErrors.whyAmbassador && (
          <p className="font-sans text-xs text-destructive">{fieldErrors.whyAmbassador}</p>
        )}
      </div>

      {/* Referral Code (Optional) */}
      <div className="space-y-1.5 max-w-sm">
        <label
          htmlFor="ambassador_ref"
          className="block font-sans text-xs font-semibold text-foreground"
        >
          Referral Code <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <input
          id="ambassador_ref"
          type="text"
          placeholder="e.g. ZED123"
          value={formData.referralCode || ""}
          onChange={(e) => handleChange("referralCode", e.target.value.toUpperCase())}
          className={`w-full rounded-lg border bg-background px-3.5 py-2.5 font-sans font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary uppercase ${
            fieldErrors.referralCode ? "border-destructive ring-1 ring-destructive" : "border-input"
          }`}
        />
        {fieldErrors.referralCode && (
          <p className="font-sans text-xs text-destructive">{fieldErrors.referralCode}</p>
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
            I consent to Zed processing my personal information for the purpose of evaluating and administering my campus ambassador application in accordance with the Privacy Policy.
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

