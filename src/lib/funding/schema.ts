import { z } from "zod";

export const FUNDING_CATEGORIES = [
  "Technology & Software",
  "Agriculture & Agritech",
  "Creative & Media",
  "Commerce & Retail",
  "Clean Energy & Climate",
  "Health & Biotech",
  "Education & Edtech",
  "Financial Services",
  "Other",
] as const;

export const FUNDING_STAGES = [
  { value: "idea", label: "Idea / Concept" },
  { value: "prototype", label: "Prototype / MVP" },
  { value: "launched", label: "Early Traction / Launched" },
] as const;

export const FUNDING_STATUSES = [
  "new",
  "reviewing",
  "shortlisted",
  "declined",
] as const;

export type FundingStage = (typeof FUNDING_STAGES)[number]["value"];
export type FundingStatus = (typeof FUNDING_STATUSES)[number];

export const fundingSubmissionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name cannot exceed 120 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(255, "Email address is too long")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(30, "Phone number cannot exceed 30 characters"),
  projectTitle: z
    .string()
    .trim()
    .min(3, "Project title must be at least 3 characters")
    .max(120, "Project title cannot exceed 120 characters"),
  category: z
    .string()
    .trim()
    .min(2, "Please select a category")
    .max(60, "Category is too long"),
  stage: z.enum(["idea", "prototype", "launched"]),
  fundingNeededNgn: z.coerce
    .number()
    .positive("Funding amount must be greater than zero")
    .max(1_000_000_000, "Funding amount cannot exceed ₦1,000,000,000"),
  summary: z
    .string()
    .trim()
    .min(20, "Summary must be at least 20 characters")
    .max(1500, "Summary cannot exceed 1,500 characters"),
  problem: z
    .string()
    .trim()
    .min(20, "Problem description must be at least 20 characters")
    .max(2000, "Problem description cannot exceed 2,000 characters"),
  plan: z
    .string()
    .trim()
    .min(20, "Execution plan must be at least 20 characters")
    .max(2000, "Execution plan cannot exceed 2,000 characters"),
  link: z
    .string()
    .trim()
    .max(500, "Link cannot exceed 500 characters")
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^https?:\/\/.+/i.test(val),
      "Link must start with http:// or https://"
    ),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must confirm the information is accurate and agree to be contacted",
  }),
  turnstileToken: z.string().optional(),
  hpCompanyField: z.string().optional(),
});

export type FundingSubmissionInput = z.infer<typeof fundingSubmissionSchema>;

export interface FundingSubmissionRow {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  project_title: string;
  category: string;
  stage: FundingStage;
  funding_needed_ngn: number;
  summary: string;
  problem: string;
  plan: string;
  link: string | null;
  status: FundingStatus;
  ip_hash: string;
  admin_note: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}
