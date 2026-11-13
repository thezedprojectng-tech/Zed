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
  | "content"
  | "money"
  | "inbox"
  | "system";

export interface AdminNavSection {
  key: AdminNavSectionKey;
  label: string;
  accentClass: string;
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
    accentClass: "text-primary",
    dotColor: "bg-primary",
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
    accentClass: "text-admin-accent-people",
    dotColor: "bg-admin-accent-people",
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
        label: "Alumni Office Hours",
        icon: UserCheck,
        badgeKey: "alumni",
      },
    ],
  },
  {
    key: "content",
    label: "Content",
    accentClass: "text-admin-accent-content",
    dotColor: "bg-admin-accent-content",
    items: [
      {
        href: "/admin/skill",
        label: "Skill content",
        icon: GraduationCap,
      },
      {
        href: "/admin/campus-hubs",
        label: "Campus Hubs",
        icon: Building2,
      },
      {
        href: "/admin/careers",
        label: "Careers",
        icon: Briefcase,
      },
      {
        href: "/admin/internships",
        label: "Internships",
        icon: Search,
        badgeKey: "internships",
      },
      {
        href: "/admin/market",
        label: "Marketplace",
        icon: ShoppingBag,
      },
    ],
  },
  {
    key: "money",
    label: "Money",
    accentClass: "text-admin-accent-money",
    dotColor: "bg-admin-accent-money",
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
        label: "ZED Token",
        icon: Coins,
      },
      {
        href: "/admin/settings/levels",
        label: "Level Rules",
        icon: Sliders,
      },
    ],
  },
  {
    key: "inbox",
    label: "Inbox",
    accentClass: "text-admin-accent-inbox",
    dotColor: "bg-admin-accent-inbox",
    items: [
      {
        href: "/admin/contact",
        label: "Contact Inbox",
        icon: Mail,
        badgeKey: "contact",
      },
    ],
  },
  {
    key: "system",
    label: "System",
    accentClass: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    items: [
      {
        href: "/admin/audit-log",
        label: "Audit Log",
        icon: ScrollText,
      },
    ],
  },
];

