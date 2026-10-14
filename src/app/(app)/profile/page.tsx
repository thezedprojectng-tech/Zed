"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogOut, User, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { signOut } from "@/lib/auth/actions";

export default function ProfilePage() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const phoneNumber = user?.user_metadata?.phone_number as string | undefined;
  const email = user?.email;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      clearUser();
      await signOut();
      toast.success("You have been signed out.");
      router.push("/login");
    } catch {
      toast.error("Sign out failed. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <Header title="Your Profile" subtitle="Manage your account and level." />
      <section className="container-mobile py-6 space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-hairline bg-card p-5 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Account Details
          </h2>

          <div className="space-y-3">
            {fullName && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
                    Full Name
                  </p>
                  <p className="font-medium text-foreground">{fullName}</p>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
                    Email
                  </p>
                  <p className="font-medium text-foreground">{email}</p>
                </div>
              </div>
            )}

            {phoneNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide">
                    Mobile Number
                  </p>
                  <p className="font-medium text-foreground">{phoneNumber}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase 2 placeholder */}
        <p className="text-xs text-muted-foreground">
          {/* Phase 2: avatar upload, level badge, NIN status, stats, settings */}
          More profile features are coming in Phase 2.
        </p>

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2 min-h-[44px]"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </>
          )}
        </Button>
      </section>
    </>
  );
}
