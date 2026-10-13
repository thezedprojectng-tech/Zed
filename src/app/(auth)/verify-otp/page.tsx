"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, KeyRound } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { sendOtp, verifyOtp } from "@/lib/auth/actions";
import { useAuthStore } from "@/store/useAuthStore";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must contain only numbers"),
});

type OtpFormData = z.infer<typeof otpSchema>;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [phone, setPhone] = useState("+234 810 000 0000");

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const otpValue = watch("otp") || "";

  useEffect(() => {
    // Retrieve stored phone from sessionStorage
    const stored = sessionStorage.getItem("zed_auth_phone");
    if (stored) {
      setPhone(stored);
    }

    // Auto-focus input
    inputRef.current?.focus();

    // 30-second countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      const res = await sendOtp(phone);
      toast.success(res.message);
      setCountdown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    }
  };

  const onSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    try {
      const res = await verifyOtp(phone, data.otp);
      if (res.success && res.user) {
        setUser(res.user);
        toast.success(res.message);
        router.push("/verify-nin");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your phone"
      subtitle={`We sent a 6-digit security code to ${phone}.`}
      rightHeadline={
        <>
          Secure, direct
          <br />
          citizen <span className="font-serif italic font-normal text-emerald-400">access.</span>
        </>
      }
      rightSubtext="Single-use OTP validation eliminates forgotten passwords and protects your civil records."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* OTP 6-Digit Display & Input */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
            6-Digit Verification Code
          </label>

          {/* Hidden real input capturing keystrokes */}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={isLoading}
            value={otpValue}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setValue("otp", val, { shouldValidate: val.length === 6 });
            }}
            className="sr-only"
            aria-label="6 digit verification code"
          />

          {/* 6 Visual Digit Boxes (SolaceUI inspired) */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-between gap-2 sm:gap-3 cursor-text"
          >
            {Array.from({ length: 6 }).map((_, idx) => {
              const char = otpValue[idx] || "";
              const isCurrent = otpValue.length === idx;
              return (
                <div
                  key={idx}
                  className={`flex h-14 sm:h-16 flex-1 items-center justify-center rounded-xl border bg-secondary/30 font-mono text-xl sm:text-2xl font-bold transition-all ${
                    isCurrent
                      ? "border-primary ring-2 ring-primary/20 bg-background"
                      : char
                      ? "border-foreground/30 text-foreground"
                      : "border-hairline text-muted-foreground/40"
                  }`}
                >
                  {char || (isCurrent ? <span className="animate-pulse">|</span> : "")}
                </div>
              );
            })}
          </div>

          {errors.otp && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errors.otp.message}
            </p>
          )}

          {/* Resend Timer & Action */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-muted-foreground font-mono">
              {countdown > 0 ? (
                <>Resend available in {countdown}s</>
              ) : (
                "Didn't receive code?"
              )}
            </span>
            <button
              type="button"
              disabled={countdown > 0 || isLoading}
              onClick={handleResend}
              className={`font-semibold transition-colors ${
                countdown > 0
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-primary hover:underline underline-offset-4 cursor-pointer"
              }`}
            >
              Resend code
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <Button
          type="submit"
          disabled={isLoading || otpValue.length !== 6}
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm sm:text-base gap-2 shadow-lg shadow-primary/10 transition-all min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying code...</span>
            </>
          ) : (
            <>
              <span>Verify and continue</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Use a different phone number</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
