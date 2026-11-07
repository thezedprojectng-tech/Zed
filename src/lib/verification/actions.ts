"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bankVerificationSubmitSchema } from "./validation";

export type SubmitBankVerificationResult =
  | { ok: true }
  | { ok: false; error: string; reason?: string };

const REASON_MESSAGES: Record<string, string> = {
  already_approved: "Your bank verification has already been approved.",
  already_pending: "You already have a pending verification under review.",
  account_in_use: "This bank account is already registered to another user.",
  invalid_bank_code: "Selected bank is not recognized. Please choose from the list.",
  invalid_account_number: "Account number must be exactly 10 digits.",
  invalid_account_name: "Account name must be between 2 and 100 characters.",
  not_authenticated: "You must be signed in to submit bank verification.",
};

export async function submitBankVerificationAction(
  rawInput: unknown
): Promise<SubmitBankVerificationResult> {
  try {
    const parsed = bankVerificationSubmitSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return { ok: false, error: firstError };
    }

    const { bank_code, account_number, account_name } = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        error: "You must be signed in to submit bank verification.",
        reason: "not_authenticated",
      };
    }

    const { data, error } = await supabase.rpc("submit_my_bank_verification", {
      p_bank_code: bank_code,
      p_account_number: account_number,
      p_account_name: account_name,
    });

    if (error) {
      console.error("[Verification] submit_my_bank_verification RPC error:", {
        code: error.code,
        message: error.message,
      });
      return {
        ok: false,
        error: "An unexpected error occurred while saving your verification. Please try again.",
      };
    }

    const response = data as { ok: boolean; reason?: string } | null;

    if (!response || !response.ok) {
      const reason = response?.reason ?? "unknown";
      const message =
        REASON_MESSAGES[reason] ||
        "Could not submit bank verification. Please check your information.";
      return { ok: false, error: message, reason };
    }

    revalidatePath("/verify");
    revalidatePath("/profile");

    return { ok: true };
  } catch (err) {
    console.error(
      "[Verification] submitBankVerificationAction unexpected error:",
      err && typeof err === "object" && "code" in err && "message" in err
        ? { code: (err as { code: unknown }).code, message: (err as { message: unknown }).message }
        : err
    );
    return {
      ok: false,
      error: "Failed to submit bank verification",
    };
  }
}

