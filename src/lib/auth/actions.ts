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
 * Passes full_name and phone_number into user_metadata for profile hydration.
 */
export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        phone_number: normalizeNigerianPhone(params.phoneNumber),
      },
    },
  });

  if (error) {
    // Provide friendly messages for common errors
    if (error.message.includes("already registered")) {
      throw new Error(
        "An account with this email already exists. Please sign in instead."
      );
    }
    if (error.message.includes("Password should be")) {
      throw new Error("Password must be at least 8 characters long.");
    }
    throw new Error(error.message);
  }

  return {
    success: true,
    message:
      "Account created! Check your email for a confirmation link before signing in.",
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
    email: params.email,
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

/**
 * TODO: Replace with official NIMC hashing & validation endpoint
 * Simulates hashing and validating the 11-digit National Identity Number.
 */
export async function verifyNin(
  nin: string
): Promise<{ success: boolean; message: string; is_verified: boolean }> {
  // Validate exactly 11 digits
  if (!isValidNIN(nin)) {
    throw new Error("National Identity Number must be exactly 11 numeric digits.");
  }

  // TODO: Call the NIMC verification API here
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    is_verified: true,
    message: "National Identity verified. Civic Level 1 status unlocked.",
  };
}
