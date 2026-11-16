import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

/** Shared password rule — same as signup */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

/**
 * Sends a password-reset email via Supabase.
 * Always resolves (never throws for email-not-found) to prevent user enumeration.
 * Throws only for rate-limit errors so the UI can surface them.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${window.location.origin}/reset-password` }
  );
  if (error) {
    if (
      error.message.toLowerCase().includes("rate") ||
      error.message.toLowerCase().includes("too many")
    ) {
      throw new Error(
        "Too many reset requests. Please wait a few minutes and try again."
      );
    }
    // Swallow all other errors — do not reveal whether the email exists
  }
}

/**
 * Updates the authenticated user's password then signs out.
 * Must be called while a recovery session is active.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
  await supabase.auth.signOut();
}
