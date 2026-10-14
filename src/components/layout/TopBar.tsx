"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  Sun,
  Moon,
  WifiOff,
  User,
  ShieldCheck,
  LogOut,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { signOut } from "@/lib/auth/actions";
import { getLevelName } from "@/types";

interface TopBarProps {
  onOpenCommand: () => void;
}

const routeLabels: Record<string, string> = {
  home: "Dashboard",
  nav: "Zed Nav",
  passport: "Nigerian Passport",
  centers: "Passport Centers",
  nysc: "NYSC Mobilisation",
  cds: "Community Development",
  ppa: "Place of Primary Assignment",
  "nin-bvn": "NIN & BVN",
  cac: "CAC Registration",
  profile: "Profile",
  "verify-nin": "NIN Verification",
  admin: "Admin",
  users: "Users",
  reports: "Reports",
};

export function TopBar({ onOpenCommand }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, clearUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  const handleSignOut = async () => {
    clearUser();
    await signOut();
    router.push("/login");
  };

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const currentTheme = resolvedTheme || theme || "dark";

  // Compute breadcrumbs from pathname segments
  const segments = pathname.split("/").filter(Boolean);

  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Read profile metadata from profile or Supabase User object
  const fullName = profile?.full_name || (user?.user_metadata?.full_name as string | undefined);
  const avatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined);
  const email = user?.email;
  const civicLevel = profile?.level_id || 1;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-hairline-b bg-background/80 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Dynamic Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/home" className="hover:text-foreground">
                  Zed
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.map((seg, idx) => {
              const isLast = idx === segments.length - 1;
              const href = `/${segments.slice(0, idx + 1).join("/")}`;
              const label = routeLabels[seg] || seg.replace(/-/g, " ");

              return (
                <span key={href} className="inline-flex items-center gap-1.5">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium capitalize text-foreground">
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href} className="capitalize hover:text-foreground">
                          {label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Mobile Title */}
        <Link href="/home" className="sm:hidden flex items-center" aria-label="Zed Home">
          <Image
            src="/icons/zed-logo-full-dark.png"
            alt="Zed"
            width={90}
            height={45}
            className="h-6 w-auto object-contain dark:hidden"
          />
          <Image
            src="/icons/zed-logo-full-light.png"
            alt="Zed"
            width={90}
            height={45}
            className="h-6 w-auto object-contain hidden dark:block"
          />
        </Link>
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline Badge */}
        {!isOnline && (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500 text-[11px] font-mono px-2 py-0.5"
          >
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Offline Mode</span>
          </Badge>
        )}

        {/* Search Command Trigger */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex h-8 items-center gap-2 rounded-md border-hairline bg-card/60 px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search guides...</span>
          <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-border bg-secondary/80 px-1 font-mono text-[10px] text-muted-foreground">
            ctrl + K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative text-muted-foreground hover:text-foreground"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 border-hairline bg-popover p-0 shadow-lg"
          >
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-xs font-semibold tracking-tight text-foreground">
                Zed Nav Updates
              </p>
              <p className="text-[11px] text-muted-foreground">
                Verified procedural alerts and updates
              </p>
            </div>
            <div className="divide-y divide-border/50 text-xs">
              <div className="p-3 hover:bg-secondary/40 transition-colors">
                <p className="font-medium text-foreground">
                  NIS e-Passport Fast-Track Capture
                </p>
                <p className="mt-0.5 text-muted-foreground text-[11px]">
                  Ikoyi and Alausa passport processing offices report lowest queue times before 10:30 AM.
                </p>
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground/80">
                  Today · 08:30 AM
                </span>
              </div>
              <div className="p-3 hover:bg-secondary/40 transition-colors">
                <p className="font-medium text-foreground">
                  NYSC 2026 Batch A Mobilisation
                </p>
                <p className="mt-0.5 text-muted-foreground text-[11px]">
                  Senate list verification active on portal. Verify your graduation status before camp call-up.
                </p>
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground/80">
                  Yesterday · 04:15 PM
                </span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {currentTheme === "light" ? (
              <Moon className="h-4 w-4 text-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-foreground" />
            )}
          </Button>
        )}

        {/* User Profile Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7 border-hairline">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="bg-secondary font-mono text-[11px] font-semibold text-foreground">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-hairline bg-popover shadow-lg"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none text-foreground">
                  {fullName || "User"}
                </p>
                <p className="text-[11px] leading-none text-muted-foreground font-mono">
                  {email || ""}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary text-[10px] py-0 px-1.5 font-mono"
                  >
                    {getLevelName(civicLevel)}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile & Credentials</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/verify-nin" className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>NIN Verification</span>
              </Link>
            </DropdownMenuItem>
            {profile?.role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer text-amber-500 focus:text-amber-500">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
