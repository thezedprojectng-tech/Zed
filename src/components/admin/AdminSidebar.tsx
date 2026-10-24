"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  ScrollText,
  ArrowLeft,
  Banknote,
  Coins,
  Share2,
  Lightbulb,
  GraduationCap,
  ShoppingBag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminSidebarProps {
  adminUser: {
    id: string;
    fullName: string;
    email?: string;
    avatarUrl?: string;
  };
}

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/skill", label: "Skill content", icon: GraduationCap, exact: false },
  { href: "/admin/funding", label: "Funding", icon: Lightbulb, exact: false },
  { href: "/admin/referrals", label: "Referrals", icon: Share2, exact: false },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Banknote, exact: false },
  { href: "/admin/settings/zed", label: "ZED Token", icon: Coins, exact: false },
  { href: "/admin/market", label: "Market Moderation", icon: ShoppingBag, exact: false },
  { href: "/admin/reports", label: "Reports", icon: FileText, exact: false },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText, exact: false },
];

export function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname();

  const getInitials = (name?: string | null) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <aside
      aria-label="Admin console navigation"
      className="hidden md:flex flex-col w-[230px] shrink-0 border-r border-border bg-card/60 backdrop-blur-md sticky top-0 h-dvh select-none z-30"
    >
      {/* Brand Header */}
      <div className="flex h-13 items-center justify-between border-b border-border px-4">
        <Link href="/admin" className="flex items-center gap-2" aria-label="Zed Admin Console">
          <Image
            src="/icons/zed-logo-full-dark.png"
            alt="The Zed Project"
            width={100}
            height={50}
            className="h-6 w-auto object-contain dark:hidden"
          />
          <Image
            src="/icons/zed-logo-full-light.png"
            alt="The Zed Project"
            width={100}
            height={50}
            className="h-6 w-auto object-contain hidden dark:block"
          />
          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-500 tracking-wider">
            CONSOLE
          </span>
        </Link>

        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System operational" />
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        <div className="space-y-1">
          <p className="px-2 pb-1.5 font-mono text-[9px] font-semibold tracking-wider uppercase text-muted-foreground">
            MANAGEMENT
          </p>

          <ul className="space-y-0.5" role="list">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(href + "/");

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors group",
                      isActive
                        ? "bg-secondary text-foreground font-semibold shadow-xs border border-border"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Shortcut back to platform */}
        <div className="space-y-1 pt-2">
          <p className="px-2 pb-1.5 font-mono text-[9px] font-semibold tracking-wider uppercase text-muted-foreground">
            NAVIGATION
          </p>
          <Link
            href="/home"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to user app</span>
          </Link>
        </div>
      </nav>

      {/* Admin User Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/30 p-2">
          <Avatar className="h-7 w-7 border border-border shrink-0">
            <AvatarImage src={adminUser.avatarUrl || ""} />
            <AvatarFallback className="bg-secondary font-mono text-[10px] font-bold text-foreground">
              {getInitials(adminUser.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden text-left">
            <span className="truncate text-xs font-semibold text-foreground">
              {adminUser.fullName}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="font-mono text-[9px] text-amber-500 uppercase font-semibold">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
