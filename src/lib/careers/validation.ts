import { z } from "zod";
import type { JobLocation, JobType } from "@/data/careers";

export const LOCATION_OPTIONS: JobLocation[] = ["Remote", "Hybrid", "On-site"];
export const TYPE_OPTIONS: JobType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

/**
 * Generate a clean, URL-safe slug from a role title.
 * Output strictly satisfies ^[a-z0-9]+(-[a-z0-9]+)*$ and length between 3 and 80.
 */
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug;
}

/**
 * Parse multiline textarea input into a trimmed array of non-empty strings.
 */
export function parseLines(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Format string array back into newline-separated text for form textareas.
 */
export function formatLines(lines?: string[] | null): string {
  if (!lines || !Array.isArray(lines)) return "";
  return lines.join("\n");
}

const itemSchema = z
  .string()
  .trim()
  .min(3, { error: "Each item must be at least 3 characters" })
  .max(300, { error: "Each item must not exceed 300 characters" });

export const careerRoleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "Title must be between 3 and 120 characters" })
    .max(120, { error: "Title must not exceed 120 characters" }),
  slug: z
    .string()
    .trim()
    .min(3, { error: "Slug must be at least 3 characters" })
    .max(80, { error: "Slug must not exceed 80 characters" })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error:
        "Slug must consist of lowercase alphanumeric characters and single hyphens (e.g. 'frontend-engineer')",
    }),
  department: z
    .string()
    .trim()
    .min(2, { error: "Department must be between 2 and 40 characters" })
    .max(40, { error: "Department must not exceed 40 characters" }),
  location: z.enum(["Remote", "Hybrid", "On-site"] as const, {
    error: "Location must be Remote, Hybrid, or On-site",
  }),
  type: z.enum(
    ["Full-time", "Part-time", "Contract", "Internship"] as const,
    {
      error: "Job type must be Full-time, Part-time, Contract, or Internship",
    }
  ),
  featured: z.boolean().default(false),
  summary: z
    .string()
    .trim()
    .min(1, { error: "Summary is required" })
    .max(300, { error: "Summary must not exceed 300 characters" }),
  about: z
    .array(itemSchema)
    .max(5, { error: "About section cannot exceed 5 items" })
    .default([]),
  responsibilities: z
    .array(itemSchema)
    .max(15, { error: "Responsibilities cannot exceed 15 items" })
    .default([]),
  requirements: z
    .array(itemSchema)
    .max(15, { error: "Requirements cannot exceed 15 items" })
    .default([]),
  nice_to_have: z
    .array(itemSchema)
    .max(10, { error: "Nice to have cannot exceed 10 items" })
    .default([]),
});

export type CareerRoleInput = z.infer<typeof careerRoleSchema>;

/**
 * Map raw database or RPC errors into user-friendly messages for admin form.
 */
export function mapAdminCareerError(error: unknown): string {
  if (!error) return "An unexpected error occurred.";

  const message =
    typeof error === "string"
      ? error
      : (error as { message?: string })?.message ||
        (error as { details?: string })?.details ||
        String(error);

  const code = (error as { code?: string })?.code;

  if (
    code === "23505" ||
    message.includes("23505") ||
    message.toLowerCase().includes("slug already exists") ||
    message.toLowerCase().includes("unique constraint") ||
    message.includes("career_roles_slug_key")
  ) {
    return "A role with this URL slug already exists. Please choose a different slug.";
  }

  if (message.includes("Slug cannot be changed once")) {
    return "The URL slug cannot be changed once a role has been published.";
  }

  if (message.includes("needs at least one responsibility")) {
    return "Please add at least 1 responsibility before publishing this role.";
  }

  if (message.includes("needs at least one requirement")) {
    return "Please add at least 1 requirement before publishing this role.";
  }

  if (message.includes("Unauthorized") || message.includes("is_admin")) {
    return "You do not have permission to perform this action.";
  }

  return message;
}
