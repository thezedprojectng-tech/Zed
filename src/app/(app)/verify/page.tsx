import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { VerifyBankClient } from "./VerifyBankClient";

export const metadata: Metadata = {
  title: "Bank Verification | Zed",
  description:
    "Confirm your Nigerian bank account before withdrawing ZED and to unlock higher Zed Market limits.",
};

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/verify");
  }

  // Fetch current user profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch current bank verification row
  const { data: verification } = await supabase
    .from("bank_verifications")
    .select(
      "id, bank_code, bank_name, account_number, account_name, status, reject_reason, reviewed_at, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <Header
        title="Bank verification"
        subtitle="Confirming a bank account is required before withdrawing ZED."
      />
      <VerifyBankClient
        profileName={profile?.full_name ?? ""}
        isUserVerified={Boolean(profile?.is_verified)}
        initialVerification={
          verification
            ? {
                id: verification.id,
                bank_code: verification.bank_code,
                bank_name: verification.bank_name,
                last4: verification.account_number.slice(-4),
                account_name: verification.account_name,
                status: verification.status as "pending" | "approved" | "rejected",
                reject_reason: verification.reject_reason,
                reviewed_at: verification.reviewed_at,
                created_at: verification.created_at,
              }
            : null
        }
      />
    </div>
  );
}
