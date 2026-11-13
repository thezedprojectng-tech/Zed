import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Award,
  HandHeart,
  UserCheck,
  GraduationCap,
  Building2,
  Briefcase,
  Search,
  ShoppingBag,
  Lightbulb,
  Share2,
  Banknote,
  Coins,
  Sliders,
  Mail,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export type AdminNavBadgeKey =
  | "verifications"
  | "ambassadors"
  | "mentorship"
  | "alumni"
  | "internships"
  | "contact";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badgeKey?: AdminNavBadgeKey;
}

export type AdminNavSectionKey =
  | "overview"
  | "people"
  | "programs"
  | "money"
  | "marketplace"
  | "system";

export interface AdminNavSection {
  key: AdminNavSectionKey;
  label: string;
  accentClass: string;
  accentToken: string;
  barColor: string;
  dotColor: string;
  items: AdminNavItem[];
}

export interface AdminBadgeCounts {
  unreadContactCount?: number;
  pendingInternshipsCount?: number;
  newAmbassadorsCount?: number;
  newMentorshipCount?: number;
  newAlumniCount?: number;
  pendingVerificationsCount?: number;
}

export function getBadgeCount(
  key: AdminNavBadgeKey | undefined,
  counts: AdminBadgeCounts
): number {
  if (!key) return 0;
  switch (key) {
    case "contact":
      return counts.unreadContactCount ?? 0;
    case "internships":
      return counts.pendingInternshipsCount ?? 0;
    case "ambassadors":
      return counts.newAmbassadorsCount ?? 0;
    case "mentorship":
      return counts.newMentorshipCount ?? 0;
    case "alumni":
      return counts.newAlumniCount ?? 0;
    case "verifications":
      return counts.pendingVerificationsCount ?? 0;
    default:
      return 0;
  }
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    key: "overview",
    label: "Overview",
    accentClass: "text-data-users",
    accentToken: "var(--data-users)",
    barColor: "bg-data-users",
    dotColor: "bg-data-users",
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    key: "people",
    label: "People",
    accentClass: "text-data-users",
    accentToken: "var(--data-users)",
    barColor: "bg-data-users",
    dotColor: "bg-data-users",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
      },
      {
        href: "/admin/verifications",
        label: "Verifications",
        icon: ShieldCheck,
        badgeKey: "verifications",
      },
      {
        href: "/admin/contact",
        label: "Contact inbox",
        icon: Mail,
        badgeKey: "contact",
      },
    ],
  },
  {
    key: "programs",
    label: "Programs",
    accentClass: "text-data-signups",
    accentToken: "var(--data-signups)",
    barColor: "bg-data-signups",
    dotColor: "bg-data-signups",
    items: [
      {
        href: "/admin/ambassadors",
        label: "Ambassadors",
        icon: Award,
        badgeKey: "ambassadors",
      },
      {
        href: "/admin/mentorship",
        label: "Mentorship",
        icon: HandHeart,
        badgeKey: "mentorship",
      },
      {
        href: "/admin/alumni-office-hours",
        label: "Alumni office hours",
        icon: UserCheck,
        badgeKey: "alumni",
      },
      {
        href: "/admin/internships",
        label: "Internships",
        icon: Search,
        badgeKey: "internships",
      },
      {
        href: "/admin/campus-hubs",
        label: "Campus hubs",
        icon: Building2,
      },
      {
        href: "/admin/careers",
        label: "Careers",
        icon: Briefcase,
      },
      {
        href: "/admin/skill",
        label: "Skill content",
        icon: GraduationCap,
      },
    ],
  },
  {
    key: "money",
    label: "Money",
    accentClass: "text-data-mining",
    accentToken: "var(--data-mining)",
    barColor: "bg-data-mining",
    dotColor: "bg-data-mining",
    items: [
      {
        href: "/admin/funding",
        label: "Funding",
        icon: Lightbulb,
      },
      {
        href: "/admin/referrals",
        label: "Referrals",
        icon: Share2,
      },
      {
        href: "/admin/withdrawals",
        label: "Withdrawals",
        icon: Banknote,
      },
      {
        href: "/admin/settings/zed",
        label: "ZED token",
        icon: Coins,
      },
      {
        href: "/admin/settings/levels",
        label: "Level rules",
        icon: Sliders,
      },
    ],
  },
  {
    key: "marketplace",
    label: "Marketplace",
    accentClass: "text-data-flows",
    accentToken: "var(--data-flows)",
    barColor: "bg-data-flows",
    dotColor: "bg-data-flows",
    items: [
      {
        href: "/admin/market",
        label: "Market",
        icon: ShoppingBag,
      },
    ],
  },
  {
    key: "system",
    label: "System",
    accentClass: "text-muted-foreground",
    accentToken: "var(--muted-foreground)",
    barColor: "bg-muted-foreground",
    dotColor: "bg-muted-foreground",
    items: [
      {
        href: "/admin/audit-log",
        label: "Audit log",
        icon: ScrollText,
      },
    ],
  },
];
