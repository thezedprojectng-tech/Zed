"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Loader2,
  Phone,
  User,
  Mail,
  Lock,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { signUp, isValidNigerianPhone } from "@/lib/auth/actions";

const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name is too long"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => isValidNigerianPhone(val),
      "Please enter a valid Nigerian phone number (e.g. 0801 234 5678 or +234...)"
    ),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms and Privacy Policy to register",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      terms: undefined,
    },
  });

  const termsAccepted = watch("terms");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const res = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phone,
      });
      toast.success(res.message);
      // Redirect to login so the user can sign in after confirming their email
      router.push("/login?registered=true");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create citizen account"
      subtitle="Register to start navigating Nigerian civil institutions with clarity and speed."
      rightHeadline={
        <>
          Every next move,
          <br />
          in one{" "}
          <span className="font-serif italic font-normal text-emerald-400">
            place.
          </span>
        </>
      }
      rightSubtext="Deterministic bureaucratic playbooks for Nigerian youth. Passport renewals, NYSC call-up, and harmonised civil records."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
            Full Legal Name (as on NIN)
          </label>
          <div
            className={`flex h-14 items-center gap-3 rounded-xl border bg-secondary/30 px-4 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
              errors.fullName ? "border-destructive bg-destructive/5" : "border-hairline"
            }`}
          >
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="e.g. Babatunde Adeyemi"
              disabled={isLoading}
              autoComplete="name"
              className="h-full w-full bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground/60 font-sans disabled:opacity-50"
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Nigerian Mobile Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
            Nigerian Mobile Number
          </label>
          <div
            className={`flex h-14 items-center gap-3 rounded-xl border bg-secondary/30 px-4 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
              errors.phone ? "border-destructive bg-destructive/5" : "border-hairline"
            }`}
          >
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="tel"
              placeholder="0801 234 5678 or +234..."
              disabled={isLoading}
              autoComplete="tel"
              className="h-full w-full bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground/60 font-sans disabled:opacity-50"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errors.phone.message}
            </p>
          )}
        </div>

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

        {/* Terms and Privacy Checkbox */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={!!termsAccepted}
              onClick={() =>
                setValue("terms", !termsAccepted as any, { shouldValidate: true })
              }
              className={`relative mt-0.5 h-4 w-4 rounded border transition-colors flex items-center justify-center shrink-0 ${
                termsAccepted
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/40 bg-secondary/40"
              }`}
            >
              {termsAccepted && <Check className="h-3 w-3 stroke-[3]" />}
            </button>
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                Privacy Policy
              </Link>
              . My verification credentials remain client-side encrypted.
            </span>
          </label>
          {errors.terms && (
            <p className="text-xs font-medium text-destructive pl-7">
              {errors.terms.message}
            </p>
          )}
        </div>

        {/* Submit Action */}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm sm:text-base gap-2 shadow-lg shadow-primary/10 transition-all min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Alternate Navigation */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
