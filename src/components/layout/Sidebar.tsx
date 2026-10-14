"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Compass,
  MapPin,
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Users,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/useAuthStore";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const sections: NavSection[] = [
  {
    title: "PLATFORM",
    items: [
      { href: "/home", label: "Dashboard", icon: Home },
      { href: "/nav", label: "Civil Guides", icon: Compass },
      { href: "/nav/passport/centers", label: "Centers Tracker", icon: MapPin },
    ],
  },
  {
    title: "GUIDES",
    items: [
      { href: "/nav/passport", label: "Nigerian Passport", icon: BookOpen },
      { href: "/nav/nysc", label: "NYSC Mobilisation", icon: GraduationCap },
      { href: "/nav/nin-bvn", label: "NIN & BVN", icon: Fingerprint },
      { href: "/nav/cac", label: "CAC Registration", icon: Building2 },
    ],
  },
  {
    title: "ACCOUNT",
    items: [{ href: "/profile", label: "Civil Profile", icon: User }],
  },
  {
    title: "ADMIN",
    adminOnly: true,
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/reports", label: "Reports", icon: FileText },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, profile } = useAuthStore();
  const isAdmin = profile?.role === "admin";

  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "hidden md:flex flex-col border-hairline-r bg-[var(--sidebar-background)] transition-all duration-200 select-none shrink-0 sticky top-0 h-dvh z-30",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-hairline-b px-4">
        {!collapsed && (
          <Link href="/home" className="flex items-center gap-2">
            <span className="font-display text-xl font-black tracking-tight text-foreground">
              Zed
            </span>
            <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
              CIVIL v1.0
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border-hairline text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav Section Lists */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections
          .filter((s) => !s.adminOnly || isAdmin)
          .map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <p className={cn(
                  "px-2 pb-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5",
                  section.adminOnly
                    ? "text-amber-500/80"
                    : "text-muted-foreground"
                )}>
                  {section.title}
                  {section.adminOnly && (
                    <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-px text-[9px] text-amber-500">
                      ADMIN
                    </span>
                  )}
                </p>
              )}

              <ul className="space-y-0.5" role="list">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    href === "/home"
                      ? pathname === "/home"
                      : href === "/nav"
                      ? pathname === "/nav"
                      : href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(href);

                  const itemContent = (
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all group",
                        isActive
                          ? "bg-secondary text-foreground font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                        collapsed && "justify-center px-0 py-2.5"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );

                  return (
                    <li key={href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
                          <TooltipContent side="right" className="font-sans text-xs">
                            {label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        itemContent
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
      </nav>

      {/* Bottom User Card */}
      <div className="border-hairline-t p-3">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg border-hairline bg-card/40 p-2 hover:bg-secondary/70 transition-colors",
            collapsed && "justify-center p-2 border-0 bg-transparent"
          )}
        >
          <Avatar className="h-8 w-8 border-hairline shrink-0">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-secondary font-mono text-[11px] font-semibold text-foreground">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden text-left">
              <span className="truncate text-xs font-medium text-foreground">
                {fullName || "Citizen"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  Lvl 1 Citizen
                </span>
              </div>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
