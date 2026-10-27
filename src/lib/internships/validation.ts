import { z } from "zod";

const HTTPS_URL_REGEX = /^https:\/\/[^\s@]+$/i;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const internshipTypeEnum = z.enum([
  "internship",
  "siwes",
  "industrial-training",
  "graduate-trainee",
  "volunteer",
  "fellowship",
  "other",
]);

export const internshipFieldEnum = z.enum([
  "tech",
  "design",
  "marketing",
  "finance",
  "engineering",
  "media",
  "healthcare",
  "business",
  "legal",
  "other",
]);

export const internshipWorkModeEnum = z.enum(["remote", "onsite", "hybrid"]);

export const internshipPaidStatusEnum = z.enum(["paid", "unpaid", "stipend", "unknown"]);

export const submitInternshipSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be between 5 and 120 characters")
      .max(120, "Title must be between 5 and 120 characters"),
    organization: z
      .string()
      .trim()
      .min(2, "Organization must be between 2 and 100 characters")
      .max(100, "Organization must be between 2 and 100 characters"),
    location: z
      .string()
      .trim()
      .min(2, "Location must be between 2 and 100 characters")
      .max(100, "Location must be between 2 and 100 characters"),
    work_mode: internshipWorkModeEnum,
    field: internshipFieldEnum,
    type: internshipTypeEnum,
    paid_status: internshipPaidStatusEnum,
    description: z
      .string()
      .trim()
      .min(30, "Description must be between 30 and 3,000 characters")
      .max(3000, "Description cannot exceed 3,000 characters"),
    eligibility: z
      .string()
      .trim()
      .max(1500, "Eligibility criteria cannot exceed 1,500 characters")
      .optional()
      .nullable(),
    apply_url: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          if (val.length > 500) return false;
          if (/\s/.test(val) || val.includes("@")) return false;
          return HTTPS_URL_REGEX.test(val);
        },
        {
          message: "Application URL must be a valid https:// link without credentials or whitespace (max 500 characters)",
        }
      ),
    apply_email: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return EMAIL_REGEX.test(val) && val.length <= 120;
        },
        {
          message: "Please provide a valid application email address",
        }
      ),
    deadline: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          // Validate YYYY-MM-DD format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
          const today = new Date().toISOString().split("T")[0];
          return val >= today;
        },
        {
          message: "Application deadline cannot be in the past",
        }
      ),
    feeConfirmation: z.literal(true, {
      message: "You must confirm this opportunity does not charge applicants any fee.",
    }),
    hpCompanyField: z.string().optional().nullable(),
    turnstileToken: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasUrl = Boolean(data.apply_url && data.apply_url.trim().length > 0);
      const hasEmail = Boolean(data.apply_email && data.apply_email.trim().length > 0);
      return hasUrl || hasEmail;
    },
    {
      message: "Please provide at least one contact method: Application URL or Application Email.",
      path: ["apply_url"],
    }
  );

export type SubmitInternshipInput = z.infer<typeof submitInternshipSchema>;

export const adminPublishSchema = z
  .object({
    id: z.string().uuid("Invalid internship ID"),
    title: z.string().trim().min(5).max(120),
    organization: z.string().trim().min(2).max(100),
    location: z.string().trim().min(2).max(100),
    work_mode: internshipWorkModeEnum,
    field: internshipFieldEnum,
    type: internshipTypeEnum,
    paid_status: internshipPaidStatusEnum,
    description: z.string().trim().min(30).max(3000),
    eligibility: z.string().trim().max(1500).optional().nullable(),
    apply_url: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine((val) => !val || (HTTPS_URL_REGEX.test(val) && !val.includes("@") && !/\s/.test(val) && val.length <= 500)),
    apply_email: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine((val) => !val || (EMAIL_REGEX.test(val) && val.length <= 120)),
    deadline: z.string().optional().nullable(),
  })
  .refine((data) => Boolean((data.apply_url && data.apply_url.trim()) || (data.apply_email && data.apply_email.trim())), {
    message: "At least one contact method (URL or Email) is required",
    path: ["apply_url"],
  });

export const adminRejectSchema = z.object({
  id: z.string().uuid("Invalid internship ID"),
  reason: z.string().trim().min(5, "Rejection reason must be at least 5 characters"),
});
