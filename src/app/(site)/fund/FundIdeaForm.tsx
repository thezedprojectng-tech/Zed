"use client";

import { useState, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
  FUNDING_CATEGORIES,
  FUNDING_STAGES,
  fundingSubmissionSchema,
  type FundingSubmissionInput,
} from "@/lib/funding/schema";
import { submitFundingIdea } from "@/lib/funding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

export function FundIdeaForm() {
  const [formData, setFormData] = useState<Partial<FundingSubmissionInput>>({
    fullName: "",
    email: "",
    phone: "",
    projectTitle: "",
    category: "",
    stage: undefined,
    fundingNeededNgn: undefined,
    summary: "",
    problem: "",
    plan: "",
    link: "",
    consent: false,
    hpCompanyField: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  const isProd = process.env.NODE_ENV === "production";

  const handleChange = (
    field: keyof FundingSubmissionInput,
    value: unknown
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

    // Client-side Zod validation
    const candidateData = {
      ...formData,
      turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
    };

    const clientParse = fundingSubmissionSchema.safeParse(candidateData);
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
      const result = await submitFundingIdea({
        ...clientParse.data,
        turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(
          result.error || "Unable to submit your proposal. Please try again."
        );
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("[FundIdeaForm] Submission error:", err);
      setFormError("A network error occurred. Please check your connection and try again.");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center space-y-6 shadow-sm max-w-2xl mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Thanks, we received your idea.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            The Zed team will review it and contact you by email.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-muted/40 text-xs sm:text-sm text-muted-foreground space-y-1 text-left">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            Important Note
          </div>
          <p>
            Submitting an idea does not guarantee funding. All applications are evaluated
            strictly on feasibility, clarity, and team execution capability.
          </p>
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsSuccess(false);
              setFormData({
                fullName: "",
                email: "",
                phone: "",
                projectTitle: "",
                category: "",
                stage: undefined,
                fundingNeededNgn: undefined,
                summary: "",
                problem: "",
                plan: "",
                link: "",
                consent: false,
                hpCompanyField: "",
              });
              setTurnstileToken(null);
              turnstileRef.current?.reset();
            }}
          >
            Submit Another Proposal
          </Button>
        </div>
      </section>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-8"
    >
      {/* Honeypot anti-bot field */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="hp_company_field">Leave this field blank</label>
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
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{formError}</p>
        </div>
      )}

      {/* ── Section 1: Contact Information ─────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground border-b border-border/60 pb-2 w-full">
          1. Your Contact Details
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Amina Bello"
              value={formData.fullName || ""}
              onChange={(e) => handleChange("fullName", e.target.value)}
              aria-invalid={!!fieldErrors.fullName}
              maxLength={120}
              required
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. amina@example.com"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!fieldErrors.email}
              maxLength={255}
              required
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="phone" className="text-xs font-medium">
              Phone / WhatsApp Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. +234 801 234 5678"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              aria-invalid={!!fieldErrors.phone}
              maxLength={30}
              required
            />
            {fieldErrors.phone && (
              <p className="text-xs text-destructive">{fieldErrors.phone}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ── Section 2: Project Profile ──────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground border-b border-border/60 pb-2 w-full">
          2. Project Profile
        </legend>

        <div className="space-y-4">
          {/* Project Title */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="projectTitle" className="text-xs font-medium">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {(formData.projectTitle || "").length}/120
              </span>
            </div>
            <Input
              id="projectTitle"
              placeholder="e.g. FarmLink Logistics"
              value={formData.projectTitle || ""}
              onChange={(e) => handleChange("projectTitle", e.target.value)}
              aria-invalid={!!fieldErrors.projectTitle}
              maxLength={120}
              required
            />
            {fieldErrors.projectTitle && (
              <p className="text-xs text-destructive">{fieldErrors.projectTitle}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-medium">
                Industry Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(val) => handleChange("category", val)}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category && (
                <p className="text-xs text-destructive">{fieldErrors.category}</p>
              )}
            </div>

            {/* Stage */}
            <div className="space-y-1.5">
              <Label htmlFor="stage" className="text-xs font-medium">
                Current Stage <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.stage}
                onValueChange={(val) => handleChange("stage", val)}
              >
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue placeholder="Select project stage" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.stage && (
                <p className="text-xs text-destructive">{fieldErrors.stage}</p>
              )}
            </div>
          </div>

          {/* Funding Needed in Naira */}
          <div className="space-y-1.5">
            <Label htmlFor="fundingNeededNgn" className="text-xs font-medium">
              Funding Needed (₦ NGN) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold select-none">
                ₦
              </span>
              <Input
                id="fundingNeededNgn"
                type="number"
                min="1000"
                step="1000"
                placeholder="e.g. 500000"
                className="pl-8 font-mono"
                value={formData.fundingNeededNgn !== undefined ? formData.fundingNeededNgn : ""}
                onChange={(e) =>
                  handleChange(
                    "fundingNeededNgn",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                aria-invalid={!!fieldErrors.fundingNeededNgn}
                required
              />
            </div>
            {fieldErrors.fundingNeededNgn && (
              <p className="text-xs text-destructive">{fieldErrors.fundingNeededNgn}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ── Section 3: Proposal Details ─────────────────────────────────────── */}
      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-foreground border-b border-border/60 pb-2 w-full">
          3. Proposal & Pitch Details
        </legend>

        {/* Summary */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="summary" className="text-xs font-medium">
              One-Paragraph Summary <span className="text-destructive">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {(formData.summary || "").length}/1500
            </span>
          </div>
          <Textarea
            id="summary"
            rows={3}
            placeholder="Briefly describe what your venture does and its core value proposition..."
            value={formData.summary || ""}
            onChange={(e) => handleChange("summary", e.target.value)}
            aria-invalid={!!fieldErrors.summary}
            maxLength={1500}
            required
          />
          {fieldErrors.summary && (
            <p className="text-xs text-destructive">{fieldErrors.summary}</p>
          )}
        </div>

        {/* Problem */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="problem" className="text-xs font-medium">
              The Problem It Solves <span className="text-destructive">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {(formData.problem || "").length}/2000
            </span>
          </div>
          <Textarea
            id="problem"
            rows={4}
            placeholder="Who experiences this problem? How do they currently solve it, and why is your approach significantly better?..."
            value={formData.problem || ""}
            onChange={(e) => handleChange("problem", e.target.value)}
            aria-invalid={!!fieldErrors.problem}
            maxLength={2000}
            required
          />
          {fieldErrors.problem && (
            <p className="text-xs text-destructive">{fieldErrors.problem}</p>
          )}
        </div>

        {/* Plan for the money */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="plan" className="text-xs font-medium">
              Plan for the Money <span className="text-destructive">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {(formData.plan || "").length}/2000
            </span>
          </div>
          <Textarea
            id="plan"
            rows={4}
            placeholder="How specifically will this capital be deployed (e.g. equipment, prototyping, CAC registration, inventory)?..."
            value={formData.plan || ""}
            onChange={(e) => handleChange("plan", e.target.value)}
            aria-invalid={!!fieldErrors.plan}
            maxLength={2000}
            required
          />
          {fieldErrors.plan && (
            <p className="text-xs text-destructive">{fieldErrors.plan}</p>
          )}
        </div>

        {/* Optional Link */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="link" className="text-xs font-medium">
              Pitch Deck, Website, or Demo Link <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
          </div>
          <Input
            id="link"
            type="url"
            placeholder="https://drive.google.com/... or https://yourproject.com"
            value={formData.link || ""}
            onChange={(e) => handleChange("link", e.target.value)}
            aria-invalid={!!fieldErrors.link}
            maxLength={500}
          />
          {fieldErrors.link && (
            <p className="text-xs text-destructive">{fieldErrors.link}</p>
          )}
        </div>
      </fieldset>

      {/* ── Section 4: Consent & Turnstile ──────────────────────────────────── */}
      <div className="space-y-5 pt-2 border-t border-border/60">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={formData.consent === true}
            onCheckedChange={(checked) => handleChange("consent", checked === true)}
            aria-invalid={!!fieldErrors.consent}
          />
          <Label
            htmlFor="consent"
            className="text-xs sm:text-sm text-muted-foreground font-normal leading-snug cursor-pointer select-none"
          >
            I confirm this information is accurate and I agree to be contacted.
          </Label>
        </div>
        {fieldErrors.consent && (
          <p className="text-xs text-destructive">{fieldErrors.consent}</p>
        )}

        {/* Cloudflare Turnstile */}
        {siteKey && (
          <div className="pt-2">
            <Turnstile
              ref={turnstileRef}
              siteKey={siteKey}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
            />
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Proposal...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Idea for Review
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
