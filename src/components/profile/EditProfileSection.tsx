"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  Camera,
  Trash2,
  Lock,
  Loader2,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import {
  updateMyProfile,
  uploadAvatar,
  removeAvatar,
} from "@/lib/profile/actions";
import {
  isReservedUsername,
  findBannedSubstring,
} from "@/lib/profile/validation";

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
    // If not in browser or invalid file, fallback to original
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

export function EditProfileSection() {
  const { user, profile, fetchProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, startSaveTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Form states initialized with current profile
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");

  const isVerified = Boolean(profile?.is_verified);
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

    if (raw.length < 3) return { isValid: false, error: "At least 3 characters" };
    if (raw.length > 20) return { isValid: false, error: "At most 20 characters" };
    if (!/^[a-z]/.test(raw)) return { isValid: false, error: "Must start with a lowercase letter" };
    if (!/^[a-z][a-z0-9_]*$/.test(raw)) {
      return { isValid: false, error: "Letters, numbers, and underscores only" };
    }
    if (isReservedUsername(raw)) {
      return { isValid: false, error: "That username is reserved" };
    }
    const banned = findBannedSubstring(raw);
    if (banned) {
      return { isValid: false, error: `May not contain "${banned}"` };
    }

    return { isValid: true, error: null };
  }, [username]);

  // Live display name validation feedback
  const displayNameValidation = useMemo(() => {
    const raw = displayName.trim();
    if (!raw) return { isValid: true, error: null };

    if (raw.length < 2) return { isValid: false, error: "At least 2 characters" };
    if (raw.length > 40) return { isValid: false, error: "At most 40 characters" };
    if (/https?:\/\//i.test(raw)) return { isValid: false, error: "Cannot contain URLs" };
    if (raw.includes("@")) return { isValid: false, error: "Cannot contain @" };
    if (/[\x00-\x1F\x7F]/.test(raw)) return { isValid: false, error: "Invalid characters" };

    const banned = findBannedSubstring(raw);
    if (banned) {
      return { isValid: false, error: `May not contain "${banned}"` };
    }

    return { isValid: true, error: null };
  }, [displayName]);

  // Initials generator
  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Avatar Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 1048576) {
      // 1 MB
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

  // Profile Form Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

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

  return (
    <section aria-labelledby="edit-profile-heading" className="rounded-xl border border-hairline bg-card p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <h2 id="edit-profile-heading" className="text-sm font-semibold text-foreground flex items-center gap-2">
            Edit Profile
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize your public presence, username, and profile picture across Zed.
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative group shrink-0">
          <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
            <AvatarImage src={avatarSrc || ""} alt={displayName || fullName || "User"} />
            <AvatarFallback className="bg-secondary font-mono text-base font-bold text-foreground">
              {getInitials(displayName || fullName)}
            </AvatarFallback>
          </Avatar>

          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <h3 className="text-xs font-semibold text-foreground">Profile Picture</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Upload a photo in JPEG, PNG, or WebP format (max 1 MB). We automatically resize and optimize it for high performance.
          </p>

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
              className="gap-1.5 text-xs h-8"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>{avatarPath ? "Change Picture" : "Upload Picture"}</span>
            </Button>

            {avatarPath && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploadingAvatar || isRemovingAvatar}
                onClick={handleRemoveAvatar}
                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
              >
                {isRemovingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Remove</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Display Name Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="profile-display-name" className="text-xs font-semibold text-foreground">
                Display Name
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {displayName.length}/40
              </span>
            </div>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="e.g. Zayd T"
              className="w-full h-9 px-3 rounded-lg border border-border bg-secondary/30 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
            {displayNameValidation.error ? (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{displayNameValidation.error}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                The name visible to other members across Zed.
              </p>
            )}
          </div>

          {/* Username Input with live hints */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="profile-username" className="text-xs font-semibold text-foreground">
                Username
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {username.length}/20
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground select-none">
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
                className={`w-full h-9 pl-7 pr-3 rounded-lg border bg-secondary/30 font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
                  isUsernameLocked
                    ? "opacity-60 cursor-not-allowed border-border"
                    : "focus:border-primary border-border"
                }`}
              />
            </div>

            {isUsernameLocked ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                <Info className="h-3 w-3 shrink-0" />
                <span>Username cooldown active. Next change available: {usernameCooldown}.</span>
              </p>
            ) : usernameValidation.error ? (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{usernameValidation.error}</span>
              </p>
            ) : username ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <Check className="h-3 w-3 shrink-0" />
                <span>Username format looks good!</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                3–20 chars, lowercase letters, numbers, and underscores. Can only be changed once every 30 days.
              </p>
            )}
          </div>
        </div>

        {/* Full Name / Verified Legal Name */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <label htmlFor="profile-full-name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Full Legal Name</span>
              {isVerified && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                  <Lock className="h-2.5 w-2.5" />
                  Verified Name
                </Badge>
              )}
            </label>
          </div>

          <div className="relative">
            <input
              id="profile-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isVerified}
              placeholder="Your full legal name"
              className={`w-full h-9 px-3 rounded-lg border text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
                isVerified
                  ? "bg-muted/40 cursor-not-allowed border-border text-muted-foreground pr-8"
                  : "bg-secondary/30 focus:border-primary border-border"
              }`}
            />
            {isVerified && (
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground select-none" />
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">
            {isVerified
              ? "Your full name is verified via NIN and locked to protect your account integrity and trust."
              : "Will be locked permanently once you complete your official NIN verification."}
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={
              isSaving ||
              (!usernameValidation.isValid && Boolean(usernameValidation.error)) ||
              (!displayNameValidation.isValid && Boolean(displayNameValidation.error))
            }
            className="gap-1.5 text-xs px-4"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
