"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth/actions";
import { MIN_AGE, buildDob } from "@/lib/auth/age";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

export function DobGateDialog() {
  const router = useRouter();
  const { user, profile, loading, fetchProfile, clearUser } = useAuthStore();

  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [isUnderageBlocked, setIsUnderageBlocked] = useState(false);

  useEffect(() => {
    if (user?.id && typeof window !== "undefined") {
      if (localStorage.getItem(`zed_dob_underage_${user.id}`) === "true") {
        setIsUnderageBlocked(true);
      }
    }
  }, [user?.id]);

  // Only open when authentication has loaded and date_of_birth is null
  if (loading || !user || !profile || profile.date_of_birth !== null) {
    return null;
  }

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      if (user?.id && typeof window !== "undefined") {
        localStorage.removeItem(`zed_dob_underage_${user.id}`);
      }
      clearUser();
      await signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);

    if (!d || !m || !y) {
      setFieldError("Date of birth is required.");
      return;
    }

    const dob = buildDob(y, m, d);
    if (!dob) {
      setFieldError("Please enter a valid date of birth.");
      return;
    }

    setConfirmStep(true);
  };

  const handleConfirmDob = async () => {
    setFieldError(null);

    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);
    const dob = buildDob(y, m, d);

    if (!dob) {
      setConfirmStep(false);
      setFieldError("Please enter a valid date of birth.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("set_my_date_of_birth", {
        p_dob: dob,
      });

      if (error) {
        setFieldError("Failed to save date of birth. Please try again.");
        return;
      }

      const res = data as { ok: boolean; reason?: string } | null;
      if (res?.ok === true) {
        if (user?.id && typeof window !== "undefined") {
          localStorage.removeItem(`zed_dob_underage_${user.id}`);
        }
        toast.success("Date of birth confirmed.");
        await fetchProfile();
        router.refresh();
        return;
      }

      if (res?.reason === "underage") {
        if (user?.id && typeof window !== "undefined") {
          localStorage.setItem(`zed_dob_underage_${user.id}`, "true");
        }
        setIsUnderageBlocked(true);
      } else if (res?.reason === "already_set") {
        await fetchProfile();
      } else {
        setConfirmStep(false);
        setFieldError("Please enter a valid date of birth.");
      }
    } catch {
      setFieldError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMonthName = MONTHS.find((m) => m.value === dobMonth)?.label || dobMonth;

  return (
    <Dialog open={true}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md p-6"
      >
        {isUnderageBlocked ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-foreground">
                Access Restricted
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground pt-2">
                {`Zed is for people ${MIN_AGE} and older. We can't give you access to this account.`}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="sm:justify-center pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleLogout}
                disabled={isSubmitting}
                className="w-full sm:w-auto gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>Log out</span>
              </Button>
            </DialogFooter>
          </div>
        ) : confirmStep ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                Confirm your date of birth
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground pt-2 leading-relaxed">
                You entered <span className="font-semibold text-foreground">{dobDay} {selectedMonthName} {dobYear}</span>. This can&apos;t be changed later.
              </DialogDescription>
            </DialogHeader>

            {fieldError && (
              <p className="text-xs font-medium text-destructive">
                {fieldError}
              </p>
            )}

            <DialogFooter className="flex-row gap-2 pt-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmStep(false)}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDob}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                One quick thing: your date of birth
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
                {`Zed is a platform for youth aged ${MIN_AGE} and older. We need your date of birth to confirm you're eligible. You only have to do this once.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
                Date of Birth
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Day */}
                <div className="flex h-12 items-center rounded-xl border border-hairline bg-secondary/30 px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <select
                    value={dobDay}
                    onChange={(e) => {
                      setDobDay(e.target.value);
                      setFieldError(null);
                    }}
                    disabled={isSubmitting}
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none font-sans cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-popover text-muted-foreground">
                      Day
                    </option>
                    {DAYS.map((d) => (
                      <option key={d} value={d} className="bg-popover text-foreground">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div className="flex h-12 items-center rounded-xl border border-hairline bg-secondary/30 px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <select
                    value={dobMonth}
                    onChange={(e) => {
                      setDobMonth(e.target.value);
                      setFieldError(null);
                    }}
                    disabled={isSubmitting}
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none font-sans cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-popover text-muted-foreground">
                      Month
                    </option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-popover text-foreground">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="flex h-12 items-center rounded-xl border border-hairline bg-secondary/30 px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <select
                    value={dobYear}
                    onChange={(e) => {
                      setDobYear(e.target.value);
                      setFieldError(null);
                    }}
                    disabled={isSubmitting}
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none font-sans cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-popover text-muted-foreground">
                      Year
                    </option>
                    {YEARS.map((y) => (
                      <option key={y} value={String(y)} className="bg-popover text-foreground">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {fieldError && (
                <p className="text-xs font-medium text-destructive mt-1.5">
                  {fieldError}
                </p>
              )}
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                <span>Confirm date of birth</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
