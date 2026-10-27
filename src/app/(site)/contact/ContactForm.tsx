"use client";

import { useState, useRef } from "react";
import { Loader2, CheckCircle2, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import { contactMessageSchema, type ContactSubmissionInput } from "@/lib/contact/schema";
import { submitContactMessage } from "@/lib/contact/actions";

export function ContactForm() {
  const [formData, setFormData] = useState<Partial<ContactSubmissionInput>>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
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

  const handleChange = (field: keyof ContactSubmissionInput, value: string) => {
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

    const clientParse = contactMessageSchema.safeParse(candidateData);
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
      const result = await submitContactMessage({
        ...clientParse.data,
        turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(result.error || "Unable to send your message. Please try again.");
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      setIsSubmitted(true);
      toast.success("Message sent successfully! Our team will respond shortly.");
    } catch {
      setFormError("A network error occurred. Please try again or reach out directly.");
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white dark:bg-[#141416] border border-[#EAEAE6] dark:border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4 min-h-[420px]">
        <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="font-display text-2xl font-bold text-[#0B0B0C] dark:text-[#FAFAF8]">
          Message Sent!
        </h3>
        <p className="font-sans text-sm text-[#57575e] dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Thank you for reaching out,{" "}
          <span className="font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]">
            {formData.name}
          </span>
          . One of our team members will review your message and reply via{" "}
          <span className="font-medium text-[#2E82F7]">{formData.email}</span> shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              name: "",
              email: "",
              phone: "",
              subject: "",
              message: "",
              hpCompanyField: "",
            });
            setFieldErrors({});
            setFormError(null);
            setTurnstileToken(null);
          }}
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#EAEAE6] dark:border-white/15 text-sm font-medium text-[#0B0B0C] dark:text-[#FAFAF8] hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <span>Send another message</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#141416] border border-[#EAEAE6] dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs">
      <header className="space-y-1 mb-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B0B0C] dark:text-[#FAFAF8]">
          Send us a message
        </h2>
        <p className="font-sans text-xs sm:text-sm text-[#57575e] dark:text-zinc-400">
          Have questions or inquiries? Drop us a note and we will reply promptly.
        </p>
      </header>

      {formError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Anti-spam Honeypot Field (hidden from genuine users) */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="contact-hp-field">Leave this empty</label>
          <input
            id="contact-hp-field"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={formData.hpCompanyField || ""}
            onChange={(e) => handleChange("hpCompanyField", e.target.value)}
          />
        </div>

        {/* Row 1: Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="contact-name"
              className="block font-sans text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              placeholder="e.g. Chinedu Okafor"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className={`w-full h-11 px-3.5 rounded-xl text-sm bg-[#FBFBFA] dark:bg-white/[0.04] border ${
                fieldErrors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-[#E8E8E4] dark:border-white/10 focus:border-[#2E82F7] focus:ring-[#2E82F7]/20"
              } text-[#0B0B0C] dark:text-white placeholder:text-[#9c9ca4] dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all`}
            />
            {fieldErrors.name && (
              <p id="name-error" className="text-xs text-red-500 mt-1">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="contact-email"
              className="block font-sans text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              placeholder="you@domain.com"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={`w-full h-11 px-3.5 rounded-xl text-sm bg-[#FBFBFA] dark:bg-white/[0.04] border ${
                fieldErrors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-[#E8E8E4] dark:border-white/10 focus:border-[#2E82F7] focus:ring-[#2E82F7]/20"
              } text-[#0B0B0C] dark:text-white placeholder:text-[#9c9ca4] dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all`}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-xs text-red-500 mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Phone number (Optional) & Subject (Required) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="contact-phone"
              className="block font-sans text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]"
            >
              Phone / WhatsApp <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              name="phone"
              placeholder="e.g. +234 803 123 4567"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              aria-invalid={!!fieldErrors.phone}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              className={`w-full h-11 px-3.5 rounded-xl text-sm bg-[#FBFBFA] dark:bg-white/[0.04] border ${
                fieldErrors.phone
                  ? "border-red-500 focus:ring-red-500"
                  : "border-[#E8E8E4] dark:border-white/10 focus:border-[#2E82F7] focus:ring-[#2E82F7]/20"
              } text-[#0B0B0C] dark:text-white placeholder:text-[#9c9ca4] dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all`}
            />
            {fieldErrors.phone && (
              <p id="phone-error" className="text-xs text-red-500 mt-1">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="contact-subject"
              className="block font-sans text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]"
            >
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-subject"
              type="text"
              name="subject"
              placeholder="What is this inquiry regarding?"
              value={formData.subject || ""}
              onChange={(e) => handleChange("subject", e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.subject}
              aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
              className={`w-full h-11 px-3.5 rounded-xl text-sm bg-[#FBFBFA] dark:bg-white/[0.04] border ${
                fieldErrors.subject
                  ? "border-red-500 focus:ring-red-500"
                  : "border-[#E8E8E4] dark:border-white/10 focus:border-[#2E82F7] focus:ring-[#2E82F7]/20"
              } text-[#0B0B0C] dark:text-white placeholder:text-[#9c9ca4] dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all`}
            />
            {fieldErrors.subject && (
              <p id="subject-error" className="text-xs text-red-500 mt-1">
                {fieldErrors.subject}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Message */}
        <div className="space-y-1.5">
          <label
            htmlFor="contact-message"
            className="block font-sans text-xs font-semibold text-[#0B0B0C] dark:text-[#FAFAF8]"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            placeholder="Type your message here (min. 10 characters)..."
            value={formData.message || ""}
            onChange={(e) => handleChange("message", e.target.value)}
            aria-required="true"
            aria-invalid={!!fieldErrors.message}
            aria-describedby={fieldErrors.message ? "message-error" : undefined}
            className={`w-full p-3.5 rounded-xl text-sm bg-[#FBFBFA] dark:bg-white/[0.04] border resize-y min-h-[120px] ${
              fieldErrors.message
                ? "border-red-500 focus:ring-red-500"
                : "border-[#E8E8E4] dark:border-white/10 focus:border-[#2E82F7] focus:ring-[#2E82F7]/20"
            } text-[#0B0B0C] dark:text-white placeholder:text-[#9c9ca4] dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all`}
          />
          {fieldErrors.message && (
            <p id="message-error" className="text-xs text-red-500 mt-1">
              {fieldErrors.message}
            </p>
          )}
        </div>

        {/* Turnstile Bot Verification */}
        {siteKey && (
          <div className="pt-1 flex flex-col items-center justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={siteKey}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => {
                setTurnstileToken(null);
                setFormError("Bot protection challenge failed. Please reload the page.");
              }}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: "auto", size: "normal" }}
            />
          </div>
        )}

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-[11px] text-[#707078] dark:text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-[#2E82F7] shrink-0" />
          <span>
            Your data is protected. Network IP is cryptographically hashed with zero raw IP storage.
          </span>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#2E82F7] hover:bg-[#256fd8] disabled:bg-[#2E82F7]/70 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E82F7] focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending Message...</span>
              </>
            ) : (
              <span>Send Message</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
