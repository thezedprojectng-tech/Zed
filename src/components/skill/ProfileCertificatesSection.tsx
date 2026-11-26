"use client";

import { useEffect, useState } from "react";
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
  getMyIssuedCertificatesAction,
  type UserCertificateItem,
} from "@/lib/skill/actions";
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  formatCertificateDate,
  getCertificateVerifyUrl,
} from "@/lib/certificate/download";
import {
  getWhatsAppShareUrl,
  hasSeenCelebration,
  markCelebrationSeen,
} from "@/lib/certificate/celebrate";
import { CertificateReadyDialog } from "@/components/skill/CertificateCelebrationDialog";
import { Button } from "@/components/ui/button";

export function ProfileCertificatesSection() {
  const [certificates, setCertificates] = useState<UserCertificateItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [celebratingCert, setCelebratingCert] =
    useState<UserCertificateItem | null>(null);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyIssuedCertificatesAction()
      .then((items) => {
        if (cancelled) return;
        setCertificates(items);
        setLoaded(true);

        const uncelebrated = items.find(
          (c) => !hasSeenCelebration(c.track_id, "issued")
        );
        if (uncelebrated) {
          markCelebrationSeen(uncelebrated.track_id, "issued");
          setCelebratingCert(uncelebrated);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || certificates.length === 0) {
    return null;
  }

  const handleDownload = async (
    cert: UserCertificateItem,
    type: "png" | "pdf"
  ) => {
    if (!cert.certificate_template_path) {
      toast.error("Certificate template is not available yet.");
      return;
    }

    const key = `${cert.id}-${type}`;
    setDownloadingKey(key);
    try {
      const params = {
        templatePath: cert.certificate_template_path,
        layout: cert.certificate_layout,
        data: {
          name: cert.holder_name,
          course: cert.course_title,
          score: cert.score_pct,
          remark: cert.remark,
          date: formatCertificateDate(cert.issued_at),
          code: cert.code,
          qrValue: getCertificateVerifyUrl(cert.code),
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
      setDownloadingKey(null);
    }
  };

  const handleCopy = async (cert: UserCertificateItem) => {
    try {
      await navigator.clipboard.writeText(getCertificateVerifyUrl(cert.code));
      setCopiedId(cert.id);
      toast.success("Verification link copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleNativeShare = async (cert: UserCertificateItem) => {
    try {
      await navigator.share({
        title: `${cert.course_title} Certificate`,
        text: `I earned my ${cert.course_title} certificate on Zed.`,
        url: getCertificateVerifyUrl(cert.code),
      });
    } catch {
      // User cancelled share sheet
    }
  };

  return (
    <>
      <section
        aria-labelledby="certificates-heading"
        className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-foreground">
            <Award className="h-4 w-4 stroke-[1.5]" />
          </div>
          <div>
            <h2
              id="certificates-heading"
              className="text-base font-semibold text-foreground"
            >
              Certificates
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download your earned Zed Skill certificates or share their
              verification links.
            </p>
          </div>
        </div>

        <div className="divide-y divide-border/50 border-t border-border/50">
          {certificates.map((cert) => {
            const pngLoading = downloadingKey === `${cert.id}-png`;
            const pdfLoading = downloadingKey === `${cert.id}-pdf`;
            const disabled =
              !cert.certificate_template_path || downloadingKey !== null;
            const verifyUrl = getCertificateVerifyUrl(cert.code);
            const whatsappUrl = getWhatsAppShareUrl(
              cert.course_title,
              verifyUrl
            );

            return (
              <div
                key={cert.id}
                className="py-3.5 first:pt-3 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {cert.course_title}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {cert.code} · {cert.score_pct}%
                    {cert.remark ? ` (${cert.remark})` : ""} ·{" "}
                    {formatCertificateDate(cert.issued_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => handleDownload(cert, "png")}
                    className="h-8 text-xs rounded-lg gap-1.5 border-border/70"
                  >
                    {pngLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>PNG</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => handleDownload(cert, "pdf")}
                    className="h-8 text-xs rounded-lg gap-1.5 border-border/70"
                  >
                    {pdfLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    <span>PDF</span>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-lg gap-1.5 border-border/70"
                  >
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(cert)}
                    className="h-8 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === cert.id ? (
                      <Check className="h-3.5 w-3.5 text-[var(--data-verified-ink)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedId === cert.id ? "Copied" : "Verify link"}</span>
                  </Button>

                  {canNativeShare && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleNativeShare(cert)}
                      className="h-8 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {celebratingCert && (
        <CertificateReadyDialog
          open={Boolean(celebratingCert)}
          onOpenChange={(open) => {
            if (!open) setCelebratingCert(null);
          }}
          courseTitle={celebratingCert.course_title}
          holderName={celebratingCert.holder_name}
          scorePct={celebratingCert.score_pct}
          remark={celebratingCert.remark}
          issuedAt={celebratingCert.issued_at}
          code={celebratingCert.code}
          templatePath={celebratingCert.certificate_template_path}
          layout={celebratingCert.certificate_layout}
        />
      )}
    </>
  );
}
