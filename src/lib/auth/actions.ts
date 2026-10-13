// ─── Zed Authentication Actions (TODO: Wire to Supabase) ─────────────────────
// Simulated 800ms stubs for prototyping the complete auth flow without live backend.

import type { ZedUser } from "@/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * TODO: Replace with real Supabase Auth signInWithOtp()
 * Simulates sending a 6-digit OTP to the provided phone number.
 */
export async function sendOtp(
  phone: string,
  fullName?: string
): Promise<{ success: boolean; message: string }> {
  // Simulate network roundtrip
  await sleep(800);

  // Store phone and optional name in sessionStorage for OTP verification step
  if (typeof window !== "undefined") {
    sessionStorage.setItem("zed_auth_phone", normalizeNigerianPhone(phone));
    if (fullName) {
      sessionStorage.setItem("zed_auth_fullname", fullName.trim());
    }
  }

  return {
    success: true,
    message: `Verification code sent to ${normalizeNigerianPhone(phone)}`,
  };
}

/**
 * TODO: Replace with real Supabase Auth verifyOtp()
 * Simulates verifying the 6-digit OTP and issuing a session.
 */
export async function verifyOtp(
  phone: string,
  token: string
): Promise<{ success: boolean; user: ZedUser; message: string }> {
  await sleep(800);

  const storedName =
    typeof window !== "undefined"
      ? sessionStorage.getItem("zed_auth_fullname") || "Zayd Tahir"
      : "Zayd Tahir";

  const fakeUser: ZedUser = {
    id: "dev-usr-" + Math.random().toString(36).substring(2, 9),
    phone_number: normalizeNigerianPhone(phone),
    full_name: storedName,
    level_id: 1,
    is_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Set dev-session cookie so Next.js middleware allows accessing (app) routes
  if (typeof document !== "undefined") {
    document.cookie = "zed_dev_session=true; path=/; max-age=86400; SameSite=Lax";
  }

  return {
    success: true,
    user: fakeUser,
    message: "Phone number verified successfully.",
  };
}

/**
 * TODO: Replace with official NIMC hashing & validation endpoint
 * Simulates hashing and validating the 11-digit National Identity Number.
 */
export async function verifyNin(
  nin: string
): Promise<{ success: boolean; message: string; is_verified: boolean }> {
  await sleep(800);

  // Validate exactly 11 digits
  if (!isValidNIN(nin)) {
    throw new Error("National Identity Number must be exactly 11 numeric digits.");
  }

  return {
    success: true,
    is_verified: true,
    message: "National Identity verified. Civic Level 1 status unlocked.",
  };
}
