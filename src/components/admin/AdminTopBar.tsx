"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  ArrowLeft,
  Menu,
  LayoutDashboard,
  Users,
  ScrollText,
  Share2,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMounted } from "@/lib/hooks";

interface AdminTopBarProps {
  adminUser: {
    id: string;
    fullName: string;
    email?: string;
    avatarUrl?: string;
  };
}

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/skill", label: "Skill content", icon: GraduationCap },
  { href: "/admin/funding", label: "Funding", icon: Share2 },
  { href: "/admin/referrals", label: "Referrals", icon: Share2 },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function AdminTopBar({ adminUser }: AdminTopBarProps) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentTheme = resolvedTheme || theme || "dark";

  const getInitials = (name?: string | null) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const getSectionTitle = () => {
    if (pathname === "/admin") return "Overview";
    if (pathname.startsWith("/admin/users")) return "Users Directory";
    if (pathname.startsWith("/admin/skill")) return "Skill Content";
    if (pathname.startsWith("/admin/funding")) return "Funding Submissions";
    if (pathname.startsWith("/admin/referrals")) return "Referrals Management";
    if (pathname.startsWith("/admin/withdrawals")) return "Withdrawals Queue";
    if (pathname.startsWith("/admin/settings/zed")) return "ZED Token Settings";
    if (pathname.startsWith("/admin/audit-log")) return "Audit Log";
    return "Console";
  };

  return (
    <header className="sticky top-0 z-20 flex h-13 w-full items-center justify-between border-b border-border bg-background/90 px-3 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Menu + Title + Admin badge */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden text-muted-foreground hover:text-foreground"
              aria-label="Open admin menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card border-border">
            <SheetHeader className="p-4 border-b border-border text-left">
              <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                Zed Admin Console
              </SheetTitle>
            </SheetHeader>
            <div className="py-4 px-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-border mt-4">
                <Link
                  href="/home"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to citizen app</span>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-tight text-foreground font-mono uppercase">
            {getSectionTitle()}
          </span>
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-mono uppercase font-bold py-0 px-1.5"
          >
            ADMIN
          </Badge>
        </div>
      </div>

      {/* Right Tools & Admin Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* "Back to app" shortcut */}
        <Link
          href="/home"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border hover:bg-secondary/60"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to app</span>
        </Link>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
            aria-label="Toggle theme"
          >
            {currentTheme === "light" ? (
              <Moon className="h-3.5 w-3.5 text-foreground" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-foreground" />
            )}
          </Button>
        )}

        {/* Admin User Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Avatar className="h-7 w-7 border border-border">
            <AvatarImage src={adminUser.avatarUrl || ""} />
            <AvatarFallback className="bg-secondary font-mono text-[10px] font-bold text-foreground">
              {getInitials(adminUser.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[120px]">
              {adminUser.fullName}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono leading-none">
              {adminUser.email || "admin@zed.gov.ng"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
