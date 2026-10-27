import { z } from "zod";
import type { MarketCategory, MarketCondition, MarketReportReason } from "./types";

export const SERVICE_CATEGORIES = [
  "design-and-creative",
  "tech-and-development",
  "tutoring-and-lessons",
  "writing-and-translation",
  "photography-and-video",
  "fashion-and-beauty-services",
  "repairs-and-maintenance",
  "errands-and-delivery",
  "events-and-entertainment",
  "business-and-admin",
  "other-services",
] as const;

export const MARKET_CATEGORIES: MarketCategory[] = [...SERVICE_CATEGORIES];

export const MARKET_CONDITIONS: MarketCondition[] = ["new", "used", "na"];

export const MARKET_REPORT_REASONS: MarketReportReason[] = [
  "scam",
  "prohibited",
  "duplicate",
  "other",
];

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const MAX_IMAGES_PER_LISTING = 4;

/**
 * Escapes SQL LIKE / ILIKE wildcards (% and _) in user-supplied search queries.
 */
export function escapeSearchQuery(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&").trim();
}

/**
 * Validates that an image path strictly adheres to ^<userId>/[A-Za-z0-9_.-]{1,100}$
 */
export function isValidImagePath(path: string, userId: string): boolean {
  if (!path || typeof path !== "string") return false;
  const escapedUid = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedUid}/[A-Za-z0-9_.-]{1,100}$`);
  return regex.test(path);
}

export const createListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description cannot exceed 2,000 characters"),
  category: z.enum(SERVICE_CATEGORIES, {
    error: () => ({ message: "Please select a valid service category" }),
  }),
  price_ngn: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
      return isNaN(num) ? null : num;
    })
    .refine((val) => val === null || val >= 0, {
      message: "Price must be 0 or greater (or leave blank for contact for price)",
    }),
  condition: z.enum(["new", "used", "na"] as const, {
    error: () => ({ message: "Please select a valid item condition" }),
  }),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters (e.g. Lagos, Yaba)")
    .max(80, "Location cannot exceed 80 characters"),
  image_paths: z
    .array(z.string())
    .max(MAX_IMAGES_PER_LISTING, `You can upload at most ${MAX_IMAGES_PER_LISTING} images`)
    .default([]),
  contact_whatsapp: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        return val.length >= 7 && val.length <= 25 && /^\+?[0-9\s-]+$/.test(val);
      },
      { message: "Please enter a valid WhatsApp number (e.g. +234 801 234 5678)" }
    ),
  confirm_allowed: z.boolean().refine((val) => val === true, {
    message: "You must confirm this service is allowed and that you are authorized to offer it.",
  }),
});

export const updateListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description cannot exceed 2,000 characters"),
  category: z.enum(SERVICE_CATEGORIES),
  price_ngn: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
      return isNaN(num) ? null : num;
    })
    .refine((val) => val === null || val >= 0, {
      message: "Price must be 0 or greater",
    }),
  condition: z.enum(["new", "used", "na"] as const),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(80, "Location cannot exceed 80 characters"),
  image_paths: z
    .array(z.string())
    .max(MAX_IMAGES_PER_LISTING)
    .default([]),
  contact_whatsapp: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        return val.length >= 7 && val.length <= 25 && /^\+?[0-9\s-]+$/.test(val);
      },
      { message: "Please enter a valid WhatsApp number" }
    ),
});

export const reportListingSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  reason: z.enum(["scam", "prohibited", "duplicate", "other"] as const, {
    error: () => ({ message: "Please select a valid reason" }),
  }),
  note: z
    .string()
    .trim()
    .max(300, "Note cannot exceed 300 characters")
    .optional()
    .nullable(),
});

export const adminRemoveListingSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  reason: z
    .string()
    .trim()
    .min(3, "Removal reason must be at least 3 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ReportListingInput = z.infer<typeof reportListingSchema>;
export type AdminRemoveListingInput = z.infer<typeof adminRemoveListingSchema>;
