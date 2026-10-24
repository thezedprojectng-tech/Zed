import {
  Smartphone,
  Shirt,
  BookOpen,
  Wrench,
  Utensils,
  Palette,
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
  electronics: {
    id: "electronics",
    label: "Electronics & Gadgets",
    icon: Smartphone,
    description: "Phones, laptops, accessories, gaming, power banks",
  },
  fashion: {
    id: "fashion",
    label: "Fashion & Apparel",
    icon: Shirt,
    description: "Clothing, shoes, bags, watches, jewelry",
  },
  "books-and-notes": {
    id: "books-and-notes",
    label: "Books & Study Materials",
    icon: BookOpen,
    description: "Textbooks, revision guides, course notes, fiction",
  },
  services: {
    id: "services",
    label: "Skills & Services",
    icon: Wrench,
    description: "Graphic design, tutoring, CV writing, repairs, photography",
  },
  food: {
    id: "food",
    label: "Food & Confectionery",
    icon: Utensils,
    description: "Campus bakes, snacks, meal prep, healthy bites",
  },
  creative: {
    id: "creative",
    label: "Creative & Crafts",
    icon: Palette,
    description: "Custom prints, art, handmade goods, decor",
  },
  other: {
    id: "other",
    label: "General / Other",
    icon: Package,
    description: "Household items, hostel essentials, miscellaneous",
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
 * Prohibited items list required by Zed safety standards.
 */
export const PROHIBITED_ITEMS = [
  "Weapons, firearms, ammunition, knives, explosives, or fireworks",
  "Illicit drugs, narcotics, prescription medications, or controlled substances",
  "Counterfeit goods, unauthorized replicas, pirated software, or stolen media",
  "Stolen property, hijacked credentials, or items acquired unlawfully",
  "Adult, sexually explicit, pornographic, or escort services/content",
  "Hazardous chemicals, toxic substances, or dangerous materials",
  "Academic dishonesty items (e.g. solved exam question leaks or imposter test-taking)",
  "Anything strictly prohibited under Nigerian law or federal regulations",
];

export const SAFETY_DISCLAIMER =
  "Zed does not handle payments or delivery. Meet in a safe public place. Never pay before you see the item. Report anything suspicious.";

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
    : encodeURIComponent("Hi, I saw your listing on Zed Market. Is it still available?");
  return `https://wa.me/${clean}?text=${text}`;
}

/**
 * Maps raw database errors into user-friendly messages.
 */
export function mapMarketError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const msg = typeof error === "string" ? error : (error as { message?: string }).message || "";

  if (msg.includes("Only verified users")) {
    return "Only verified users can access this feature. Please verify your profile first.";
  }
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
  return msg || "An error occurred while processing your request.";
}
