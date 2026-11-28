"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthTurnstile } from "@/components/auth/AuthTurnstile";
import { Button } from "@/components/ui/button";
import {
  forgotPasswordSchema,
  type ForgotPasswordData,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset";

function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [rateLimitError, setRateLimitError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const resetCaptcha = () => {
    try {
      turnstileRef.current?.reset();
    } catch {
      /* ignore */
    }
    setCaptchaToken(null);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    if (!captchaToken) {
      setCaptchaError("Please confirm you are human and try again.");
      return;
    }
    setIsLoading(true);
    setRateLimitError("");
    setCaptchaError(null);
    try {
      await sendPasswordResetEmail(data.email, captchaToken);
      setSentEmail(data.email);
      setSent(true);
    } catch (err: unknown) {
      resetCaptcha();
      setRateLimitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm text-foreground font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>, you
            will receive a password-reset link shortly.
          </p>
          <p className="text-xs text-muted-foreground">
            Check your spam folder if it doesn&apos;t arrive within a few minutes.
          </p>
        </div>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {rateLimitError && (
        <p className="text-xs font-medium text-destructive">{rateLimitError}</p>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
          Email Address
        </label>
        <div
          className={`flex h-14 items-center gap-3 rounded-xl border bg-secondary/30 px-4 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
            errors.email ? "border-destructive bg-destructive/5" : "border-hairline"
          }`}
        >
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="email"
            placeholder="you@example.com"
            disabled={isLoading}
            autoComplete="email"
            className="h-full w-full bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground/60 font-sans disabled:opacity-50"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs font-medium text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <AuthTurnstile
        turnstileRef={turnstileRef}
        error={captchaError}
        onTokenChange={setCaptchaToken}
        onErrorChange={setCaptchaError}
      />

      <Button
        type="submit"
        disabled={isLoading || !captchaToken}
        className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm sm:text-base gap-2 shadow-lg shadow-primary/10 transition-all min-h-[44px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send reset link</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
      rightHeadline={
        <>
          Regain access to your
          <br />
          civil{" "}
          <span className="font-serif italic font-normal text-[#2E82F7]">
            dashboard.
          </span>
        </>
      }
      rightSubtext="Enter your registered email and we'll send a secure reset link to your inbox."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
