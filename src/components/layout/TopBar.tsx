"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Sun, Moon, WifiOff, PanelLeft } from "lucide-react";
import { useIsMounted, useIsOnline } from "@/lib/hooks";
import { MobileDrawerTrigger } from "./MobileDrawer";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { useAppSidebar } from "./AppSidebarContext";

interface TopBarProps {
  onOpenCommand: () => void;
  drawerOpen: boolean;
  onDrawerOpen: () => void;
  onDrawerClose: () => void;
}

const routeLabels: Record<string, string> = {
  home: "Dashboard",
  nav: "Zed Nav",
  passport: "Nigerian Passport",
  nysc: "NYSC Mobilisation",
  cds: "Community Development",
  ppa: "Place of Primary Assignment",
  "nin-bvn": "NIN & BVN",
  cac: "CAC Registration",
  profile: "Profile",
  verify: "Bank Verification",
  admin: "Admin",
  users: "Users",
  skill: "Zed Skill",
  mining: "Zed Mining",
  market: "Zed Market",
  internships: "Internship Radar",
  news: "News",
  referrals: "Referrals",
  fund: "Fund your idea",
  whitepaper: "White paper",
  "campus-hubs": "Campus Hubs",
  "alumni-office-hours": "Alumni Office Hours",
  mentorship: "Mentorship",
  notifications: "Notifications",
  mine: "My listings",
  new: "New listing",
  edit: "Edit",
  submit: "Submit lead",
  apply: "Apply",
  withdraw: "Withdraw",
};

const UUID_OR_HASH_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getHumanBreadcrumbLabel(seg: string, idx: number, segments: string[]): string {
  if (routeLabels[seg]) return routeLabels[seg];

  const prevSeg = idx > 0 ? segments[idx - 1] : "";
  const isId = UUID_OR_HASH_REGEX.test(seg) || /^\d+$/.test(seg) || (seg.length >= 24 && !seg.includes("-") && !seg.includes(" "));

  if (prevSeg === "market") return "Listing";
  if (prevSeg === "internships") return "Opportunity";
  if (prevSeg === "campus-hubs") return "Campus guide";
  if (prevSeg === "alumni-office-hours") return "Alumni profile";
  if (prevSeg === "news") return "Article";
  if (prevSeg === "skill") return "Track";
  if (prevSeg === "nav") return "Guide";

  if (isId) return "Details";

  const humanized = seg.replace(/-/g, " ");
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

export function TopBar({
  onOpenCommand,
  drawerOpen,
  onDrawerOpen,
  onDrawerClose,
}: TopBarProps) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isOnline = useIsOnline();
  const mounted = useIsMounted();
  const { isCollapsed, toggleCollapse } = useAppSidebar();

  const currentTheme = resolvedTheme || theme || "dark";
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/50 bg-background/90 px-3 md:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger (mobile) / sidebar toggle (desktop) + breadcrumbs / mobile logo */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <MobileDrawerTrigger
          open={drawerOpen}
          onOpen={onDrawerOpen}
          onClose={onDrawerClose}
        />

        {/* Desktop sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapse}
          className="hidden md:flex text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          <PanelLeft className="h-4 w-4 stroke-[1.5]" />
        </Button>

        {/* Desktop breadcrumbs */}
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
              const label = getHumanBreadcrumbLabel(seg, idx, segments);

              return (
                <span key={href} className="inline-flex items-center gap-1.5">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium text-foreground">
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href} className="hover:text-foreground">
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

        {/* Mobile logo — visible only on xs */}
        <Link
          href="/home"
          className="sm:hidden flex items-center ml-0.5 shrink-0"
          aria-label="Zed Home"
        >
          <Image
            src="/icons/zed-logo-full-dark.png"
            alt="Zed"
            width={80}
            height={40}
            className="h-5 w-auto object-contain dark:hidden"
          />
          <Image
            src="/icons/zed-logo-full-light.png"
            alt="Zed"
            width={80}
            height={40}
            className="h-5 w-auto object-contain hidden dark:block"
          />
        </Link>
      </div>

      {/* Right: Tools & Actions (guaranteed no overflow at 390px) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {!isOnline && (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 font-sans"
          >
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Offline</span>
          </Badge>
        )}

        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Search guides"
          className="flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-card/60 px-2 sm:px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 stroke-[1.5]" />
          <span className="hidden sm:inline">Search guides…</span>
          <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-border bg-secondary/80 px-1 font-sans text-[10px] text-muted-foreground">
            Ctrl + K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
            className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
            aria-label="Toggle theme"
          >
            {currentTheme === "light" ? (
              <Moon className="h-4 w-4 text-foreground stroke-[1.5]" />
            ) : (
              <Sun className="h-4 w-4 text-foreground stroke-[1.5]" />
            )}
          </Button>
        )}

        {/* User avatar dropdown (same component as sidebar user menu) */}
        <UserMenu align="end" side="bottom" />
      </div>
    </header>
  );
}
