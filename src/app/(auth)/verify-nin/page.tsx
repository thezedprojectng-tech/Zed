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
  ShieldCheck,
  Lock,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { isValidNIN } from "@/lib/auth/actions";
import { useAuthStore } from "@/store/useAuthStore";

const ninSchema = z.object({
  nin: z
    .string()
    .min(1, "National Identity Number is required")
    .transform((val) => val.replace(/\D/g, ""))
    .refine(
      (val) => isValidNIN(val),
      "National Identity Number must be exactly 11 numeric digits"
    ),
});

type NinFormData = z.infer<typeof ninSchema>;

export default function VerifyNinPage() {
  const router = useRouter();
  const { fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NinFormData>({
    resolver: zodResolver(ninSchema),
    defaultValues: {
      nin: "",
    },
  });

  const ninRaw = watch("nin") || "";
  const cleanedNin = ninRaw.replace(/\D/g, "");

  const onSubmit = async (data: NinFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/nin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin: data.nin }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to verify NIN.");
      }

      // Refresh store profile so is_verified updates across all components
      await fetchProfile();

      toast.success(result.message || "National Identity verified successfully!");
      router.push("/home");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to verify NIN. Please check the digits and try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Harmonise your NIN"
      subtitle="Verify your National Identity Number to unlock Rookie (Level 1)."
      rightHeadline={
        <>
          Identity privacy
          <br />
          by <span className="font-serif italic font-normal text-emerald-400">design.</span>
        </>
      }
      rightSubtext="Your NIN is sent over an encrypted connection, hashed with a secret salt on our server, and the raw number is never stored or logged. Only the hash is kept."
      rightFooterLeft="HASHED, NEVER STORED"
      rightFooterRight="DEMO MODE"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Prominent Demo Verification Notice */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <FlaskConical className="h-4 w-4 shrink-0" />
            <span>Demo Verification Sandbox</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            This is a mock verification environment for testing. You can enter any 11 digits (e.g.{" "}
            <code className="font-mono font-bold bg-amber-500/20 px-1 py-0.5 rounded">
              12345678901
            </code>
            ) to simulate verification and unlock Rookie (Level 1) in demo mode. No real NIMC check is performed.
          </p>
        </div>

        {/* NIN Input Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
              11-Digit National Identity Number
            </label>
            <span className="font-mono text-[11px] text-muted-foreground">
              {cleanedNin.length}/11 Digits
            </span>
          </div>

          <div
            className={`flex h-14 items-center gap-3 rounded-xl border bg-secondary/30 px-4 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
              errors.nin ? "border-destructive bg-destructive/5" : "border-hairline"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              placeholder="e.g. 12345678901"
              disabled={isLoading}
              className="h-full w-full bg-transparent font-mono text-base tracking-wider text-foreground outline-none placeholder:text-muted-foreground/50 placeholder:font-sans disabled:opacity-50"
              {...register("nin")}
            />
          </div>

          {errors.nin && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errors.nin.message}
            </p>
          )}
        </div>

        {/* Plain Language Privacy Note */}
        <div className="rounded-xl border border-hairline bg-secondary/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>How your National Identity is protected</span>
          </div>
          <p className="type-small text-[11px] text-muted-foreground leading-relaxed">
            Your NIN is sent securely to our server, hashed with salted SHA-256, and the raw number is never stored or logged. This is a demo, so no real NIMC check is made.
          </p>
        </div>

        {/* Submit Action */}
        <Button
          type="submit"
          disabled={isLoading || cleanedNin.length !== 11}
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm sm:text-base gap-2 shadow-lg shadow-primary/10 transition-all min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying National Identity...</span>
            </>
          ) : (
            <>
              <span>Verify National Identity</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Skip for now Link */}
        <div className="text-center pt-1">
          <Link
            href="/home"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wider"
          >
            <span>Skip for now</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
