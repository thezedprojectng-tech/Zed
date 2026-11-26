"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fireCelebrationConfetti,
  getWhatsAppShareUrl,
  prefersReducedMotion,
} from "@/lib/certificate/celebrate";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SHEET_DIALOG_CLASSES =
  "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-lg sm:rounded-lg border-border/70 duration-200 motion-reduce:animate-none motion-reduce:transition-none max-h-[90dvh] overflow-y-auto";

interface CourseCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  firstName: string;
  scorePct: number | null;
  remark: string | null;
  earnedPoints: number;
  priceNgn: number;
  isSubmitting: boolean;
  onClaim: () => void;
}

export function CourseCompleteDialog({
  open,
  onOpenChange,
  courseTitle,
  firstName,
  scorePct,
  remark,
  earnedPoints,
  priceNgn,
  isSubmitting,
  onClaim,
}: CourseCompleteDialogProps) {
  useEffect(() => {
    if (!open) return;
    return fireCelebrationConfetti();
  }, [open]);

  const isFree = priceNgn === 0;
  const ctaLabel = isFree
    ? "Get your certificate now"
    : `Claim for ₦${priceNgn.toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${SHEET_DIALOG_CLASSES} sm:max-w-md`}>
        <DialogHeader className="text-center sm:text-center space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]">
            <Award className="h-5 w-5 stroke-[1.75]" />
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground">
            You finished {courseTitle}, {firstName}.
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Every lesson and quiz in this course is complete.
          </DialogDescription>
        </DialogHeader>

        <div
          aria-live="polite"
          className="rounded-lg border border-border/70 bg-secondary/20 p-5 text-center space-y-3"
        >
          <div className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
            {scorePct !== null ? `${scorePct}%` : "100%"}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {remark && (
              <span className="inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                {remark}
              </span>
            )}
            <span className="inline-flex items-center rounded-md border border-[var(--data-flows-border)] bg-[var(--data-flows-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--data-flows-ink)] tabular-nums">
              {earnedPoints} pts earned
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onClaim}
            className="w-full h-10 text-sm rounded-lg font-medium gap-2"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            )}
            <span>{ctaLabel}</span>
          </Button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 motion-reduce:transition-none"
          >
            Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CertificateReadyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  holderName: string;
  scorePct: number | null;
  remark: string | null;
  issuedAt: string | null;
  code: string;
  templatePath: string | null;
  layout: CertificateLayout | null;
}

export function CertificateReadyDialog({
  open,
  onOpenChange,
  courseTitle,
  holderName,
  scorePct,
  remark,
  issuedAt,
  code,
  templatePath,
  layout,
}: CertificateReadyDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadingType, setDownloadingType] = useState<"png" | "pdf" | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion()) return;
    return fireCelebrationConfetti();
  }, [open]);

  const templateUrl = getCertificateTemplateUrl(templatePath);

  useEffect(() => {
    if (!open || !templateUrl) return;
    let cancelled = false;
    const raf = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const parsedLayout = parseCertificateLayout(layout);
      renderCertificateToCanvas(canvas, templateUrl, parsedLayout, {
        name: holderName,
        course: courseTitle,
        score: scorePct ?? 0,
        remark: remark ?? "",
        date: formatCertificateDate(issuedAt),
        code,
        qrValue: getCertificateVerifyUrl(code),
      }).catch(() => {});
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [open, templateUrl, layout, holderName, courseTitle, scorePct, remark, issuedAt, code]);

  const handleDownload = async (type: "png" | "pdf") => {
    if (!templatePath) {
      toast.error("Certificate template is not available yet.");
      return;
    }
    setDownloadingType(type);
    try {
      const params = {
        templatePath,
        layout,
        data: {
          name: holderName,
          course: courseTitle,
          score: scorePct ?? 0,
          remark: remark ?? "",
          date: formatCertificateDate(issuedAt),
          code,
          qrValue: getCertificateVerifyUrl(code),
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCertificateVerifyUrl(code));
      setCopied(true);
      toast.success("Verification link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `${courseTitle} Certificate`,
        text: `I earned my ${courseTitle} certificate on Zed.`,
        url: getCertificateVerifyUrl(code),
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const verifyUrl = getCertificateVerifyUrl(code);
  const whatsappUrl = getWhatsAppShareUrl(courseTitle, verifyUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${SHEET_DIALOG_CLASSES} sm:max-w-xl`}>
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Your certificate is ready
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {courseTitle} · Verification code {code}
          </DialogDescription>
        </DialogHeader>

        <div aria-live="polite" className="space-y-4">
          {templateUrl ? (
            <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20">
              <canvas
                ref={canvasRef}
                className="block w-full h-auto"
                aria-label={`${courseTitle} certificate`}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 bg-secondary/20 p-6 text-center text-xs text-muted-foreground">
              Your certificate ({code}) is issued. You can share its
              verification link below.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              disabled={!templateUrl || downloadingType !== null}
              onClick={() => handleDownload("png")}
              className="w-full h-9 text-xs rounded-lg gap-1.5"
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
              variant="outline"
              disabled={!templateUrl || downloadingType !== null}
              onClick={() => handleDownload("pdf")}
              className="w-full h-9 text-xs rounded-lg gap-1.5 border-border/70"
            >
              {downloadingType === "pdf" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span>Download PDF</span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-9 text-xs rounded-lg gap-1.5 border-border/70"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Share on WhatsApp</span>
              </a>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="w-full h-9 text-xs rounded-lg gap-1.5 border-border/70"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[var(--data-verified-ink)]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Verify link copied" : "Copy verify link"}</span>
            </Button>
          </div>

          {canNativeShare && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleNativeShare}
              className="w-full h-9 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
