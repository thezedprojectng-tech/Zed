"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  User,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/useAuthStore";
import { signOut } from "@/lib/auth/actions";
import { getLevelName } from "@/types";

interface UserMenuProps {
  children?: React.ReactNode;
  align?: "start" | "end" | "center";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function UserMenu({
  children,
  align = "end",
  side = "bottom",
  className,
}: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, profile, clearUser } = useAuthStore();

  const handleSignOut = async () => {
    clearUser();
    await signOut();
    router.push("/login");
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const fullName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined);
  const displayName = profile?.display_name || fullName;
  const avatarPath = profile?.avatar_path;
  const avatarUrl = avatarPath
    ? `/api/avatar/${avatarPath}`
    : profile?.avatar_url ||
      (user?.user_metadata?.avatar_url as string | undefined);
  const email = user?.email;
  const civicLevel = profile?.level_id ?? 1;
  const isAdmin = profile?.role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ? (
          children
        ) : (
          <button
            type="button"
            className={cn(
              "rounded-full ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              className
            )}
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8 border border-border/70">
              <AvatarImage src={avatarUrl || ""} alt={displayName || "User"} />
              <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-60 rounded-lg border border-border/70 bg-popover p-1.5 shadow-md z-50"
      >
        {/* User identification */}
        <div className="px-3 py-2 flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground truncate">
            {displayName || "User"}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {profile?.username ? `@${profile.username}` : email || ""}
          </span>
          <div className="mt-1">
            <span className="text-[11px] font-normal text-muted-foreground">
              Level {civicLevel} · {getLevelName(civicLevel)}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {/* Profile & credentials */}
        <DropdownMenuItem asChild className="h-9 px-2.5 text-xs rounded-md cursor-pointer">
          <Link href="/profile" className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-muted-foreground stroke-[1.5]" />
            <span>Profile &amp; credentials</span>
          </Link>
        </DropdownMenuItem>

        {/* Verify account */}
        <DropdownMenuItem asChild className="h-9 px-2.5 text-xs rounded-md cursor-pointer">
          <Link href="/verify" className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-muted-foreground stroke-[1.5]" />
            <span>Verify account</span>
          </Link>
        </DropdownMenuItem>

        {/* Admin console link if admin */}
        {isAdmin && (
          <DropdownMenuItem asChild className="h-9 px-2.5 text-xs rounded-md cursor-pointer">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400"
            >
              <LayoutDashboard className="h-4 w-4 stroke-[1.5]" />
              <span>Admin console</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {/* Theme Segmented Control */}
        <div className="px-2.5 py-1.5">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-secondary/50 rounded-md border border-border/50">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "h-7 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-120",
                theme === "light"
                  ? "bg-card text-foreground shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-3 w-3 stroke-[1.5]" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "h-7 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-120",
                theme === "dark"
                  ? "bg-card text-foreground shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="h-3 w-3 stroke-[1.5]" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={cn(
                "h-7 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-120",
                theme === "system"
                  ? "bg-card text-foreground shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Laptop className="h-3 w-3 stroke-[1.5]" />
              <span>System</span>
            </button>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="h-9 px-2.5 text-xs text-destructive focus:text-destructive focus:bg-destructive/10 rounded-md cursor-pointer flex items-center gap-2.5"
        >
          <LogOut className="h-4 w-4 stroke-[1.5]" />
          <span>Sign out</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {/* Version footer */}
        <div className="px-3 py-1.5 text-[11px] text-muted-foreground/60 font-sans">
          Zed v1.0
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
