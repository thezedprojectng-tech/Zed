import type { Metadata } from "next";
import Link from "next/link";
import { Award, Ban, CheckCircle2, SearchX } from "lucide-react";
import { verifyCertificateByCode } from "@/lib/skill/actions";
import { formatCertificateDate } from "@/lib/certificate/download";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Verify certificate",
  description: "Verify the authenticity of a Zed Skill certificate.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const result = await verifyCertificateByCode(decodedCode);

  const isRevoked = Boolean(result && result.revoked);
  const isValid = Boolean(result && result.valid && !result.revoked);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Award className="h-4 w-4 stroke-[1.5]" />
          <span>Zed Skill certificate verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Certificate check
        </h1>
      </div>

      {!result ? (
        <section
          aria-label="Certificate not found"
          className="rounded-lg border border-border/70 bg-card p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-muted-foreground">
              <SearchX className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Certificate not found
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No certificate matches the code{" "}
                <span className="font-medium text-foreground">
                  {decodedCode}
                </span>
                . Check that the link or code was entered accurately.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
            >
              <Link href="/">Return to Zed</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section
          aria-label="Certificate details"
          className="rounded-lg border border-border/70 bg-card p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
            <div className="flex items-start gap-3">
              {isValid ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]">
                  <CheckCircle2 className="h-5 w-5 stroke-[1.75]" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  <Ban className="h-5 w-5 stroke-[1.75]" />
                </div>
              )}
              <div className="space-y-1">
                <span
                  className={
                    isValid
                      ? "inline-flex items-center rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]"
                      : "inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400"
                  }
                >
                  {isRevoked ? "Revoked" : isValid ? "Valid" : "Not valid"}
                </span>
                <p className="text-sm text-muted-foreground">
                  {isRevoked
                    ? "This certificate has been revoked and is no longer valid."
                    : isValid
                    ? "This certificate is authentic and active."
                    : "This certificate could not be verified."}
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Code:{" "}
              <span className="font-medium text-foreground">{decodedCode}</span>
            </div>
          </div>

          <dl className="divide-y divide-border/50 text-sm">
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-muted-foreground">Holder name</dt>
              <dd className="font-medium text-foreground">
                {result.holder_name || "—"}
              </dd>
            </div>
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-muted-foreground">Course</dt>
              <dd className="font-medium text-foreground">
                {result.course_title || "—"}
              </dd>
            </div>
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-muted-foreground">Score</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {result.score_pct !== null ? `${result.score_pct}%` : "—"}
              </dd>
            </div>
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-muted-foreground">Remark</dt>
              <dd className="font-medium text-foreground">
                {result.remark || "—"}
              </dd>
            </div>
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-muted-foreground">Issue date</dt>
              <dd className="font-medium text-foreground">
                {result.issued_at
                  ? formatCertificateDate(result.issued_at)
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
