import { z } from "zod";
import { ALLOWED_CONTACT_DOMAINS } from "./constants";

/**
 * Strips non-printable ASCII control characters while preserving newlines, carriage returns, and tabs.
 */
export function stripControlCharacters(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Validates that a string is a secure HTTPS URL pointing to an allowed professional network (LinkedIn or X/Twitter).
 */
export function isValidContactUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length > 200) return false;
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (ALLOWED_CONTACT_DOMAINS as readonly string[]).includes(host);
  } catch {
    return false;
  }
}

const currentYear = new Date().getFullYear();

export const alumniApplicationSchema = z.object({
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
  graduationYear: z
    .number({ message: "Please enter your graduation year" })
    .int("Graduation year must be a whole year")
    .min(1970, "Graduation year must be 1970 or later")
    .max(currentYear, `Graduation year cannot be in the future (max ${currentYear})`),
  institution: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "University or institution must be at least 2 characters")
        .max(120, "Institution name cannot exceed 120 characters")
    ),
  field: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Field or expertise must be at least 2 characters")
        .max(100, "Field cannot exceed 100 characters")
    ),
  occupation: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Current occupation must be at least 2 characters")
        .max(120, "Occupation cannot exceed 120 characters")
    ),
  bio: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(20, "Please provide a short bio of at least 20 characters")
        .max(600, "Bio cannot exceed 600 characters")
    ),
  topics: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Please list topics you can advise students on")
        .max(300, "Topics cannot exceed 300 characters")
    ),
  availability: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Please describe your availability (e.g. 1 hour on weekends)")
        .max(200, "Availability cannot exceed 200 characters")
    ),
  contactUrl: z
    .string()
    .transform((val) => val.trim())
    .refine(
      (val) => isValidContactUrl(val),
      "Link must start with https:// and belong to linkedin.com or x.com / twitter.com (max 200 characters)"
    ),
  consentPublic: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must agree to display your profile information publicly if approved"
    ),
  hpCompanyField: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type AlumniApplicationInput = z.infer<typeof alumniApplicationSchema>;

export const adminPublishAlumniSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  displayName: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Display name must be between 2 and 80 characters")
        .max(80, "Display name cannot exceed 80 characters")
    ),
  graduationYear: z
    .number({ message: "Graduation year is required" })
    .int()
    .min(1970, "Graduation year must be 1970 or later")
    .max(2100, "Graduation year cannot exceed 2100"),
  institution: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Institution must be between 2 and 120 characters")
        .max(120, "Institution cannot exceed 120 characters")
    ),
  field: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Field must be between 2 and 100 characters")
        .max(100, "Field cannot exceed 100 characters")
    ),
  occupation: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Occupation must be between 2 and 120 characters")
        .max(120, "Occupation cannot exceed 120 characters")
    ),
  bio: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(20, "Bio must be between 20 and 600 characters")
        .max(600, "Bio cannot exceed 600 characters")
    ),
  topics: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Topics must be between 2 and 300 characters")
        .max(300, "Topics cannot exceed 300 characters")
    ),
  availability: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Availability must be between 2 and 200 characters")
        .max(200, "Availability cannot exceed 200 characters")
    ),
  contactUrl: z
    .string()
    .transform((val) => val.trim())
    .refine(
      (val) => isValidContactUrl(val),
      "Contact link must start with https:// and belong to linkedin.com or x.com / twitter.com (max 200 characters)"
    ),
});

export type AdminPublishAlumniInput = z.infer<typeof adminPublishAlumniSchema>;

