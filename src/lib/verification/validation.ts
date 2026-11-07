import { z } from "zod";
import { VALID_BANK_CODES } from "./banks";

export const bankVerificationSubmitSchema = z.object({
  bank_code: z.enum(VALID_BANK_CODES, {
    message: "Please select a supported bank",
  }),
  account_number: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Account number must be exactly 10 digits"),
  account_name: z
    .string()
    .trim()
    .min(2, "Account name must be at least 2 characters")
    .max(100, "Account name cannot exceed 100 characters"),
});

export type BankVerificationSubmitInput = z.infer<typeof bankVerificationSubmitSchema>;

export const adminReviewBankVerificationSchema = z
  .object({
    verification_id: z.string().uuid("Invalid verification ID"),
    approve: z.boolean(),
    reason: z.string().trim().max(200, "Reason cannot exceed 200 characters").optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.approve) {
      const trimmedReason = data.reason?.trim() ?? "";
      if (trimmedReason.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rejection reason must be at least 5 characters",
          path: ["reason"],
        });
      }
    }
  });

export type AdminReviewBankVerificationInput = z.infer<typeof adminReviewBankVerificationSchema>;

