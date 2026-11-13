"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Sun,
  Moon,
  Laptop,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { signOut } from "@/lib/auth/actions";
import {
  ADMIN_NAV_SECTIONS,
  getBadgeCount,
  type AdminBadgeCounts,
  type AdminNavItem,
  type AdminNavSection,
} from "./navConfig";
import { useAdminSidebar } from "./AdminSidebarContext";
import {
  AdminMenuContent,
  AdminMenuItem,
  AdminMenuSeparator,
  AdminMenuLabel,
} from "./AdminDropdownMenu";

interface AdminSidebarProps extends AdminBadgeCounts {
  adminUser: {
    id: string;
    fullName: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function AdminSidebar({
  adminUser,
  unreadContactCount = 0,
  pendingInternshipsCount = 0,
  newAmbassadorsCount = 0,
  newMentorshipCount = 0,
  newAlumniCount = 0,
  pendingVerificationsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useAdminSidebar();

  const badgeCounts: AdminBadgeCounts = React.useMemo(
    () => ({
      unreadContactCount,
      pendingInternshipsCount,
      newAmbassadorsCount,
      newMentorshipCount,
      newAlumniCount,
      pendingVerificationsCount,
    }),
    [
      unreadContactCount,
      pendingInternshipsCount,
      newAmbassadorsCount,
      newMentorshipCount,
      newAlumniCount,
      pendingVerificationsCount,
    ]
  );

  const getInitials = (name?: string | null) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const firstName = adminUser.fullName.trim().split(" ")[0] || "Admin";

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      window.location.href = "/login";
    }
  };

  // Active item style per section
  const getActiveStyles = (key: AdminNavSection["key"]) => {
    switch (key) {
      case "people":
        return "bg-data-users-subtle text-data-users-ink font-semibold";
      case "programs":
        return "bg-data-signups-subtle text-data-signups-ink font-semibold";
      case "money":
        return "bg-data-mining-subtle text-data-mining-ink font-semibold";
      case "marketplace":
        return "bg-data-flows-subtle text-data-flows-ink font-semibold";
      case "overview":
        return "bg-data-users-subtle text-data-users-ink font-semibold";
      case "system":
        return "bg-muted text-foreground font-semibold";
      default:
        return "bg-secondary text-foreground font-semibold";
    }
  };

  // Nav row renderer
  const renderNavItem = (
    item: AdminNavItem,
    section: AdminNavSection,
    collapsed: boolean
  ) => {
    const { href, label, icon: Icon, exact, badgeKey } = item;
    const isActive = exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

    const badgeCount = getBadgeCount(badgeKey, badgeCounts);
    const showBadge = badgeCount > 0;
    const formattedBadge = badgeCount > 99 ? "99+" : String(badgeCount);

    if (collapsed) {
      return (
        <li key={href}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg mx-auto transition-colors duration-120 group",
                  isActive
                    ? getActiveStyles(section.key)
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {/* 2-3px accent bar on left */}
                {isActive && (
                  <span
                    className={cn(
                      "absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r-full",
                      section.barColor
                    )}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {showBadge && (
                  <span
                    className="absolute top-1 right-1 h-2 w-2 rounded-full border-2 border-card"
                    style={{ backgroundColor: section.accentToken }}
                  />
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2 font-sans text-xs">
              <span>{label}</span>
              {showBadge && (
                <span className="font-mono text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-secondary text-foreground border border-border">
                  {formattedBadge}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </li>
      );
    }

    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-medium transition-colors duration-120 group font-sans select-none",
            isActive
              ? getActiveStyles(section.key)
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          {/* 2-3px accent bar on left */}
          {isActive && (
            <span
              className={cn(
                "absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r-full",
                section.barColor
              )}
            />
          )}

          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors duration-120",
              isActive ? "text-current" : "text-muted-foreground group-hover:text-foreground"
            )}
            strokeWidth={1.75}
          />

          <span className="truncate flex-1 font-sans">{label}</span>

          {showBadge && (
            <span className="inline-flex items-center justify-center min-w-5 h-4 px-1.5 rounded-full text-[10px] font-mono tabular-nums bg-secondary border border-border text-foreground font-medium select-none">
              {formattedBadge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  // Nav list inside scrolling container
  const renderNavSections = (collapsed: boolean) => (
    <div className="space-y-5">
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.key} className="space-y-1">
          {/* Quiet sentence-case section label */}
          {!collapsed && (
            <p className="px-3 pb-1 text-[11px] font-medium text-muted-foreground/80 font-sans tracking-normal select-none">
              {section.label}
            </p>
          )}

          {collapsed && (
            <div className="h-2 w-full flex items-center justify-center py-1">
              <span className="w-4 h-px bg-border/60" />
            </div>
          )}

          <ul className="space-y-0.5" role="list">
            {section.items.map((item) => renderNavItem(item, section, collapsed))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR (>= 768px) ─────────────────────────────────── */}
      <aside
        aria-label="Admin console navigation"
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-border bg-card sticky top-0 h-dvh select-none z-30",
          "transition-[width] duration-200 ease-out",
          isCollapsed ? "w-16" : "w-[240px]"
        )}
      >
        {/* Sticky Brand Header */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-border bg-card shrink-0 px-4",
            isCollapsed ? "justify-center px-2" : "justify-between"
          )}
        >
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/admin" aria-label="The Zed Project Admin">
                  <Image
                    src="/icons/zed-logo-mark-dark.png"
                    alt="Zed Logo"
                    width={22}
                    height={22}
                    className="h-5 w-auto object-contain dark:hidden"
                  />
                  <Image
                    src="/icons/zed-logo-mark-light.png"
                    alt="Zed Logo"
                    width={22}
                    height={22}
                    className="h-5 w-auto object-contain hidden dark:block"
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-sans text-xs">
                The Zed Project Admin
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 overflow-hidden"
              aria-label="The Zed Project Admin"
            >
              <Image
                src="/icons/zed-logo-full-dark.png"
                alt="The Zed Project"
                width={85}
                height={26}
                className="h-5 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/icons/zed-logo-full-light.png"
                alt="The Zed Project"
                width={85}
                height={26}
                className="h-5 w-auto object-contain hidden dark:block"
                priority
              />
              <span className="text-xs font-normal text-muted-foreground font-sans">
                Admin
              </span>
            </Link>
          )}
        </div>

        {/* Scrollable Navigation Area (thin scrollbar on hover, top/bottom overflow fade) */}
        <div className="relative flex-1 overflow-hidden">
          {/* Subtle top fade */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-card to-transparent z-10 opacity-70" />

          <nav className="h-full overflow-y-auto px-2 py-3 admin-scrollbar">
            {renderNavSections(isCollapsed)}
          </nav>

          {/* Subtle bottom fade */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-card to-transparent z-10 opacity-70" />
        </div>

        {/* Sticky User Card Footer */}
        <div className="border-t border-border bg-card p-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full flex items-center rounded-lg p-2 text-left transition-colors duration-120",
                  "hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isCollapsed ? "justify-center" : "justify-between gap-2.5"
                )}
                aria-label={`User menu for ${adminUser.fullName}`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    <AvatarImage src={adminUser.avatarUrl || ""} alt={adminUser.fullName} />
                    <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                      {getInitials(adminUser.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  {!isCollapsed && (
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="truncate text-xs font-semibold text-foreground font-sans">
                        {firstName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-normal font-sans">
                        Super admin
                      </span>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </button>
            </DropdownMenuTrigger>

            <AdminMenuContent
              side={isCollapsed ? "right" : "top"}
              align={isCollapsed ? "end" : "start"}
              sideOffset={8}
              className="w-[240px] max-w-[calc(100vw-2rem)]"
            >
              {/* Header block (name + email) */}
              <div className="px-3 py-2 flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground truncate font-sans">
                  {adminUser.fullName}
                </span>
                <span className="text-xs text-muted-foreground truncate font-sans">
                  {adminUser.email || "admin@zed.gov.ng"}
                </span>
              </div>

              <AdminMenuSeparator />

              {/* Back to app */}
              <AdminMenuItem asChild>
                <Link href="/home">
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                  <span>Back to app</span>
                </Link>
              </AdminMenuItem>

              <AdminMenuSeparator />

              {/* Theme Segmented Control */}
              <AdminMenuLabel>
                Theme
              </AdminMenuLabel>

              <div className="grid grid-cols-3 gap-1 px-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "h-8.5 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-sans font-medium transition-colors duration-120",
                    theme === "light"
                      ? "bg-secondary text-foreground border border-border shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                  )}
                >
                  <Sun className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "h-8.5 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-sans font-medium transition-colors duration-120",
                    theme === "dark"
                      ? "bg-secondary text-foreground border border-border shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                  )}
                >
                  <Moon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "h-8.5 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-sans font-medium transition-colors duration-120",
                    theme === "system"
                      ? "bg-secondary text-foreground border border-border shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                  )}
                >
                  <Laptop className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>System</span>
                </button>
              </div>

              <AdminMenuSeparator />

              {/* Sign out */}
              <AdminMenuItem
                isDestructive
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                <span>Sign out</span>
              </AdminMenuItem>
            </AdminMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MOBILE SLIDE-IN SHEET (< 768px) ────────────────────────────── */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-[270px] p-0 bg-card border-border flex flex-col">
          <SheetHeader className="p-4 border-b border-border text-left">
            <SheetTitle asChild>
              <Link
                href="/admin"
                className="flex items-center gap-2.5"
                onClick={() => setIsMobileOpen(false)}
              >
                <Image
                  src="/icons/zed-logo-full-dark.png"
                  alt="The Zed Project"
                  width={90}
                  height={26}
                  className="h-5 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/icons/zed-logo-full-light.png"
                  alt="The Zed Project"
                  width={90}
                  height={26}
                  className="h-5 w-auto object-contain hidden dark:block"
                />
                <span className="text-xs font-normal text-muted-foreground font-sans">
                  Admin
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation Area */}
          <nav className="flex-1 overflow-y-auto px-2 py-4 admin-scrollbar">
            {renderNavSections(false)}
          </nav>

          {/* Mobile Footer */}
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/40 border border-border/60">
              <Avatar className="h-8 w-8 border border-border shrink-0">
                <AvatarImage src={adminUser.avatarUrl || ""} alt={adminUser.fullName} />
                <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                  {getInitials(adminUser.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-semibold text-foreground truncate font-sans">
                  {adminUser.fullName}
                </span>
                <span className="text-[11px] text-muted-foreground font-normal font-sans">
                  Super admin
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium text-destructive dark:text-rose-400 hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Sign out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
