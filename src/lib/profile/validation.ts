import { z } from "zod";

export const BANNED_SUBSTRINGS = [
  "admin",
  "support",
  "official",
  "moderator",
  "zedproject",
  "zed_project",
] as const;

export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "zed",
  "zedproject",
  "support",
  "official",
  "moderator",
  "staff",
  "system",
  "null",
  "undefined",
  "root",
  "help",
  "zed_project",
  "the_zed_project",
  "thezedproject",
  "contact",
  "info",
  "security",
  "abuse",
  "noreply",
  "no_reply",
] as const;

export function isReservedUsername(username: string): boolean {
  const lower = username.toLowerCase().trim();
  return (RESERVED_USERNAMES as readonly string[]).includes(lower);
}

export function findBannedSubstring(text: string): string | null {
  const lower = text.toLowerCase();
  for (const sub of BANNED_SUBSTRINGS) {
    if (lower.includes(sub)) {
      return sub;
    }
  }
  return null;
}

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")
  .regex(
    /^[a-z][a-z0-9_]{2,19}$/,
    "Username must start with a letter and contain only lowercase letters, numbers, and underscores"
  )
  .refine(
    (val) => !isReservedUsername(val),
    {
      message: "That username is reserved",
    }
  )
  .refine(
    (val) => !findBannedSubstring(val),
    {
      message: "Username contains a prohibited or reserved term",
    }
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Display name must be at least 2 characters")
  .max(40, "Display name cannot exceed 40 characters")
  .refine(
    (val) => !/https?:\/\//i.test(val),
    { message: "Display name may not contain URLs" }
  )
  .refine(
    (val) => !val.includes("@"),
    { message: "Display name may not contain @" }
  )
  .refine(
    (val) => !/[\x00-\x1F\x7F]/.test(val),
    { message: "Display name contains invalid characters" }
  )
  .refine(
    (val) => !findBannedSubstring(val),
    {
      message: "Display name contains a prohibited word",
    }
  );

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name cannot exceed 100 characters");

export const profileUpdateSchema = z.object({
  display_name: z
    .union([displayNameSchema, z.literal(""), z.null(), z.undefined()])
    .transform((val) => (val === "" || val === undefined ? null : val)),
  username: z
    .union([usernameSchema, z.literal(""), z.null(), z.undefined()])
    .transform((val) => (val === "" || val === undefined ? null : val)),
  full_name: z.string().trim().min(2).max(100).optional(),
});

export const adminClearProfileSchema = z
  .object({
    userId: z.string().uuid("Invalid user ID"),
    clearUsername: z.boolean(),
    clearDisplayName: z.boolean(),
    clearAvatar: z.boolean(),
    reason: z
      .string()
      .trim()
      .min(3, "Reason must be at least 3 characters")
      .max(500, "Reason cannot exceed 500 characters"),
  })
  .refine(
    (data) => data.clearUsername || data.clearDisplayName || data.clearAvatar,
    {
      message: "Please select at least one field to clear",
      path: ["reason"],
    }
  );
