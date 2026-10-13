"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Phone } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { sendOtp, isValidNigerianPhone } from "@/lib/auth/actions";

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => isValidNigerianPhone(val),
      "Please enter a valid Nigerian phone number (e.g. 0801 234 5678 or +234...)"
    ),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await sendOtp(data.phone);
      if (res.success) {
        toast.success(res.message);
        router.push("/verify-otp");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to Zed"
      subtitle="Enter your Nigerian mobile number to receive an instant verification code."
      rightHeadline={
        <>
          Welcome back to
          <br />
          citizen <span className="font-serif italic font-normal text-emerald-400">clarity.</span>
        </>
      }
      rightSubtext="Access your active civil guides, synchronized documents, and local queue reports."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Phone Input Field (SolaceUI styled 56px box) */}
        <div className="space-y-2">
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

        {/* Submit Action */}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm sm:text-base gap-2 shadow-lg shadow-primary/10 transition-all min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending code...</span>
            </>
          ) : (
            <>
              <span>Send code</span>
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
    </AuthLayout>
  );
}
