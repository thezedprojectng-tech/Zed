import { z } from "zod";
import { NIGERIAN_STATES } from "./constants";

export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Strips non-printable ASCII control characters.
 */
export function stripControlCharacters(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Generates a clean URL slug from an institution name.
 * e.g. "University of Lagos" -> "university-of-lagos"
 * e.g. "Federal University of Technology, Akure" -> "federal-university-of-technology-akure"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

export const saveCampusHubSchema = z.object({
  id: z.string().uuid("Invalid hub ID").optional().nullable(),
  name: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(120, "Name cannot exceed 120 characters")
    ),
  slug: z
    .string()
    .transform((val) => stripControlCharacters(val.trim().toLowerCase()))
    .pipe(
      z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(60, "Slug cannot exceed 60 characters")
        .regex(
          SLUG_REGEX,
          "Slug must contain only lowercase letters, numbers, and hyphens without consecutive hyphens"
        )
    ),
  state: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(
      z
        .string()
        .min(2, "State must be at least 2 characters")
        .max(40, "State cannot exceed 40 characters")
        .refine(
          (val) => (NIGERIAN_STATES as readonly string[]).includes(val),
          "Please select a valid Nigerian state or FCT"
        )
    ),
  summary: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(z.string().max(300, "Summary cannot exceed 300 characters"))
    .optional()
    .nullable()
    .or(z.literal("")),
  clearance_guide: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(z.string().max(8000, "Clearance guide cannot exceed 8,000 characters"))
    .optional()
    .nullable()
    .or(z.literal("")),
  hostel_guide: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(z.string().max(8000, "Hostel guide cannot exceed 8,000 characters"))
    .optional()
    .nullable()
    .or(z.literal("")),
  departments_guide: z
    .string()
    .transform((val) => stripControlCharacters(val.trim()))
    .pipe(z.string().max(8000, "Departments guide cannot exceed 8,000 characters"))
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type SaveCampusHubInput = z.infer<typeof saveCampusHubSchema>;

