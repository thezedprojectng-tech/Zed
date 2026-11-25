import { z } from "zod";

export const CERTIFICATE_TEXT_FIELD_KEYS = [
  "name",
  "course",
  "score",
  "remark",
  "date",
  "code",
] as const;

export const CERTIFICATE_FIELD_KEYS = [
  ...CERTIFICATE_TEXT_FIELD_KEYS,
  "qr",
] as const;

export type CertificateTextFieldKey = (typeof CERTIFICATE_TEXT_FIELD_KEYS)[number];
export type CertificateFieldKey = (typeof CERTIFICATE_FIELD_KEYS)[number];
export type CertificateAlign = "left" | "center" | "right";
export type CertificateFont = "serif" | "sans";

export const FONT_STACKS: Record<CertificateFont, string> = {
  serif: 'Georgia, "Times New Roman", Times, serif',
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export const certificateTextFieldSchema = z.object({
  x: z.number().min(0, "X must be between 0 and 1").max(1, "X must be between 0 and 1"),
  y: z.number().min(0, "Y must be between 0 and 1").max(1, "Y must be between 0 and 1"),
  size: z
    .number()
    .min(0.005, "Size must be between 0.005 and 0.5")
    .max(0.5, "Size must be between 0.005 and 0.5"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex code (e.g. #111111)"),
  align: z.enum(["left", "center", "right"]),
  font: z.enum(["serif", "sans"]),
  maxWidth: z
    .number()
    .min(0.05, "Max width must be between 0.05 and 1")
    .max(1, "Max width must be between 0.05 and 1"),
});

export const certificateQrFieldSchema = z.object({
  x: z.number().min(0, "X must be between 0 and 1").max(1, "X must be between 0 and 1"),
  y: z.number().min(0, "Y must be between 0 and 1").max(1, "Y must be between 0 and 1"),
  size: z
    .number()
    .min(0.02, "QR size must be between 0.02 and 0.5")
    .max(0.5, "QR size must be between 0.02 and 0.5"),
});

export const certificateLayoutSchema = z.object({
  fields: z.object({
    name: certificateTextFieldSchema,
    course: certificateTextFieldSchema,
    score: certificateTextFieldSchema,
    remark: certificateTextFieldSchema,
    date: certificateTextFieldSchema,
    code: certificateTextFieldSchema,
    qr: certificateQrFieldSchema,
  }),
});

export type CertificateTextField = z.infer<typeof certificateTextFieldSchema>;
export type CertificateQrField = z.infer<typeof certificateQrFieldSchema>;
export type CertificateLayout = z.infer<typeof certificateLayoutSchema>;

export const DEFAULT_CERTIFICATE_LAYOUT: CertificateLayout = {
  fields: {
    name: {
      x: 0.5,
      y: 0.45,
      size: 0.06,
      color: "#111111",
      align: "center",
      font: "serif",
      maxWidth: 0.6,
    },
    course: {
      x: 0.5,
      y: 0.56,
      size: 0.036,
      color: "#1f2937",
      align: "center",
      font: "sans",
      maxWidth: 0.7,
    },
    score: {
      x: 0.38,
      y: 0.67,
      size: 0.03,
      color: "#111111",
      align: "center",
      font: "sans",
      maxWidth: 0.22,
    },
    remark: {
      x: 0.62,
      y: 0.67,
      size: 0.03,
      color: "#111111",
      align: "center",
      font: "sans",
      maxWidth: 0.28,
    },
    date: {
      x: 0.26,
      y: 0.82,
      size: 0.024,
      color: "#374151",
      align: "center",
      font: "sans",
      maxWidth: 0.28,
    },
    code: {
      x: 0.5,
      y: 0.88,
      size: 0.02,
      color: "#4b5563",
      align: "center",
      font: "sans",
      maxWidth: 0.38,
    },
    qr: {
      x: 0.88,
      y: 0.82,
      size: 0.1,
    },
  },
};

export const CERTIFICATE_FIELD_LABELS: Record<CertificateFieldKey, string> = {
  name: "Learner name",
  course: "Course title",
  score: "Score",
  remark: "Remark",
  date: "Issue date",
  code: "Certificate code",
  qr: "QR code",
};

/**
 * Safely parse a raw layout JSON object from the database, falling back to
 * DEFAULT_CERTIFICATE_LAYOUT if missing or invalid.
 */
export function parseCertificateLayout(raw: unknown): CertificateLayout {
  const parsed = certificateLayoutSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }
  return structuredClone(DEFAULT_CERTIFICATE_LAYOUT);
}
