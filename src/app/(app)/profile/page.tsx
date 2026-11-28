"use client";

import { useState, useRef, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Trash2,
  Lock,
  Loader2,
  Check,
  AlertCircle,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  LogOut,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { signOut } from "@/lib/auth/actions";
import {
  updateMyProfile,
  uploadAvatar,
  removeAvatar,
} from "@/lib/profile/actions";
import {
  isReservedUsername,
  findBannedSubstring,
} from "@/lib/profile/validation";
import { getLevelName } from "@/types";
import { isVerifiedBadgeEnabled } from "@/lib/verification/flags";
import {
  SOCIAL_LINKS,
  XIcon,
  InstagramIcon,
  WhatsAppIcon,
  TikTokIcon,
} from "@/data/socials";
import { ProfileCertificatesSection } from "@/components/skill/ProfileCertificatesSection";
import { LeaderboardVisibilitySection } from "@/components/profile/LeaderboardVisibilitySection";

/**
 * Resizes and compresses an image file in the browser using HTML5 Canvas.
 * Outputs a lightweight WebP image capped at maxDim x maxDim.
 */
async function compressImageToCanvas(
  file: File,
  maxDim = 512,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp" }
            );
            resolve(compressed);
          },
          "image/webp",
          quality
        );
      } catch {
        resolve(file);
      }
    };
    img.onerror = () => resolve(file);

    reader.readAsDataURL(file);
  });
}

function getInitials(name?: string | null): string {
  if (!name) return "ZE";
  const parts = name.trim().split(" ");
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, fetchProfile, clearUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, startSaveTransition] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Form states initialized with current profile
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");

  // Sync internal state when profile arrives or updates
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  const isVerified = Boolean(profile?.is_verified);
  const civicLevel = profile?.level_id || 1;
  const email = user?.email || "";
  const phoneNumber = profile?.phone_number || (user?.user_metadata?.phone_number as string | undefined) || "";

  const avatarPath = profile?.avatar_path;
  const avatarSrc = avatarPath
    ? `/api/avatar/${avatarPath}`
    : profile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined);

  // Username cooldown calculation (30 days)
  const usernameChangedAt = profile?.username_changed_at;
  const usernameCooldown = useMemo(() => {
    if (!usernameChangedAt) return null;
    const changedAt = new Date(usernameChangedAt);
    const availableDate = new Date(changedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    if (availableDate > now) {
      return availableDate.toISOString().split("T")[0];
    }
    return null;
  }, [usernameChangedAt]);

  const isUsernameLocked = Boolean(usernameCooldown);

  // Live username validation feedback
  const usernameValidation = useMemo(() => {
    const raw = username.trim().toLowerCase();
    if (!raw) return { isValid: true, error: null };

    if (raw.length < 3) return { isValid: false, error: "Username must be at least 3 characters." };
    if (raw.length > 20) return { isValid: false, error: "Username must be at most 20 characters." };
    if (!/^[a-z]/.test(raw)) return { isValid: false, error: "Must start with a lowercase letter." };
    if (!/^[a-z][a-z0-9_]*$/.test(raw)) {
      return { isValid: false, error: "Letters, numbers, and underscores only." };
    }
    if (isReservedUsername(raw)) {
      return { isValid: false, error: "That username is reserved." };
    }
    const banned = findBannedSubstring(raw);
    if (banned) {
      return { isValid: false, error: `May not contain "${banned}".` };
    }

    return { isValid: true, error: null };
  }, [username]);

  // Live display name validation feedback
  const displayNameValidation = useMemo(() => {
    const raw = displayName.trim();
    if (!raw) return { isValid: true, error: null };

    if (raw.length < 2) return { isValid: false, error: "Display name must be at least 2 characters." };
    if (raw.length > 40) return { isValid: false, error: "Display name must be at most 40 characters." };
    if (/https?:\/\//i.test(raw)) return { isValid: false, error: "Cannot contain URLs." };
    if (raw.includes("@")) return { isValid: false, error: "Cannot contain @." };
    if (/[\x00-\x1F\x7F]/.test(raw)) return { isValid: false, error: "Invalid characters." };

    const banned = findBannedSubstring(raw);
    if (banned) {
      return { isValid: false, error: `May not contain "${banned}".` };
    }

    return { isValid: true, error: null };
  }, [displayName]);

  // Determine dirty state
  const isDirty = useMemo(() => {
    const initialDisplayName = (profile?.display_name || "").trim();
    const initialUsername = (profile?.username || "").trim().toLowerCase();
    const initialFullName = (profile?.full_name || "").trim();

    const currentDisplayName = displayName.trim();
    const currentUsername = username.trim().toLowerCase();
    const currentFullName = fullName.trim();

    if (currentDisplayName !== initialDisplayName) return true;
    if (!isUsernameLocked && currentUsername !== initialUsername) return true;
    if (!isVerified && currentFullName !== initialFullName) return true;

    return false;
  }, [displayName, username, fullName, profile, isUsernameLocked, isVerified]);

  // Warn on navigation away when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Avatar Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 1048576) {
      toast.error("File is larger than 1 MB before compression.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const compressed = await compressImageToCanvas(file, 512, 0.85);

      const formData = new FormData();
      formData.append("file", compressed);

      const res = await uploadAvatar(formData);
      if (!res.success) {
        toast.error(res.error || "Failed to upload avatar.");
      } else {
        toast.success("Profile photo updated.");
        await fetchProfile();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error uploading avatar.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Avatar Remove Handler
  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      const res = await removeAvatar();
      if (!res.success) {
        toast.error(res.error || "Failed to remove avatar.");
      } else {
        toast.success("Profile photo removed.");
        await fetchProfile();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error removing avatar.");
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setFullName(profile.full_name || "");
    }
  };

  // Save changes handler
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!usernameValidation.isValid && usernameValidation.error) {
      toast.error(usernameValidation.error);
      return;
    }

    if (!displayNameValidation.isValid && displayNameValidation.error) {
      toast.error(displayNameValidation.error);
      return;
    }

    startSaveTransition(async () => {
      const res = await updateMyProfile({
        display_name: displayName.trim() || null,
        username: isUsernameLocked ? undefined : username.trim().toLowerCase() || null,
        full_name: isVerified ? undefined : fullName.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to save profile.");
      } else {
        toast.success(res.message || "Profile updated successfully.");
        await fetchProfile();
      }
    });
  };

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

  const isFormValid =
    (!displayNameValidation.error) &&
    (!usernameValidation.error);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── 1. Page Header ───────────────────────────────────────── */}
      <header className="space-y-1.5 pb-2">
        <h1 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
          Profile
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage your personal information, public appearance, and account credentials.
        </p>
      </header>

      {/* ── 2. Personal Information Section ──────────────────────── */}
      <section
        aria-labelledby="personal-info-heading"
        className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6"
      >
        <div className="border-b border-border/50 pb-4">
          <h2 id="personal-info-heading" className="text-base font-semibold text-foreground">
            Personal information
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your public identity and display preferences across the Zed community.
          </p>
        </div>

        {/* Avatar block */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20 border-2 border-border/80 shadow-xs">
              <AvatarImage src={avatarSrc || ""} alt={displayName || fullName || "User"} />
              <AvatarFallback className="bg-secondary text-base font-semibold text-foreground">
                {getInitials(displayName || fullName)}
              </AvatarFallback>
            </Avatar>

            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <p className="text-sm font-medium text-foreground">Profile photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload a photo in JPG, PNG, or WebP format (max 1 MB). Resized and optimized automatically.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-file-upload"
                aria-label="Upload profile photo"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingAvatar || isRemovingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-3 text-xs font-medium border-border/70 hover:bg-secondary"
              >
                <Camera className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
                <span>{avatarPath ? "Change photo" : "Upload photo"}</span>
              </Button>

              {avatarPath && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  onClick={handleRemoveAvatar}
                  className="h-9 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {isRemovingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
                  )}
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Inputs (40px, labels above, inline validation) */}
        <form onSubmit={handleSaveProfile} className="space-y-5 pt-2 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-display-name" className="text-xs font-medium text-foreground">
                  Display name
                </label>
                <span className="text-[11px] font-sans text-muted-foreground tabular-nums">
                  {displayName.length}/40
                </span>
              </div>
              <input
                id="profile-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder="e.g. Zed Explorer"
                className="w-full h-10 px-3 rounded-lg border border-border/70 bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              />
              {displayNameValidation.error ? (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                  <span>{displayNameValidation.error}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Visible to other members across Zed.
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-username" className="text-xs font-medium text-foreground">
                  Username
                </label>
                <span className="text-[11px] font-sans text-muted-foreground tabular-nums">
                  {username.length}/20
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">
                  @
                </span>
                <input
                  id="profile-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  disabled={isUsernameLocked}
                  maxLength={20}
                  placeholder="username"
                  className={`w-full h-10 pl-8 pr-9 rounded-lg border text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
                    isUsernameLocked
                      ? "opacity-60 cursor-not-allowed border-border/70 bg-secondary/10"
                      : "focus:border-primary border-border/70 bg-secondary/30"
                  }`}
                />
                {isUsernameLocked && (
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              {isUsernameLocked ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
                  <Lock className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                  <span>Locked until {usernameCooldown} (30-day change limit).</span>
                </p>
              ) : usernameValidation.error ? (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                  <span>{usernameValidation.error}</span>
                </p>
              ) : username ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                  <Check className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                  <span>Username looks good.</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  3–20 characters. Can be changed once every 30 days.
                </p>
              )}
            </div>
          </div>

          {/* Full Legal Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="profile-full-name" className="text-xs font-medium text-foreground">
                Full legal name
              </label>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--data-verified-ink)]">
                  <Lock className="h-3 w-3 stroke-[1.5]" />
                  Verified
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="profile-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isVerified}
                placeholder="e.g. Chinonso Adeleke"
                className={`w-full h-10 px-3 rounded-lg border text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
                  isVerified
                    ? "bg-muted/40 cursor-not-allowed border-border/70 text-muted-foreground pr-9"
                    : "bg-secondary/30 focus:border-primary border-border/70"
                }`}
              />
              {isVerified && (
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground stroke-[1.5]" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isVerified ? (
                <span className="flex items-center gap-1 text-[var(--data-verified-ink)]">
                  <Lock className="h-3 w-3 shrink-0 stroke-[1.5]" />
                  Locked after verification.
                </span>
              ) : (
                "Will be locked once your account and bank details are verified."
              )}
            </p>
          </div>
        </form>
      </section>

      {/* ── 3. Account Details Section ───────────────────────────── */}
      <section
        aria-labelledby="account-details-heading"
        className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6"
      >
        <div className="border-b border-border/50 pb-4">
          <h2 id="account-details-heading" className="text-base font-semibold text-foreground">
            Account details
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Authentication credentials and platform verification status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-border/70 bg-secondary/20 px-3 text-sm text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0 stroke-[1.5]" />
                <span className="truncate">{email || "Not available"}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Primary login email for your Zed account.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Phone number
            </label>
            <div className="relative">
              <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-border/70 bg-secondary/20 px-3 text-sm text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0 stroke-[1.5]" />
                <span className="truncate">{phoneNumber || "No phone linked"}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for account security and SMS updates.
            </p>
          </div>
        </div>

        {/* Level and Verification Credentials Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Civic Level Tile */}
          <div className="rounded-lg border border-border/70 bg-secondary/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Civic level</span>
              <span className="inline-flex items-center rounded-md border border-[var(--data-signups-border)] bg-[var(--data-signups-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-signups-ink)]">
                Level {civicLevel}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              Level {civicLevel} — {getLevelName(civicLevel)}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Earn daily mining rewards and access tiered community permissions.
            </p>
          </div>

          {/* Verification Status Tile */}
          <div className="rounded-lg border border-border/70 bg-secondary/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Verification status</span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--data-verified-ink)]">
                  <ShieldCheck className="h-3 w-3 stroke-[1.5]" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="h-3 w-3 stroke-[1.5]" />
                  Unverified
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isVerified ? "Identity verified" : "Verification pending"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isVerified
                ? "Your identity and bank account have been reviewed and approved."
                : "Submit your bank account details for verification to unlock full privileges."}
            </p>
            {!isVerified && isVerifiedBadgeEnabled() && (
              <div className="pt-1">
                <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium border-border/70 hover:bg-secondary">
                  <Link href="/verify">
                    <span>Verify account now</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5 stroke-[1.5]" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. Official Community & Channels ─────────────────────── */}
      <section
        aria-labelledby="community-channels-heading"
        className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4"
      >
        <div>
          <h2 id="community-channels-heading" className="text-base font-semibold text-foreground">
            Official community & channels
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect with fellow Nigerian youths, get real-time center alerts, and follow platform updates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <a
            href={SOCIAL_LINKS.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-lg border border-border/70 bg-secondary/20 hover:bg-secondary/50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-md bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
              <WhatsAppIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground group-hover:text-[#25D366] transition-colors truncate">
                WhatsApp
              </p>
              <p className="text-[11px] text-muted-foreground truncate">Official channel</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 stroke-[1.5]" />
          </a>

          <a
            href={SOCIAL_LINKS.x.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-lg border border-border/70 bg-secondary/20 hover:bg-secondary/50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-md bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/60">
              <XIcon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                X (Twitter)
              </p>
              <p className="text-[11px] text-muted-foreground truncate">@thezedprojectng</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 stroke-[1.5]" />
          </a>

          <a
            href={SOCIAL_LINKS.instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-lg border border-border/70 bg-secondary/20 hover:bg-secondary/50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-md bg-[#E4405F]/10 text-[#E4405F] flex items-center justify-center shrink-0">
              <InstagramIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground group-hover:text-[#E4405F] transition-colors truncate">
                Instagram
              </p>
              <p className="text-[11px] text-muted-foreground truncate">@thezedprojectng</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 stroke-[1.5]" />
          </a>

          <a
            href={SOCIAL_LINKS.tiktok.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-lg border border-border/70 bg-secondary/20 hover:bg-secondary/50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-md bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/60">
              <TikTokIcon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                TikTok
              </p>
              <p className="text-[11px] text-muted-foreground truncate">@thezedprojectng</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 stroke-[1.5]" />
          </a>
        </div>
      </section>

      {/* ── 4.5 Certificates ────────────────────────────────────────── */}
      <ProfileCertificatesSection />

      {/* ── 4.75 Leaderboard Privacy ────────────────────────────────── */}
      <LeaderboardVisibilitySection />

      {/* ── 5. Security & Session ─────────────────────────────────── */}
      <section
        aria-labelledby="security-heading"
        className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4"
      >
        <div>
          <h2 id="security-heading" className="text-base font-semibold text-foreground">
            Security & session
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Terminate your session and sign out of your account on this device.
          </p>
        </div>

        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="h-10 px-4 text-xs font-medium border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2 stroke-[1.5]" />
                <span>Sign out</span>
              </>
            )}
          </Button>
        </div>
      </section>

      {/* ── 6. Sticky Save Bar (appears when form has unsaved changes) */}
      {isDirty && (
        <aside
          aria-label="Unsaved changes bar"
          className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-4 sm:px-6 lg:px-8 py-3 shadow-lg motion-safe:transition-transform"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="font-medium text-foreground">Unsaved changes</span>
              <span className="hidden sm:inline text-muted-foreground">· You have modifications in your profile.</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={handleDiscardChanges}
                className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Discard
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving || !isFormValid}
                onClick={() => handleSaveProfile()}
                className="h-9 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save changes</span>
                )}
              </Button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
