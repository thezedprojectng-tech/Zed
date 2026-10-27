import { z } from "zod";

/**
 * Strips non-printable ASCII control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
 * while preserving newlines (\n = 0x0A), carriage returns (\r = 0x0D), and tabs (\t = 0x09).
 */
export function stripControlCharacters(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export const CONTACT_STATUSES = ["new", "read", "archived"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const contactMessageSchema = z.object({
  name: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name cannot exceed 80 characters")
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(255, "Email address is too long"),
  phone: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(z.string().max(30, "Phone number cannot exceed 30 characters"))
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(3, "Subject must be at least 3 characters")
        .max(120, "Subject cannot exceed 120 characters")
    ),
  message: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(2000, "Message cannot exceed 2,000 characters")
    ),
  hpCompanyField: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type ContactSubmissionInput = z.infer<typeof contactMessageSchema>;

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  user_id: string | null;
  ip_hash: string;
  created_at: string;
}
