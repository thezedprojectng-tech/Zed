// ─── Zed Authentication Actions ──────────────────────────────────────────────
// Real Supabase Auth implementation using @supabase/ssr.
// Phone OTP (signInWithOtp) will be added when an SMS provider is configured.
// TODO: Wire phone OTP via supabase.auth.signInWithOtp() once Twilio / Africa's
//       Talking SMS provider is configured in the Supabase dashboard.

import { createClient } from "@/lib/supabase/client";

/**
 * Normalizes a Nigerian phone number to international format: +234XXXXXXXXXX
 */
export function normalizeNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("234") && cleaned.length === 13) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return `+234${cleaned.slice(1)}`;
  }
  if (cleaned.length === 10) {
    return `+234${cleaned}`;
  }
  return phone.trim();
}

/**
 * Validates Nigerian phone format (+234XXXXXXXXXX or 0XXXXXXXXXX)
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  // Matches +234 followed by 10 digits (e.g. +2348012345678) or 0 followed by 10 digits (08012345678)
  return /^(?:\+234|0)[789][01]\d{8}$/.test(cleaned);
}

/**
 * Validates 11-digit NIN format
 */
export function isValidNIN(nin: string): boolean {
  return /^\d{11}$/.test(nin.trim());
}

/**
 * Sign up a new user with email and password.
 * Passes full_name and phone_number into user_metadata.
 * A database trigger on auth.users automatically inserts the public.users profile row.
 */
export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}): Promise<{ success: boolean; message: string; hasSession: boolean }> {
  const supabase = createClient();

  const normalizedPhone = normalizeNigerianPhone(params.phoneNumber);

  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim().toLowerCase(),
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        phone_number: normalizedPhone,
      },
    },
  });

  if (error) {
    // If signup fails with "Database error saving new user", phone or email may already be registered
    if (
      error.message.includes("Database error saving new user") ||
      error.message.includes("already registered") ||
      error.message.includes("duplicate key") ||
      error.message.includes("unique")
    ) {
      throw new Error(
        "This phone number or email address is already registered. Please sign in instead."
      );
    }
    if (error.message.includes("Password should be")) {
      throw new Error("Password must be at least 8 characters long.");
    }
    throw new Error(error.message);
  }

  const hasSession = Boolean(data.session);

  return {
    success: true,
    hasSession,
    message: hasSession
      ? "Account created successfully! Welcome to Zed."
      : "Account created! Check your email for a confirmation link before signing in.",
  };
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(params: {
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: params.email.trim().toLowerCase(),
    password: params.password,
  });

  if (error) {
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      throw new Error(
        "Incorrect email or password. Please check your credentials and try again."
      );
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error(
        "Please confirm your email address before signing in. Check your inbox for a verification link."
      );
    }
    if (error.message.includes("Too many requests")) {
      throw new Error(
        "Too many login attempts. Please wait a moment and try again."
      );
    }
    throw new Error(error.message);
  }

  return {
    success: true,
    message: "Signed in successfully.",
  };
}

/**
 * Sign out the current user.
 * Clears the Supabase session cookie on the browser side.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
