"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  XCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import {
  INTERNSHIP_FIELDS,
  INTERNSHIP_WORK_MODES,
  INTERNSHIP_TYPES,
  INTERNSHIP_PAID_STATUSES,
} from "@/lib/internships/constants";
import {
  submitInternshipSchema,
  type SubmitInternshipInput,
} from "@/lib/internships/validation";
import {
  submitInternshipLeadAction,
  fetchMyInternshipSubmissionsAction,
} from "@/lib/internships/actions";
import type { MyInternshipSubmission } from "@/lib/internships/types";

export function SubmitInternshipClient() {
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [formData, setFormData] = useState<Partial<SubmitInternshipInput>>({
    title: "",
    organization: "",
    location: "",
    work_mode: "remote",
    field: "tech",
    type: "internship",
    paid_status: "paid",
    description: "",
    eligibility: "",
    apply_url: "",
    apply_email: "",
    deadline: "",
    feeConfirmation: true,
    hpCompanyField: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [mySubmissions, setMySubmissions] = useState<MyInternshipSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  const isProd = process.env.NODE_ENV === "production";

  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetchMyInternshipSubmissionsAction();
      if (res.ok && res.data) {
        setMySubmissions(res.data);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleTabSwitch = (tab: "submit" | "history") => {
    setActiveTab(tab);
    if (tab === "history") {
      void loadSubmissions();
    }
  };

  const handleChange = (
    field: keyof SubmitInternshipInput,
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

    const candidateData = {
      ...formData,
      turnstileToken: turnstileToken || (isProd ? "" : "bypass"),
    };

    const clientParse = submitInternshipSchema.safeParse(candidateData);
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
      const res = await submitInternshipLeadAction(candidateData as SubmitInternshipInput);
      if (!res.ok) {
        setFormError(res.error || "Submission failed. Please try again.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        toast.error(res.error || "Submission failed");
        return;
      }

      setSubmittedTitle(candidateData.title || "Opportunity");
      setIsSubmitted(true);
      toast.success("Opportunity lead submitted successfully!");
    } catch {
      setFormError("A network error occurred. Please try again.");
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({
      title: "",
      organization: "",
      location: "",
      work_mode: "remote",
      field: "tech",
      type: "internship",
      paid_status: "paid",
      description: "",
      eligibility: "",
      apply_url: "",
      apply_email: "",
      deadline: "",
      feeConfirmation: true,
      hpCompanyField: "",
    });
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* ── Page Header ── */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Submit an Opportunity Lead
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Know of an open internship, SIWES role, or graduate trainee program? Submit it for review. Once verified by our team, it will appear publicly on the Internship Radar.
        </p>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => handleTabSwitch("submit")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "submit"
              ? "border-[#2E82F7] text-[#2E82F7]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          Submit Opportunity
        </button>
        <button
          onClick={() => handleTabSwitch("history")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-[#2E82F7] text-[#2E82F7]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          My Submissions
        </button>
      </div>

      {activeTab === "history" ? (
        /* ── My Submissions Tab ── */
        <div className="space-y-4">
          {loadingSubmissions ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading your submissions...</span>
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-2">
              <Clock className="h-8 w-8 text-zinc-400 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                No submissions yet
              </h3>
              <p className="text-xs text-zinc-500">
                You haven&apos;t submitted any internship leads yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {sub.organization} • {sub.location}
                      </p>
                    </div>

                    <div>
                      {sub.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                          <Clock className="h-3 w-3" />
                          Under Review
                        </span>
                      )}
                      {sub.status === "published" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                          <CheckCircle2 className="h-3 w-3" />
                          Published
                        </span>
                      )}
                      {sub.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </span>
                      )}
                      {sub.status === "expired" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  {sub.status === "rejected" && sub.rejection_reason && (
                    <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-300">
                      <strong>Reason from moderation:</strong> {sub.rejection_reason}
                    </div>
                  )}

                  {sub.status === "published" && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                      <Link
                        href={`/internships/${sub.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E82F7] hover:underline"
                      >
                        <span>View live opportunity</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isSubmitted ? (
        /* ── Success Confirmation Screen ── */
        <div className="bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            Thanks! We&apos;ll review your submission before it appears.
          </h2>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Your lead for <strong>&ldquo;{submittedTitle}&rdquo;</strong> has been routed to our moderation queue. Once our team checks the details and confirms there are no application fees, it will go live on the radar.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#2E82F7] hover:bg-[#256fd1] text-white transition-colors"
            >
              Submit Another Lead
            </button>
            <button
              onClick={() => handleTabSwitch("history")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
            >
              View My Submissions
            </button>
          </div>
        </div>
      ) : (
        /* ── Submit Form ── */
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Honeypot hidden input */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="internship-hp">Company Name</label>
            <input
              id="internship-hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData.hpCompanyField || ""}
              onChange={(e) => handleChange("hpCompanyField", e.target.value)}
            />
          </div>

          <div className="bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Row 1: Title & Organization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Opportunity Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineering Intern"
                  value={formData.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border ${
                    fieldErrors.title ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
                  } text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20`}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-red-500">{fieldErrors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Organization / Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flutterwave, Paystack, MTN"
                  value={formData.organization || ""}
                  onChange={(e) => handleChange("organization", e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border ${
                    fieldErrors.organization ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
                  } text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20`}
                />
                {fieldErrors.organization && (
                  <p className="text-xs text-red-500">{fieldErrors.organization}</p>
                )}
              </div>
            </div>

            {/* Row 2: Location & Work Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Location (City / State) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lagos, Abuja, Ibadan, or Nationwide"
                  value={formData.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border ${
                    fieldErrors.location ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
                  } text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20`}
                />
                {fieldErrors.location && (
                  <p className="text-xs text-red-500">{fieldErrors.location}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Work Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.work_mode || "remote"}
                  onChange={(e) => handleChange("work_mode", e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20"
                >
                  {INTERNSHIP_WORK_MODES.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Field, Program Type, Paid Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Field / Discipline <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.field || "tech"}
                  onChange={(e) => handleChange("field", e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20"
                >
                  {INTERNSHIP_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type || "internship"}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20"
                >
                  {INTERNSHIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Compensation <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paid_status || "paid"}
                  onChange={(e) => handleChange("paid_status", e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20"
                >
                  {INTERNSHIP_PAID_STATUSES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Description &amp; Key Responsibilities <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Describe what the role involves, expected tasks, learning opportunities..."
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className={`w-full p-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border ${
                  fieldErrors.description ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
                } text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20`}
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Minimum 30 characters</span>
                <span>{(formData.description || "").length}/3,000</span>
              </div>
              {fieldErrors.description && (
                <p className="text-xs text-red-500">{fieldErrors.description}</p>
              )}
            </div>

            {/* Row 5: Eligibility Criteria (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Eligibility &amp; Requirements (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Open to 300L/400L students in Computer Science or Electrical Engineering."
                value={formData.eligibility || ""}
                onChange={(e) => handleChange("eligibility", e.target.value)}
                className="w-full p-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20"
              />
            </div>

            {/* Row 6: Apply URL & Apply Email & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Application URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.apply_url || ""}
                  onChange={(e) => handleChange("apply_url", e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border ${
                    fieldErrors.apply_url ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
                  } text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20`}
                />
                {fieldErrors.apply_url && (
                  <p className="text-xs text-red-500">{fieldErrors.apply_url}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Application Email
                </label>
                <input
                  type="email"
                  placeholder="careers@company.com"
                  value={formData.apply_email || ""}
                  onChange={(e) => handleChange("apply_email", e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border ${
                    fieldErrors.apply_email ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
                  } text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20`}
                />
                {fieldErrors.apply_email && (
                  <p className="text-xs text-red-500">{fieldErrors.apply_email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline || ""}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border ${
                    fieldErrors.deadline ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
                  } text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E82F7]/20`}
                />
                {fieldErrors.deadline && (
                  <p className="text-xs text-red-500">{fieldErrors.deadline}</p>
                )}
              </div>
            </div>

            {/* ── Required Fee Confirmation Checkbox (Requirement 5) ── */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(formData.feeConfirmation)}
                  onChange={(e) => handleChange("feeConfirmation", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#2E82F7] focus:ring-[#2E82F7]"
                />
                <span className="text-xs sm:text-sm font-semibold text-amber-950 dark:text-amber-100">
                  I confirm this opportunity does not charge applicants any fee.
                </span>
              </label>
              <p className="text-xs text-amber-800 dark:text-amber-300 pl-7 leading-relaxed">
                Zed maintains a strict zero-fee policy. Any opportunity requiring registration, test, kit, or processing fees will be rejected immediately.
              </p>
              {fieldErrors.feeConfirmation && (
                <p className="text-xs text-red-500 font-medium pl-7">
                  {fieldErrors.feeConfirmation}
                </p>
              )}
            </div>

            {/* Cloudflare Turnstile */}
            {siteKey && (
              <div className="flex justify-center pt-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                />
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-sm font-semibold bg-[#2E82F7] hover:bg-[#256fd1] disabled:opacity-60 text-white shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Opportunity...</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Review</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
