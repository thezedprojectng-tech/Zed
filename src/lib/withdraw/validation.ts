import { z } from "zod";

export const withdrawalRequestSchema = z.object({
  amount_zed: z
    .number()
    .positive("Withdrawal amount must be greater than zero")
    .finite("Amount must be a valid number"),
  bank_name: z
    .string()
    .trim()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name is too long"),
  account_number: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Account number must be exactly 10 digits"),
  account_name: z
    .string()
    .trim()
    .min(2, "Account name must be at least 2 characters")
    .max(100, "Account name is too long"),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;

export const adminSettingsSchema = z
  .object({
    token_price_ngn: z
      .number()
      .min(0, "Token price cannot be negative")
      .finite("Must be a valid number"),
    withdrawals_enabled: z.boolean(),
    min_withdraw_zed: z
      .number()
      .min(0, "Minimum withdrawal cannot be negative")
      .finite("Must be a valid number"),
    max_withdraw_zed: z
      .number()
      .min(0, "Maximum withdrawal cannot be negative")
      .finite("Must be a valid number"),
    min_level: z
      .number()
      .int("Minimum level must be an integer")
      .min(1, "Minimum level must be at least 1")
      .max(10, "Minimum level cannot exceed 10"),
  })
  .refine((data) => data.max_withdraw_zed >= data.min_withdraw_zed, {
    message: "Maximum withdrawal must be greater than or equal to minimum withdrawal",
    path: ["max_withdraw_zed"],
  });

export type AdminSettingsInput = z.infer<typeof adminSettingsSchema>;

export const adminReviewSchema = z
  .object({
    decision: z.enum(["approved", "rejected", "paid"]),
    note: z.string().trim().max(500, "Note is too long").optional(),
    reject_reason: z.string().trim().max(500, "Reason is too long").optional(),
  })
  .refine(
    (data) => {
      if (
        data.decision === "rejected" &&
        (!data.reject_reason || data.reject_reason.trim().length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "A rejection reason is required when rejecting a withdrawal request",
      path: ["reject_reason"],
    }
  );

export type AdminReviewInput = z.infer<typeof adminReviewSchema>;
