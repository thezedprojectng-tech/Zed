"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import {
  resetPasswordSchema,
  type ResetPasswordData,
  updatePassword,
} from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState<boolean | null>(null); // null = checking
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The recovery link sets the session via the URL hash.
    // onAuthStateChange fires with SIGNED_IN + type=recovery when the token is consumed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        } else if (event === "SIGNED_IN" && session) {
          // Also handle when the token exchange happens as SIGNED_IN
          setSessionReady(true);
        }
      }
    );

    // Also check if there's already an active session (user navigated back)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // Give the hash exchange a moment before marking as invalid
        setTimeout(() => {
          setSessionReady((prev) => (prev === null ? false : prev));
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordData) => {
    setIsLoading(true);
    try {
      await updatePassword(data.password);
      toast.success("Password updated. Please sign in with your new password.");
      router.push("/login?password_reset=true");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Still checking session
  if (sessionReady === null) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Invalid / expired link
  if (sessionReady === false) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Link expired or invalid</p>
          <p className="text-sm text-muted-foreground">
            This password-reset link has expired or has already been used. Reset
            links are valid for one hour.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-block text-xs font-semibold text-primary hover:underline underline-offset-4"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* New password */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
          New password
        </label>
        <div
          className={`flex h-14 items-center gap-3 rounded-xl border bg-secondary/30 px-4 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
            errors.password ? "border-destructive bg-destructive/5" : "border-hairline"
          }`}
        >
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            disabled={isLoading}
            autoComplete="new-password"
            className="h-full w-full bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground/60 font-sans disabled:opacity-50"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
          Confirm new password
        </label>
        <div
          className={`flex h-14 items-center gap-3 rounded-xl border bg-secondary/30 px-4 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
            errors.confirmPassword ? "border-destructive bg-destructive/5" : "border-hairline"
          }`}
        >
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat your new password"
            disabled={isLoading}
            autoComplete="new-password"
            className="h-full w-full bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground/60 font-sans disabled:opacity-50"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs font-medium text-destructive mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm sm:text-base gap-2 shadow-lg shadow-primary/10 transition-all min-h-[44px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating password...</span>
          </>
        ) : (
          <span>Set new password</span>
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your Zed account."
      rightHeadline={
        <>
          Secure your
          <br />
          <span className="font-serif italic font-normal text-[#2E82F7]">
            account.
          </span>
        </>
      }
      rightSubtext="Choose a strong password you haven't used before."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
