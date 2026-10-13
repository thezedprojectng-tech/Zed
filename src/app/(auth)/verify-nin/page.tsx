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
  ShieldAlert,
  ShieldCheck,
  Lock,
  ChevronRight,
} from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { verifyNin, isValidNIN } from "@/lib/auth/actions";
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
  const { user, setUser } = useAuthStore();
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
      const res = await verifyNin(data.nin);
      if (res.success) {
        if (user) {
          setUser({
            ...user,
            is_verified: true,
            level_id: 1,
          });
        }
        toast.success(res.message);
        router.push("/home");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify NIN. Please check the digits and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Harmonise your NIN"
      subtitle="Validate your National Identity Number to unlock Civic Level 1 and automated form filling."
      rightHeadline={
        <>
          Identity privacy
          <br />
          by <span className="font-serif italic font-normal text-emerald-400">design.</span>
        </>
      }
      rightSubtext="Your NIN is hashed directly on your device. We never transmit or store your raw credentials on central servers."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            Your 11-digit NIN is hashed locally using cryptographic SHA-256 before verification against official NIMC records. Zed never stores or sells your raw identity number.
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
              <span>Verifying with NIMC...</span>
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
