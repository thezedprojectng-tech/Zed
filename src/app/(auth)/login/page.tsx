"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth/actions";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Inner component — can safely call useSearchParams() inside Suspense ───────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Show a confirmation message when arriving from the signup flow
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.info(
        "Account created! Check your email to confirm your address, then sign in here."
      );
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn({ email: data.email, password: data.password });
      toast.success("Welcome back!");
      // Hard navigate so middleware re-evaluates the fresh session cookie
      router.push("/home");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
          Password
        </label>
        <div
          className={`flex h-14 items-center gap-3 rounded-xl border bg-secondary/30 px-4 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
            errors.password ? "border-destructive bg-destructive/5" : "border-hairline"
          }`}
        >
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            disabled={isLoading}
            autoComplete="current-password"
            className="h-full w-full bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground/60 font-sans disabled:opacity-50"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm sm:text-base gap-2 shadow-lg shadow-primary/10 transition-all min-h-[44px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      {/* Alternate Navigation */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}

// ── Page — wraps the form in Suspense so useSearchParams() is safe to use ─────
export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in to Zed"
      subtitle="Enter your email and password to access your civil dashboard."
      rightHeadline={
        <>
          Welcome back to
          <br />
          citizen{" "}
          <span className="font-serif italic font-normal text-emerald-400">
            clarity.
          </span>
        </>
      }
      rightSubtext="Access your active civil guides, synchronized documents, and local queue reports."
    >
      {/*
       * Suspense is required because LoginForm calls useSearchParams().
       * Without it, Next.js cannot statically prerender this page.
       */}
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-secondary/30" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
