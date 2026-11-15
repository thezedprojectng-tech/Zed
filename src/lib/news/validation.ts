import { z } from "zod";

export const newsSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyNews(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const newsPostSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(80, "Slug cannot exceed 80 characters")
    .regex(newsSlugRegex, "Slug must be lowercase letters, numbers, and hyphens (e.g. platform-update-nov)"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(140, "Title cannot exceed 140 characters"),
  summary: z
    .string()
    .min(1, "Summary is required")
    .max(300, "Summary cannot exceed 300 characters"),
  body_md: z
    .string()
    .min(1, "Body markdown is required")
    .max(20000, "Body markdown cannot exceed 20,000 characters"),
  category: z.enum(["news", "update", "announcement"]),
  status: z.enum(["draft", "published", "archived"]),
  pinned: z.boolean().default(false),
});

export type NewsPostInput = z.infer<typeof newsPostSchema>;

export const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  update: "Product update",
  announcement: "Announcement",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};
