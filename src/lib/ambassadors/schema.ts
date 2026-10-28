import { z } from "zod";

/**
 * Strips non-printable ASCII control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
 * while preserving newlines (\n = 0x0A), carriage returns (\r = 0x0D), and tabs (\t = 0x09).
 */
export function stripControlCharacters(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export const AMBASSADOR_STATUSES = [
  "new",
  "reviewing",
  "approved",
  "rejected",
] as const;

export type AmbassadorStatus = (typeof AMBASSADOR_STATUSES)[number];

export const ambassadorApplicationSchema = z.object({
  fullName: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Full name must be at least 2 characters")
        .max(80, "Full name cannot exceed 80 characters")
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
    .pipe(
      z
        .string()
        .min(7, "Phone number must be at least 7 characters")
        .max(30, "Phone number cannot exceed 30 characters")
    ),
  institution: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Institution must be at least 2 characters")
        .max(120, "Institution cannot exceed 120 characters")
    ),
  state: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "State must be at least 2 characters")
        .max(50, "State cannot exceed 50 characters")
    ),
  course: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Course or department must be at least 2 characters")
        .max(100, "Course or department cannot exceed 100 characters")
    ),
  level: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(1, "Level or year is required")
        .max(50, "Level or year cannot exceed 50 characters")
    ),
  socialHandle: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(z.string().max(100, "Social handle cannot exceed 100 characters"))
    .optional()
    .or(z.literal("")),
  whyAmbassador: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(30, "Please tell us why you want to be an ambassador (at least 30 characters)")
        .max(1000, "Response cannot exceed 1,000 characters")
    ),
  referralCode: z
    .string()
    .transform((val) => stripControlCharacters(val.trim().toUpperCase()))
    .pipe(z.string().max(20, "Referral code cannot exceed 20 characters"))
    .optional()
    .or(z.literal("")),
  consent: z
    .boolean()
    .refine((val) => val === true, "You must consent to data processing to apply"),
  hpCompanyField: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type AmbassadorApplicationInput = z.infer<typeof ambassadorApplicationSchema>;

export interface AmbassadorApplicationRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  institution: string;
  state: string;
  course: string;
  level: string;
  social_handle: string | null;
  why_ambassador: string;
  referral_code: string | null;
  consent: boolean;
  status: AmbassadorStatus;
  user_id: string | null;
  ip_hash: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

