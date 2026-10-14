"use client";

// TODO: Phone OTP authentication will be enabled here once an SMS provider
// (e.g. Twilio or Africa's Talking) is configured in the Supabase dashboard.
// Implementation: supabase.auth.signInWithOtp({ phone }) for sign-in,
// and supabase.auth.verifyOtp({ phone, token, type: "sms" }) to verify.

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Clock, ArrowLeft } from "lucide-react";

export default function VerifyOtpPage() {
  return (
    <AuthLayout
      title="Phone OTP — Coming Soon"
      subtitle="SMS-based one-time password verification will be available once an SMS provider is configured."
      rightHeadline={
        <>
          Secure, direct
          <br />
          citizen{" "}
          <span className="font-serif italic font-normal text-emerald-400">
            access.
          </span>
        </>
      }
      rightSubtext="Phone OTP verification is on our roadmap. For now, use your email and password to sign in."
    >
      <div className="space-y-6">
        {/* Status Card */}
        <div className="flex items-start gap-4 rounded-xl border border-hairline bg-secondary/30 p-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </span>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              SMS OTP is not yet available
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We need to configure an SMS provider before phone verification can
              work. In the meantime, you can sign in with your email and
              password, which is just as secure.
            </p>
          </div>
        </div>

        {/* CTA back to login */}
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to sign in</span>
        </Link>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            No account yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
