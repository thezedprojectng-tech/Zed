import {
  Pen,
  Code2,
  GraduationCap,
  FileText,
  Camera,
  Scissors,
  Wrench,
  Bike,
  Music,
  BarChart3,
  Package,
} from "lucide-react";
import type { MarketCategory, MarketCondition, MarketStatus } from "./types";

export interface CategoryMeta {
  id: MarketCategory;
  label: string;
  icon: React.ElementType;
  description: string;
}

export const CATEGORY_DEFINITIONS: Record<MarketCategory, CategoryMeta> = {
  "design-and-creative": {
    id: "design-and-creative",
    label: "Design & Creative",
    icon: Pen,
    description: "Graphic design, branding, illustration, UI/UX, motion graphics",
  },
  "tech-and-development": {
    id: "tech-and-development",
    label: "Tech & Development",
    icon: Code2,
    description: "Web dev, mobile apps, data, IT support, software solutions",
  },
  "tutoring-and-lessons": {
    id: "tutoring-and-lessons",
    label: "Tutoring & Lessons",
    icon: GraduationCap,
    description: "Academic coaching, exam prep, language lessons, skill training",
  },
  "writing-and-translation": {
    id: "writing-and-translation",
    label: "Writing & Translation",
    icon: FileText,
    description: "Copywriting, content writing, proofreading, transcription, translation",
  },
  "photography-and-video": {
    id: "photography-and-video",
    label: "Photography & Video",
    icon: Camera,
    description: "Portrait, event photography, video production, editing, reels",
  },
  "fashion-and-beauty-services": {
    id: "fashion-and-beauty-services",
    label: "Fashion & Beauty Services",
    icon: Scissors,
    description: "Tailoring, hair styling, make-up, fashion design, nail art",
  },
  "repairs-and-maintenance": {
    id: "repairs-and-maintenance",
    label: "Repairs & Maintenance",
    icon: Wrench,
    description: "Phone repairs, electrical, plumbing, appliance fixes, AC servicing",
  },
  "errands-and-delivery": {
    id: "errands-and-delivery",
    label: "Errands & Delivery",
    icon: Bike,
    description: "Pick-up and drop-off, shopping runs, document delivery",
  },
  "events-and-entertainment": {
    id: "events-and-entertainment",
    label: "Events & Entertainment",
    icon: Music,
    description:
      "Event planning, DJ services, MC/compère, decorations, event catering as a booked service",
  },
  "business-and-admin": {
    id: "business-and-admin",
    label: "Business & Admin",
    icon: BarChart3,
    description: "Virtual assistant, data entry, accounting, business registration, legal support",
  },
  "other-services": {
    id: "other-services",
    label: "Other Services",
    icon: Package,
    description: "Any legitimate service that doesn't fit the categories above",
  },
};

export const CONDITION_LABELS: Record<MarketCondition, { label: string; badgeClass: string }> = {
  new: {
    label: "Brand New",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  used: {
    label: "Gently Used",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  na: {
    label: "Not Applicable",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  },
};

export const STATUS_LABELS: Record<MarketStatus, { label: string; badgeClass: string }> = {
  active: {
    label: "Active",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  sold: {
    label: "Sold",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  removed: {
    label: "Removed",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

/**
 * Format price in Nigerian Naira, handling null as "Contact for price" and 0 as "Free".
 */
export function formatNgnPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return "Contact for price";
  }
  if (price === 0) {
    return "Free";
  }
  return `₦${Number(price).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Prohibited items list — services marketplace.
 * Item 9 (upfront payment) is moved to safety wording instead.
 */
export const PROHIBITED_ITEMS = [
  "Weapons, firearms, ammunition, knives, explosives, or fireworks",
  "Illicit drugs, narcotics, prescription medications, or controlled substances",
  "Counterfeit services, unauthorized use of third-party IP, or pirated software",
  "Stolen property, hijacked credentials, or services acquired unlawfully",
  "Adult, sexually explicit, pornographic, or escort services or content",
  "Hazardous chemicals, toxic substances, or dangerous materials",
  "Academic dishonesty (e.g. writing exam papers, impersonation, or ghost-studying)",
  "Anything strictly prohibited under Nigerian law or federal regulations",
];

/**
 * Safety disclaimer for the services marketplace.
 * Note: selling packaged food or physical goods is not allowed.
 */
export const SAFETY_DISCLAIMER =
  "Zed Market is for services only — not physical goods. Agree terms clearly before work begins. Never pay the full amount before seeing work. Report anything suspicious.";

/**
 * Format a WhatsApp phone number into an international click-to-chat URL.
 */
export function buildWhatsAppLink(phone: string, listingTitle?: string): string {
  // Strip non-numeric characters except leading +
  let clean = phone.replace(/[^0-9]/g, "");
  // If Nigerian local format starting with 0, convert to 234
  if (clean.startsWith("0") && clean.length === 11) {
    clean = `234${clean.slice(1)}`;
  }
  const text = listingTitle
    ? encodeURIComponent(`Hi, I saw your listing for "${listingTitle}" on Zed Market. Is it still available?`)
    : encodeURIComponent("Hi, I saw your service listing on Zed Market. Is it still available?");
  return `https://wa.me/${clean}?text=${text}`;
}

/**
 * Maps raw database errors into user-friendly messages.
 */
export function mapMarketError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const msg = typeof error === "string" ? error : (error as { message?: string }).message || "";

  if (msg.includes("maximum of 10 active listings") || msg.includes("limit of 10 active listings")) {
    return "You have reached the maximum limit of 10 active listings. Please mark completed items as sold or delete inactive ones.";
  }
  if (msg.includes("Daily limit reached") || msg.includes("5 listings every 24 hours")) {
    return "Daily limit reached: You can create up to 5 listings every 24 hours.";
  }
  if (msg.includes("Daily contact limit reached") || msg.includes("30 seller contacts")) {
    return "Daily contact limit reached: You can view at most 30 seller contacts per 24 hours.";
  }
  if (msg.includes("You have already reported")) {
    return "You have already reported this listing. Our moderation team is reviewing it.";
  }
  if (msg.includes("Cannot report own listing") || msg.includes("report your own")) {
    return "You cannot report your own listing.";
  }
  if (msg.includes("Not authenticated") || msg.includes("sign in")) {
    return "Please sign in to continue.";
  }
  if (msg.includes("only supports services")) {
    return "Invalid category. Zed Market only supports services — not physical goods.";
  }
  return msg || "An error occurred while processing your request.";
}
