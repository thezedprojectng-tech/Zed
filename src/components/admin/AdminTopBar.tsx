"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Laptop,
  ArrowLeft,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useIsMounted } from "@/lib/hooks";
import { useAdminSidebar } from "./AdminSidebarContext";
import { WelcomeGreeting } from "./WelcomeGreeting";
import {
  AdminMenuContent,
  AdminMenuItem,
} from "./AdminDropdownMenu";
import { AdminNotificationBell } from "./comms/AdminNotificationBell";

interface AdminTopBarProps {
  adminUser: {
    id: string;
    fullName: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function AdminTopBar({ adminUser }: AdminTopBarProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const { isCollapsed, toggleCollapse, toggleMobile } = useAdminSidebar();

  const getInitials = (name?: string | null) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background px-3 sm:px-6 select-none">
      {/* Left: Sidebar toggle (mobile menu / desktop collapse) + Rotating Welcome Greeting */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger (< 768px) */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMobile}
          className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        </Button>

        {/* Desktop collapse trigger (>= 768px) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleCollapse}
              className="hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span className="font-sans text-xs">
              {isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            </span>
          </TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-border/60 hidden sm:block" />

        {/* Rotating Greeting */}
        <WelcomeGreeting />
      </div>

      {/* Right: "Back to app", Theme toggle, Admin user chip */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        {/* "Back to app" as a ghost button */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 gap-1.5 shrink-0"
        >
          <Link href="/home">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Back to app</span>
          </Link>
        </Button>

        {/* Admin Notification Bell */}
        {mounted && <AdminNotificationBell />}

        {/* Theme toggle dropdown */}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/60 shrink-0"
                aria-label="Toggle theme"
              >
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" strokeWidth={1.75} />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" strokeWidth={1.75} />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <AdminMenuContent
              align="end"
              side="bottom"
              sideOffset={8}
              className="w-44 min-w-[160px]"
            >
              <AdminMenuItem
                onClick={() => setTheme("light")}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" strokeWidth={1.75} />
                  <span>Light</span>
                </div>
                {theme === "light" && (
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                )}
              </AdminMenuItem>
              <AdminMenuItem
                onClick={() => setTheme("dark")}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" strokeWidth={1.75} />
                  <span>Dark</span>
                </div>
                {theme === "dark" && (
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                )}
              </AdminMenuItem>
              <AdminMenuItem
                onClick={() => setTheme("system")}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" strokeWidth={1.75} />
                  <span>System</span>
                </div>
                {theme === "system" && (
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                )}
              </AdminMenuItem>
            </AdminMenuContent>
          </DropdownMenu>
        )}

        <div className="h-4 w-px bg-border/60 shrink-0" />

        {/* Admin Avatar + Tooltip Email (email hidden under 768px, font-sans not monospace) */}
        <div className="flex items-center gap-2.5 pl-0.5 min-w-0">
          <Avatar className="h-7 w-7 border border-border shrink-0">
            <AvatarImage src={adminUser.avatarUrl || ""} alt={adminUser.fullName} />
            <AvatarFallback className="bg-secondary text-foreground text-[10px] font-bold">
              {getInitials(adminUser.fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="hidden md:flex flex-col text-left leading-tight min-w-0">
            <span className="text-xs font-semibold text-foreground truncate max-w-[160px] lg:max-w-[200px] font-sans">
              {adminUser.fullName}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[11px] text-muted-foreground truncate min-w-0 max-w-[160px] lg:max-w-[200px] font-sans cursor-default">
                  {adminUser.email || "admin@zed.gov.ng"}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="text-xs font-sans">
                {adminUser.email || "admin@zed.gov.ng"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
}
