"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Award,
  Check,
  Clock,
  Copy,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  requestCertificateAction,
  type SkillCourseStatus,
  type SkillPublicSettings,
  type SkillQuizSummary,
} from "@/lib/skill/actions";
import { parseCertificateLayout, type CertificateLayout } from "@/lib/certificate/layout";
import { renderCertificateToCanvas } from "@/lib/certificate/render";
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  formatCertificateDate,
  getCertificateTemplateUrl,
  getCertificateVerifyUrl,
} from "@/lib/certificate/download";
import {
  getWhatsAppShareUrl,
  hasSeenCelebration,
  markCelebrationSeen,
} from "@/lib/certificate/celebrate";
import {
  CertificateReadyDialog,
  CourseCompleteDialog,
} from "@/components/skill/CertificateCelebrationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, pluralize } from "@/lib/utils";

interface CourseCertificateCardProps {
  track: {
    id: string;
    slug: string;
    title: string;
    price_ngn: number;
    certificate_enabled: boolean;
    certificate_template_path: string | null;
    certificate_layout: CertificateLayout | null;
  };
  courseStatus: SkillCourseStatus | null;
  publicSettings: SkillPublicSettings;
  holderName: string;
  completedCount: number;
  totalCount: number;
  earnedPoints: number;
  quizzes: SkillQuizSummary[];
}

export function CourseCertificateCard({
  track,
  courseStatus,
  publicSettings,
  holderName,
  completedCount,
  totalCount,
  earnedPoints,
  quizzes,
}: CourseCertificateCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [downloadingType, setDownloadingType] = useState<"png" | "pdf" | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const [payerName, setPayerName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [issuedCodeOverride, setIssuedCodeOverride] = useState<string | null>(
    null
  );
  const [orderPendingOverride, setOrderPendingOverride] = useState(false);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [readyDialogOpen, setReadyDialogOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const payerInputRef = useRef<HTMLInputElement>(null);

  const lessonsDone = courseStatus?.lessons_done ?? completedCount;
  const lessonsTotal = courseStatus?.lessons_total ?? totalCount;
  const quizzesPassed =
    courseStatus?.quizzes_passed ?? quizzes.filter((q) => q.passed).length;
  const quizzesTotal = courseStatus?.quizzes_total ?? quizzes.length;

  const priceNgn = courseStatus?.price_ngn ?? track.price_ngn;
  const certificateEnabled =
    courseStatus?.certificate_enabled ?? track.certificate_enabled;
  const certificateCode =
    issuedCodeOverride ?? courseStatus?.certificate_code ?? null;
  const orderStatus = orderPendingOverride
    ? "pending"
    : courseStatus?.order_status ?? null;
  const isEligible = Boolean(courseStatus?.eligible);

  const firstName = holderName.trim().split(/\s+/)[0] || "there";

  const hasBankDetails =
    publicSettings.pay_bank_name.trim().length > 0 &&
    publicSettings.pay_account_number.trim().length > 0 &&
    publicSettings.pay_account_name.trim().length > 0;

  const templateUrl = getCertificateTemplateUrl(
    track.certificate_template_path
  );

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  // Trigger first-time celebration dialogs (once per moment per course)
  useEffect(() => {
    if (!certificateEnabled) return;

    if (certificateCode) {
      if (!hasSeenCelebration(track.id, "issued")) {
        markCelebrationSeen(track.id, "issued");
        setCompleteDialogOpen(false);
        setReadyDialogOpen(true);
      }
      return;
    }

    if (isEligible && orderStatus !== "pending") {
      if (!hasSeenCelebration(track.id, "eligible")) {
        markCelebrationSeen(track.id, "eligible");
        setCompleteDialogOpen(true);
      }
    }
  }, [certificateEnabled, certificateCode, isEligible, orderStatus, track.id]);

  // Render live canvas preview when certificate is issued and template exists
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !certificateCode || !templateUrl) return;

    const layout = parseCertificateLayout(track.certificate_layout);
    let cancelled = false;
    renderCertificateToCanvas(canvas, templateUrl, layout, {
      name: holderName,
      course: track.title,
      score: courseStatus?.score_pct ?? 0,
      remark: courseStatus?.remark ?? "",
      date: formatCertificateDate(courseStatus?.certificate_issued_at),
      code: certificateCode,
      qrValue: getCertificateVerifyUrl(certificateCode),
    }).catch(() => {
      if (!cancelled) {
        // Preview fallback handled gracefully
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    certificateCode,
    templateUrl,
    track.certificate_layout,
    track.title,
    holderName,
    courseStatus?.score_pct,
    courseStatus?.remark,
    courseStatus?.certificate_issued_at,
  ]);

  const handleInstantIssue = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await requestCertificateAction(
        track.id,
        null,
        null,
        track.slug
      );
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      setCompleteDialogOpen(false);
      if (res.data.status === "issued" && res.data.certificate_code) {
        setIssuedCodeOverride(res.data.certificate_code);
        toast.success("Certificate issued");
      } else {
        setOrderPendingOverride(true);
        toast.success("Certificate request submitted");
      }
      router.refresh();
    });
  };

  const handleCelebrationClaim = () => {
    if (priceNgn === 0) {
      handleInstantIssue();
      return;
    }
    setCompleteDialogOpen(false);
    window.setTimeout(() => {
      payerInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      payerInputRef.current?.focus();
    }, 180);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (payerName.trim().length < 2) {
      setErrorMsg("Enter the payer's full name.");
      return;
    }
    if (paymentReference.trim().length < 3) {
      setErrorMsg("Enter your bank transfer reference.");
      return;
    }

    startTransition(async () => {
      const res = await requestCertificateAction(
        track.id,
        payerName.trim(),
        paymentReference.trim(),
        track.slug
      );
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      if (res.data.status === "issued" && res.data.certificate_code) {
        setIssuedCodeOverride(res.data.certificate_code);
        toast.success("Certificate issued");
      } else {
        setOrderPendingOverride(true);
        toast.success("Payment submitted for approval");
      }
      router.refresh();
    });
  };

  const handleDownload = async (type: "png" | "pdf") => {
    if (!certificateCode || !track.certificate_template_path) {
      toast.error("Certificate template is not available yet.");
      return;
    }
    setDownloadingType(type);
    try {
      const params = {
        templatePath: track.certificate_template_path,
        layout: track.certificate_layout,
        data: {
          name: holderName,
          course: track.title,
          score: courseStatus?.score_pct ?? 0,
          remark: courseStatus?.remark ?? "",
          date: formatCertificateDate(courseStatus?.certificate_issued_at),
          code: certificateCode,
          qrValue: getCertificateVerifyUrl(certificateCode),
        },
      };
      if (type === "png") {
        await downloadCertificatePng(params);
      } else {
        await downloadCertificatePdf(params);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to download certificate"
      );
    } finally {
      setDownloadingType(null);
    }
  };

  const handleCopyVerifyLink = async () => {
    if (!certificateCode) return;
    try {
      await navigator.clipboard.writeText(
        getCertificateVerifyUrl(certificateCode)
      );
      setCopied(true);
      toast.success("Verification link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleNativeShare = async () => {
    if (!certificateCode) return;
    try {
      await navigator.share({
        title: `${track.title} Certificate`,
        text: `I earned my ${track.title} certificate on Zed.`,
        url: getCertificateVerifyUrl(certificateCode),
      });
    } catch {
      // User cancelled share sheet
    }
  };

  // Locked progress calculations
  const remainingLessons = Math.max(0, lessonsTotal - lessonsDone);
  const remainingQuizzes = Math.max(0, quizzesTotal - quizzesPassed);
  const totalSteps = lessonsTotal + quizzesTotal;
  const doneSteps = lessonsDone + quizzesPassed;
  const unlockPct =
    totalSteps > 0 ? Math.min(100, Math.round((doneSteps / totalSteps) * 100)) : 0;

  const lockedMessage = (() => {
    const parts: string[] = [];
    if (remainingLessons > 0) {
      parts.push(
        `${remainingLessons} more ${pluralize(remainingLessons, "lesson", "lessons")}`
      );
    }
    if (remainingQuizzes > 0) {
      parts.push(
        `${remainingQuizzes} ${pluralize(remainingQuizzes, "quiz", "quizzes")}`
      );
    }
    if (parts.length > 0) {
      return `${parts.join(" and ")} to unlock your certificate`;
    }
    return (
      courseStatus?.reason ||
      "Complete all lessons and pass every quiz to unlock your certificate."
    );
  })();

  const verifyUrl = certificateCode
    ? getCertificateVerifyUrl(certificateCode)
    : "";
  const whatsappUrl = certificateCode
    ? getWhatsAppShareUrl(track.title, verifyUrl)
    : "";

  return (
    <>
      <aside
        aria-label="Certificate status"
        className="lg:col-span-4 rounded-lg border border-border/70 bg-card p-5 space-y-4 lg:sticky lg:top-20"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-foreground">
            <Award className="h-4 w-4 stroke-[1.5]" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Certificate status
          </h2>
        </div>

        <dl className="divide-y divide-border/50 border-t border-border/50 text-sm">
          <div className="py-2.5 flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Lessons done</dt>
            <dd className="text-xs font-medium text-foreground tabular-nums">
              {lessonsDone} of {lessonsTotal}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Quizzes passed</dt>
            <dd className="text-xs font-medium text-foreground tabular-nums">
              {quizzesPassed} of {quizzesTotal}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Score</dt>
            <dd className="text-xs font-medium text-foreground tabular-nums">
              {courseStatus?.score_pct !== null &&
              courseStatus?.score_pct !== undefined
                ? `${courseStatus.score_pct}%`
                : "—"}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Remark</dt>
            <dd className="text-xs font-medium text-foreground text-right">
              {courseStatus?.remark || "In progress"}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Price</dt>
            <dd className="text-xs font-medium text-foreground tabular-nums">
              {priceNgn === 0 ? "Free" : `₦${priceNgn.toLocaleString()}`}
            </dd>
          </div>
        </dl>

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5] mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!certificateEnabled ? (
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            Certificates are not enabled for this course.
          </p>
        ) : certificateCode ? (
          <div className="space-y-3 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                <Check className="h-3 w-3 stroke-[2]" />
                <span>Certificate ready</span>
              </span>
              <span className="text-xs font-medium text-foreground">
                {certificateCode}
              </span>
            </div>

            {templateUrl ? (
              <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20 p-1.5">
                <canvas
                  ref={canvasRef}
                  className="block w-full h-auto rounded-md"
                  aria-label="Your issued certificate"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Your certificate is issued. Template preview is not available yet.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!templateUrl || downloadingType !== null}
                onClick={() => handleDownload("png")}
                className="h-9 text-xs rounded-lg gap-1.5"
              >
                {downloadingType === "png" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Download PNG</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!templateUrl || downloadingType !== null}
                onClick={() => handleDownload("pdf")}
                className="h-9 text-xs rounded-lg gap-1.5 border-border/70"
              >
                {downloadingType === "pdf" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                <span>Download PDF</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs rounded-lg gap-1.5 border-border/70"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Share on WhatsApp</span>
                </a>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopyVerifyLink}
                className="w-full h-8 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--data-verified-ink)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copied ? "Verify link copied" : "Copy verify link"}</span>
              </Button>

              {canNativeShare && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleNativeShare}
                  className="w-full h-8 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </Button>
              )}
            </div>
          </div>
        ) : orderStatus === "pending" ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Waiting for approval</span>
            </div>
            <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              We received your payment details. We are confirming them and will
              unlock your certificate.
            </p>
          </div>
        ) : !isEligible ? (
          <div className="border-t border-border/50 pt-4 space-y-2.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lockedMessage}
            </p>
            <div
              className="h-1.5 w-full rounded-lg bg-secondary/80 overflow-hidden"
              role="progressbar"
              aria-valuenow={unlockPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  "h-full rounded-lg bg-[var(--data-flows)] transition-all duration-200 motion-reduce:transition-none"
                )}
                style={{ width: `${unlockPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 border-t border-border/50 pt-4">
            {orderStatus === "rejected" && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400 space-y-1">
                <p className="font-medium">Previous request was not approved</p>
                {courseStatus?.order_reject_reason && (
                  <p>{courseStatus.order_reject_reason}</p>
                )}
                <p className="font-medium pt-0.5">Try again</p>
              </div>
            )}

            {priceNgn === 0 ? (
              <Button
                type="button"
                disabled={isPending}
                onClick={handleInstantIssue}
                className="w-full h-9 text-xs rounded-lg font-medium gap-1.5"
              >
                {isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                )}
                <span>Get your certificate now</span>
              </Button>
            ) : publicSettings.payment_mode !== "manual" ? (
              <p className="text-xs text-muted-foreground">
                Online payment is not available yet.
              </p>
            ) : !hasBankDetails ? (
              <p className="text-xs text-muted-foreground">
                Payment is not set up yet.
              </p>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-3.5">
                <div className="rounded-lg border border-border/70 bg-secondary/20 p-3.5 space-y-2 text-xs">
                  <p className="font-medium text-foreground">
                    Bank transfer · ₦{priceNgn.toLocaleString()}
                  </p>
                  <dl className="space-y-1">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Bank</dt>
                      <dd className="font-medium text-foreground text-right">
                        {publicSettings.pay_bank_name}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Account number</dt>
                      <dd className="font-medium text-foreground tabular-nums text-right">
                        {publicSettings.pay_account_number}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Account name</dt>
                      <dd className="font-medium text-foreground text-right">
                        {publicSettings.pay_account_name}
                      </dd>
                    </div>
                  </dl>
                  {publicSettings.pay_instructions && (
                    <p className="text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
                      {publicSettings.pay_instructions}
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your certificate will carry the name on your profile. Make
                  sure it is your full legal name before you pay.{" "}
                  <Link
                    href="/profile"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    Update profile name
                  </Link>
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="certPayerName" className="text-xs font-medium">
                    Payer name
                  </Label>
                  <Input
                    ref={payerInputRef}
                    id="certPayerName"
                    type="text"
                    value={payerName}
                    onChange={(e) => {
                      setPayerName(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Name on the bank transfer"
                    disabled={isPending}
                    className="h-9 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="certPayRef" className="text-xs font-medium">
                    Payment reference
                  </Label>
                  <Input
                    id="certPayRef"
                    type="text"
                    value={paymentReference}
                    onChange={(e) => {
                      setPaymentReference(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Transfer reference or session ID"
                    disabled={isPending}
                    className="h-9 rounded-lg text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-9 text-xs rounded-lg font-medium gap-1.5"
                >
                  {isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                  )}
                  <span>
                    {orderStatus === "rejected"
                      ? "Try again"
                      : `Claim for ₦${priceNgn.toLocaleString()}`}
                  </span>
                </Button>
              </form>
            )}
          </div>
        )}
      </aside>

      <CourseCompleteDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        courseTitle={track.title}
        firstName={firstName}
        scorePct={courseStatus?.score_pct ?? null}
        remark={courseStatus?.remark ?? null}
        earnedPoints={earnedPoints}
        priceNgn={priceNgn}
        isSubmitting={isPending}
        onClaim={handleCelebrationClaim}
      />

      {certificateCode && (
        <CertificateReadyDialog
          open={readyDialogOpen}
          onOpenChange={setReadyDialogOpen}
          courseTitle={track.title}
          holderName={holderName}
          scorePct={courseStatus?.score_pct ?? null}
          remark={courseStatus?.remark ?? null}
          issuedAt={courseStatus?.certificate_issued_at ?? null}
          code={certificateCode}
          templatePath={track.certificate_template_path}
          layout={track.certificate_layout}
        />
      )}
    </>
  );
}
