"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Briefcase,
  Pickaxe,
  ShoppingBag,
  Search,
  Newspaper,
  User,
  UserPlus,
  Lightbulb,
  FileText,
  Users,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/useAuthStore";
import { getLevelName } from "@/types";
import {
  SOCIAL_LINKS,
  XIcon,
  InstagramIcon,
  WhatsAppIcon,
  TikTokIcon,
} from "@/data/socials";
import { UserMenu } from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/home", label: "Dashboard", icon: Home },
      { href: "/nav", label: "Zed Nav", icon: Compass },
      { href: "/skill", label: "Zed Skill", icon: Briefcase },
      { href: "/mining", label: "Zed Mining", icon: Pickaxe },
      { href: "/market", label: "Zed Market", icon: ShoppingBag },
    ],
  },
  {
    title: "Explore",
    items: [
      { href: "/internships", label: "Internship Radar", icon: Search },
      { href: "/news", label: "News", icon: Newspaper },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/referrals", label: "Referrals", icon: UserPlus },
      { href: "/fund", label: "Fund your idea", icon: Lightbulb },
      { href: "/whitepaper", label: "White paper", icon: FileText },
    ],
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarContent({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { user, profile } = useAuthStore();
  const isAdmin = profile?.role === "admin";

  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase() || "ZE";
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
  const civicLevel = profile?.level_id ?? 1;

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/nav") return pathname === "/nav";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col h-full bg-[var(--sidebar-background)] select-none">
        {/* ── Sticky Brand Header ────────────────────────────────────── */}
        <div
          className={cn(
            "sticky top-0 z-10 flex h-14 items-center border-b border-border/50 bg-[var(--sidebar-background)] shrink-0 px-3",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label="Expand sidebar (Ctrl+B)"
                  className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer group"
                >
                  <Image
                    src="/icons/zed-logo-mark-dark.png"
                    alt="The Zed Project"
                    width={26}
                    height={26}
                    className="h-6 w-auto object-contain dark:hidden group-hover:scale-105 transition-transform"
                    priority
                  />
                  <Image
                    src="/icons/zed-logo-mark-light.png"
                    alt="The Zed Project"
                    width={26}
                    height={26}
                    className="h-6 w-auto object-contain hidden dark:block group-hover:scale-105 transition-transform"
                    priority
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Expand sidebar (Ctrl+B)
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link
                href="/home"
                onClick={onNavigate}
                className="flex items-center gap-2 overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md"
                aria-label="Zed Dashboard"
              >
                <Image
                  src="/icons/zed-logo-full-dark.png"
                  alt="The Zed Project"
                  width={110}
                  height={55}
                  priority
                  className="h-6 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/icons/zed-logo-full-light.png"
                  alt="The Zed Project"
                  width={110}
                  height={55}
                  priority
                  className="h-6 w-auto object-contain hidden dark:block"
                />
              </Link>

              {onToggleCollapse && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      aria-label="Collapse sidebar (Ctrl+B)"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    Collapse (Ctrl+B)
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* ── Scrollable Nav ────────────────────────────────────────── */}
        <nav
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-border/40 hover:scrollbar-thumb-border/70"
        >
          {navSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {!collapsed ? (
                <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                  {section.title}
                </p>
              ) : (
                <div className="h-2 w-full flex items-center justify-center py-1">
                  <span className="w-4 h-px bg-border/50" />
                </div>
              )}

              <ul className="space-y-0.5" role="list">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);

                  if (collapsed) {
                    return (
                      <li key={href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={href}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "relative flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-colors duration-120",
                                active
                                  ? "bg-secondary text-foreground font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
                                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                              )}
                            >
                              <Icon className="h-4 w-4 stroke-[1.5]" />
                              <span className="sr-only">{label}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {label}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 h-10 text-xs font-medium transition-colors duration-120",
                          active
                            ? "bg-secondary text-foreground font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 stroke-[1.5] shrink-0" />
                        <span className="truncate">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* ── Community Popover ───────────────────────────────────── */}
          <div className="pt-2">
            {!collapsed ? (
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                Social
              </p>
            ) : (
              <div className="h-2 w-full flex items-center justify-center py-1">
                <span className="w-4 h-px bg-border/50" />
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {collapsed ? (
                  <button
                    type="button"
                    aria-label="Community channels"
                    className="flex h-10 w-10 items-center justify-center rounded-lg mx-auto text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors duration-120 cursor-pointer"
                  >
                    <Users className="h-4 w-4 stroke-[1.5]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full flex items-center justify-between h-10 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors duration-120 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 stroke-[1.5] text-muted-foreground" />
                      <span>Community</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </button>
                )}
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side={collapsed ? "right" : "top"}
                align={collapsed ? "center" : "start"}
                sideOffset={8}
                className="w-56 rounded-lg border border-border/70 bg-popover p-1.5 shadow-md z-50"
              >
                <div className="px-2.5 py-1 text-xs font-medium text-foreground">
                  Official channels
                </div>
                <DropdownMenuSeparator className="my-1 bg-border/60" />

                <DropdownMenuItem asChild className="h-9 px-2.5 text-xs rounded-md cursor-pointer">
                  <a
                    href={SOCIAL_LINKS.whatsapp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LINKS.whatsapp.ariaLabel}
                    className="flex items-center gap-2.5"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                    <span>WhatsApp channel</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="h-9 px-2.5 text-xs rounded-md cursor-pointer">
                  <a
                    href={SOCIAL_LINKS.x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LINKS.x.ariaLabel}
                    className="flex items-center gap-2.5"
                  >
                    <XIcon className="h-4 w-4" />
                    <span>X (Twitter)</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="h-9 px-2.5 text-xs rounded-md cursor-pointer">
                  <a
                    href={SOCIAL_LINKS.instagram.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LINKS.instagram.ariaLabel}
                    className="flex items-center gap-2.5"
                  >
                    <InstagramIcon className="h-4 w-4 text-[#E4405F]" />
                    <span>Instagram</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="h-9 px-2.5 text-xs rounded-md cursor-pointer">
                  <a
                    href={SOCIAL_LINKS.tiktok.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LINKS.tiktok.ariaLabel}
                    className="flex items-center gap-2.5"
                  >
                    <TikTokIcon className="h-4 w-4" />
                    <span>TikTok</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* ── Admin Console (Only for admins, with divider) ──────────── */}
        {isAdmin && (
          <div className="border-t border-border/50 px-2 py-1.5 shrink-0">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin"
                    onClick={onNavigate}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-colors duration-120",
                      isActive("/admin")
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-amber-600 dark:text-amber-400 hover:bg-secondary/60"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 stroke-[1.5]" />
                    <span className="sr-only">Admin console</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Admin console
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/admin"
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 h-10 text-xs font-medium transition-colors duration-120",
                  isActive("/admin")
                    ? "bg-secondary text-foreground font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
                    : "text-amber-600 dark:text-amber-400 hover:bg-secondary/60"
                )}
              >
                <LayoutDashboard className="h-4 w-4 stroke-[1.5] shrink-0" />
                <span className="truncate">Admin console</span>
              </Link>
            )}
          </div>
        )}

        {/* ── Sticky User Card Footer ───────────────────────────────── */}
        <div className="border-t border-border/50 p-2 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <UserMenu
            side={collapsed ? "right" : "top"}
            align={collapsed ? "end" : "start"}
          >
            <button
              type="button"
              className={cn(
                "w-full flex items-center rounded-lg p-2 text-left transition-colors duration-120 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer",
                collapsed ? "justify-center" : "gap-3"
              )}
              aria-label="User account menu"
            >
              <Avatar className="h-8 w-8 border border-border/60 shrink-0">
                <AvatarImage src={avatarUrl || ""} alt={displayName || "User"} />
                <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>

              {!collapsed && (
                <div className="flex flex-1 flex-col overflow-hidden text-left">
                  <span className="truncate text-xs font-medium text-foreground">
                    {displayName || "User"}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground font-normal">
                    Level {civicLevel} · {getLevelName(civicLevel)}
                  </span>
                </div>
              )}
            </button>
          </UserMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
