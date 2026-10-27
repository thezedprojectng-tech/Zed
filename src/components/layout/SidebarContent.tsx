"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Compass,
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  User,
  LayoutDashboard,
  Users,
  FileText,
  FileSearch,
  LayoutGrid,
  Pickaxe,
  Briefcase,
  UserPlus,
  Lightbulb,
  Search,
  ShoppingBag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLevelName } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { MODULES } from "@/data/modules";
import {
  SOCIAL_LINKS,
  XIcon,
  InstagramIcon,
  WhatsAppIcon,
  TikTokIcon,
} from "@/data/socials";

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
      { href: "/nav", label: "Zed Nav", icon: Compass },
      { href: "/skill", label: "Zed Skill", icon: Briefcase },
      { href: "/mining", label: "Zed Mining", icon: Pickaxe },
      { href: "/market", label: "Zed Market", icon: ShoppingBag },
      { href: "/internships", label: "Internship Radar", icon: Search },
    ],
  },
  {
    title: "ZED NAV",
    items: [
      { href: "/nav/passport", label: "Nigerian Passport", icon: BookOpen },
      { href: "/nav/nysc", label: "NYSC Mobilisation", icon: GraduationCap },
      { href: "/nav/nysc/call-up", label: "Call-up Parser", icon: FileSearch },
      { href: "/nav/nysc/cds", label: "CDS Logger", icon: FileText },
      { href: "/nav/nin-bvn", label: "NIN & BVN", icon: Fingerprint },
      { href: "/nav/cac", label: "CAC Registration", icon: Building2 },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/referrals", label: "Referrals", icon: UserPlus },
      { href: "/fund", label: "Fund your idea", icon: Lightbulb },
      { href: "/whitepaper", label: "White Paper", icon: FileText },
    ],
  },
  {
    title: "ADMIN",
    adminOnly: true,
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/funding", label: "Funding", icon: Lightbulb },
      { href: "/admin/market", label: "Market Moderation", icon: ShoppingBag },
    ],
  },
];

interface SidebarContentProps {
  /** Called when a nav link is clicked — used by the mobile drawer to close itself. */
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const { user, profile } = useAuthStore();
  const isAdmin = profile?.role === "admin";

  const getInitials = (name?: string | null) => {
    if (!name) return "ZE";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const fullName = profile?.full_name || (user?.user_metadata?.full_name as string | undefined);
  const displayName = profile?.display_name || fullName;
  const avatarPath = profile?.avatar_path;
  const avatarUrl = avatarPath
    ? `/api/avatar/${avatarPath}`
    : profile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined);

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/nav") return pathname === "/nav";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex h-14 items-center px-3 border-b border-border/50 shrink-0">
        <Link
          href="/home"
          className="flex items-center gap-2"
          aria-label="Zed Dashboard"
          onClick={onNavigate}
        >
          <Image
            src="/icons/zed-logo-full-dark.png"
            alt="The Zed Project"
            width={120}
            height={60}
            priority
            className="h-7 w-auto object-contain dark:hidden"
          />
          <Image
            src="/icons/zed-logo-full-light.png"
            alt="The Zed Project"
            width={120}
            height={60}
            priority
            className="h-7 w-auto object-contain hidden dark:block"
          />
          <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
            v1.0
          </span>
        </Link>
      </div>

      {/* Scrollable nav */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto py-4 space-y-6"
      >
        {sections
          .filter((s) => !s.adminOnly || isAdmin)
          .map((section) => (
            <div key={section.title} className="space-y-1">
              <p
                className={cn(
                  "px-2 pb-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5",
                  section.adminOnly
                    ? "text-amber-500/80"
                    : "text-muted-foreground"
                )}
              >
                {section.title}
                {section.adminOnly && (
                  <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-px text-[9px] text-amber-500">
                    ADMIN
                  </span>
                )}
              </p>
              <ul className="space-y-0.5" role="list">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={onNavigate}
                        className={cn(
                          "relative flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all group",
                          active
                            ? "bg-secondary text-foreground font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active
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
          ))}

        {/* Modules section */}
        <div className="space-y-1">
          <p className="px-2 pb-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
            <LayoutGrid className="h-3 w-3" aria-hidden="true" />
            Modules
          </p>
          <ul className="space-y-0.5" role="list">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isLive = mod.status === "live";
              const href = isLive ? (mod.href ?? "/nav") : `/modules/${mod.slug}`;
              const active = pathname.startsWith(href) && isLive;

              if (isLive) {
                return (
                  <li key={mod.slug}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all group",
                        active
                          ? "bg-secondary text-foreground font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate flex-1">{mod.name}</span>
                      <span className="inline-flex items-center gap-1 shrink-0 px-1.5 py-px rounded-full border border-primary/20 bg-primary/10 text-primary font-mono text-[9px] font-semibold uppercase tracking-wider">
                        Live
                      </span>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={mod.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors group"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <span className="truncate flex-1">{mod.name}</span>
                    <span className="inline-flex items-center shrink-0 px-1.5 py-px rounded-full border border-border bg-secondary text-muted-foreground/60 font-mono text-[9px] font-medium uppercase tracking-wider">
                      Soon
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Community links */}
      <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Community
        </span>
        <div className="flex items-center gap-1">
          <a
            href={SOCIAL_LINKS.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={SOCIAL_LINKS.whatsapp.ariaLabel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-[#25D366] hover:bg-secondary transition-colors"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
          </a>
          <a
            href={SOCIAL_LINKS.x.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={SOCIAL_LINKS.x.ariaLabel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <XIcon className="h-3 w-3" />
          </a>
          <a
            href={SOCIAL_LINKS.instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={SOCIAL_LINKS.instagram.ariaLabel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-[#E4405F] hover:bg-secondary transition-colors"
          >
            <InstagramIcon className="h-3.5 w-3.5" />
          </a>
          <a
            href={SOCIAL_LINKS.tiktok.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={SOCIAL_LINKS.tiktok.ariaLabel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <TikTokIcon className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* User card */}
      <div className="border-t border-border/50 p-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 p-2 hover:bg-secondary/70 transition-colors"
        >
          <Avatar className="h-8 w-8 border border-border/50 shrink-0">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-secondary font-mono text-[11px] font-semibold text-foreground">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden text-left">
            <span className="truncate text-xs font-medium text-foreground">
              {displayName || "User"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span className="truncate font-mono text-[10px] text-muted-foreground">
                {getLevelName(profile?.level_id)}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
