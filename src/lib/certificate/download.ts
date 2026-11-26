import { PDFDocument } from "pdf-lib";
import { createClient } from "@/lib/supabase/client";
import { parseCertificateLayout, type CertificateLayout } from "./layout";
import {
  renderCertificateToCanvas,
  type CertificateRenderData,
} from "./render";

export const CERTIFICATE_BUCKET = "certificate-templates";

export function getCertificateTemplateUrl(
  templatePath: string | null
): string | null {
  if (!templatePath) return null;
  const supabase = createClient();
  return supabase.storage.from(CERTIFICATE_BUCKET).getPublicUrl(templatePath)
    .data.publicUrl;
}

export function getCertificateVerifyUrl(code: string): string {
  const path = `/certificates/verify/${encodeURIComponent(code)}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export function formatCertificateDate(value?: string | null): string {
  if (!value) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function renderCertificatePngBlob(params: {
  templatePath: string;
  layout: CertificateLayout | null;
  data: CertificateRenderData;
}): Promise<{ blob: Blob; width: number; height: number }> {
  const templateUrl = getCertificateTemplateUrl(params.templatePath);
  if (!templateUrl) {
    throw new Error("Certificate template is not configured for this course.");
  }

  const canvas = document.createElement("canvas");
  const layout = parseCertificateLayout(params.layout);
  const renderData: CertificateRenderData = {
    ...params.data,
    qrValue: params.data.qrValue ?? getCertificateVerifyUrl(params.data.code),
  };

  await renderCertificateToCanvas(canvas, templateUrl, layout, renderData);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Could not generate PNG image."));
      }
    }, "image/png");
  });

  return { blob, width: canvas.width, height: canvas.height };
}

export async function downloadCertificatePng(params: {
  templatePath: string;
  layout: CertificateLayout | null;
  data: CertificateRenderData;
}): Promise<void> {
  const { blob } = await renderCertificatePngBlob(params);
  const safeCode = params.data.code.replace(/[^a-zA-Z0-9_-]/g, "");
  triggerBrowserDownload(blob, `${safeCode || "zed"}-certificate.png`);
}

export async function downloadCertificatePdf(params: {
  templatePath: string;
  layout: CertificateLayout | null;
  data: CertificateRenderData;
}): Promise<void> {
  const { blob, width, height } = await renderCertificatePngBlob(params);
  const pngBytes = await blob.arrayBuffer();

  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBytes);
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });
  const safeCode = params.data.code.replace(/[^a-zA-Z0-9_-]/g, "");
  triggerBrowserDownload(pdfBlob, `${safeCode || "zed"}-certificate.pdf`);
}
