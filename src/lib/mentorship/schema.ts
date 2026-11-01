import { z } from "zod";

/**
 * Strips non-printable ASCII control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
 * while preserving newlines (\n = 0x0A), carriage returns (\r = 0x0D), and tabs (\t = 0x09).
 */
export function stripControlCharacters(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export const MENTORSHIP_STATUSES = [
  "new",
  "reviewing",
  "accepted",
  "waitlisted",
  "declined",
] as const;

export type MentorshipStatus = (typeof MENTORSHIP_STATUSES)[number];

export const CURRENT_STATUS_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "graduate", label: "Graduate" },
  { value: "employed", label: "Employed" },
  { value: "job_seeker", label: "Job Seeker" },
  { value: "other", label: "Other" },
] as const;

export const INTEREST_AREA_OPTIONS = [
  { value: "frontend", label: "Frontend Development" },
  { value: "backend", label: "Backend Development" },
  { value: "mobile", label: "Mobile Development" },
  { value: "ui_ux", label: "UI/UX Design" },
  { value: "data", label: "Data & Analytics" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "product", label: "Product Management" },
  { value: "other", label: "Other" },
] as const;

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner (no prior experience)" },
  { value: "some", label: "Some experience (learning on my own)" },
  { value: "intermediate", label: "Intermediate (built a few projects)" },
] as const;

export const PREFERRED_FORMAT_OPTIONS = [
  { value: "online_chat", label: "Online chat / messaging" },
  { value: "video_call", label: "Video call" },
  { value: "in_person", label: "In-person" },
  { value: "any", label: "Any format" },
] as const;

export const mentorshipApplicationSchema = z.object({
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
  location: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Location must be at least 2 characters")
        .max(120, "Location cannot exceed 120 characters")
    ),
  currentStatus: z.enum(
    ["student", "graduate", "employed", "job_seeker", "other"],
    { message: "Please select your current status" }
  ),
  institution: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(z.string().max(120, "Institution cannot exceed 120 characters"))
    .optional()
    .or(z.literal("")),
  interestArea: z.enum(
    ["frontend", "backend", "mobile", "ui_ux", "data", "cybersecurity", "product", "other"],
    { message: "Please select your area of interest" }
  ),
  experienceLevel: z.enum(["beginner", "some", "intermediate"], {
    message: "Please select your experience level",
  }),
  goals: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(20, "Please describe your goals (at least 20 characters)")
        .max(1000, "Goals cannot exceed 1,000 characters")
    ),
  availability: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Please describe your availability")
        .max(200, "Availability cannot exceed 200 characters")
    ),
  preferredFormat: z.enum(["online_chat", "video_call", "in_person", "any"], {
    message: "Please select your preferred format",
  }),
  consent: z
    .boolean()
    .refine((val) => val === true, "You must consent to data processing to apply"),
  hpCompanyField: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type MentorshipApplicationInput = z.infer<typeof mentorshipApplicationSchema>;

export interface MentorshipApplicationRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  current_status: string;
  institution: string | null;
  interest_area: string;
  experience_level: string;
  goals: string;
  availability: string;
  preferred_format: string;
  consent: boolean;
  ip_hash: string;
  status: MentorshipStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
