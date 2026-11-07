import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { VerifyBankClient } from "./VerifyBankClient";

export const metadata: Metadata = {
  title: "Bank Account Verification | Zed",
  description: "Verify your bank account for civic identity and future payouts.",
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
    .select("id, bank_code, bank_name, account_number, account_name, status, reject_reason, reviewed_at, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <Header
        title="Bank Verification"
        subtitle="Confirm your identity and link your account for future payouts."
      />
      <main className="container-mobile px-3 py-6 space-y-6 max-w-2xl mx-auto">
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
      </main>
    </>
  );
}

