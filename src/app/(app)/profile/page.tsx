"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  Award,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { signOut } from "@/lib/auth/actions";
import { getLevelName } from "@/types";
import { SOCIAL_LINKS, XIcon, InstagramIcon, WhatsAppIcon } from "@/data/socials";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, clearUser } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fullName =
    profile?.full_name || (user?.user_metadata?.full_name as string | undefined);
  const phoneNumber =
    profile?.phone_number || (user?.user_metadata?.phone_number as string | undefined);
  const email = user?.email;
  const isVerified = Boolean(profile?.is_verified);
  const civicLevel = profile?.level_id || 1;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      clearUser();
      await signOut();
      toast.success("You have been signed out.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Sign out failed. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <Header title="Your Profile" subtitle="Manage your account details and progression." />
      <section className="container-mobile px-3 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Verification & Level Status Banner */}
        <div className="rounded-xl border border-hairline bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Level & Credentials
            </h2>
            <Badge
              variant="outline"
              className={
                isVerified
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              }
            >
              {isVerified ? "Verified Member" : "Verification Required"}
            </Badge>
          </div>

          <div className="flex items-start gap-4 pt-1">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                isVerified
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              }`}
            >
              {isVerified ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm">
                  Current Level: {getLevelName(civicLevel)}
                </p>
                <Award className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isVerified
                  ? `Your 11-digit NIN has been verified in demo mode. Your account status is verified at level ${getLevelName(civicLevel)}.`
                  : "Your account is unverified. Verify your National Identity Number (NIN) in demo mode to verify your account and unlock your next level."}
              </p>
            </div>
          </div>

          {!isVerified && (
            <div className="pt-2">
              <Button asChild size="sm" className="w-full gap-2">
                <Link href="/verify-nin">
                  <span>Verify NIN now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

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

        {/* Community & Support */}
        <div className="rounded-xl border border-hairline bg-card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Official Community & Channels
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect with fellow Nigerian youths, get real-time center alerts, and follow updates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <a
              href={SOCIAL_LINKS.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-lg border border-hairline bg-secondary/30 hover:bg-secondary hover:border-[#25D366]/40 transition-colors group"
            >
              <div className="h-8 w-8 rounded-md bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                <WhatsAppIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground group-hover:text-[#25D366] transition-colors truncate">
                  WhatsApp
                </p>
                <p className="text-[10px] text-muted-foreground truncate">Official Channel</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>

            <a
              href={SOCIAL_LINKS.x.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-lg border border-hairline bg-secondary/30 hover:bg-secondary transition-colors group"
            >
              <div className="h-8 w-8 rounded-md bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border">
                <XIcon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  X (Twitter)
                </p>
                <p className="text-[10px] text-muted-foreground truncate">@thezedprojectng</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>

            <a
              href={SOCIAL_LINKS.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-lg border border-hairline bg-secondary/30 hover:bg-secondary hover:border-[#E4405F]/40 transition-colors group"
            >
              <div className="h-8 w-8 rounded-md bg-[#E4405F]/10 text-[#E4405F] flex items-center justify-center shrink-0">
                <InstagramIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground group-hover:text-[#E4405F] transition-colors truncate">
                  Instagram
                </p>
                <p className="text-[10px] text-muted-foreground truncate">@thezedprojectng</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>
          </div>
        </div>

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
