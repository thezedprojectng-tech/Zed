import { z } from "zod";

export const applyReferralSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Referral code must be at least 3 characters")
    .max(20, "Referral code is too long")
    .regex(/^[A-Za-z0-9]+$/, "Referral code must be alphanumeric")
    .transform((val) => val.toUpperCase()),
});

export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;

export const adminReferralSettingsSchema = z.object({
  enabled: z.boolean(),
  referrer_reward_zed: z
    .number()
    .min(0, "Referrer reward cannot be negative")
    .max(10000, "Referrer reward cannot exceed 10,000 ZED")
    .finite("Must be a valid number"),
  referee_reward_zed: z
    .number()
    .min(0, "New user reward cannot be negative")
    .max(10000, "New user reward cannot exceed 10,000 ZED")
    .finite("Must be a valid number"),
  max_rewarded_per_referrer: z
    .number()
    .int("Must be an integer")
    .min(0, "Max rewarded cannot be negative")
    .max(1000, "Limit cannot exceed 1,000"),
});

export type AdminReferralSettingsInput = z.infer<
  typeof adminReferralSettingsSchema
>;
