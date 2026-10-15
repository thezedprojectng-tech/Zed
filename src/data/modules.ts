/**
 * Zed Platform – Module Registry
 *
 * This is the SINGLE SOURCE OF TRUTH for every module in the Zed ecosystem.
 * Both the marketing site ecosystem grid and the dashboard modules section
 * read from this list so they never drift apart.
 *
 * Rules:
 * - Do NOT add invented stats, user counts, partners, dates, or prices.
 * - "description" is the tagline shown on cards (one line).
 * - "what" is the "What it will do" paragraph for the placeholder page.
 * - status "live" = working today; "soon" = Coming soon placeholder.
 * - phase is the roadmap phase label (e.g. "Phase 2").
 */

import type { LucideIcon } from "lucide-react";
import {
  Compass,
  FileText,
  Briefcase,
  ShoppingBag,
  MessageSquare,
  Pickaxe,
  Building2,
  Users,
  Palette,
  Radio,
  Video,
  LifeBuoy,
  Search,
  BarChart2,
} from "lucide-react";

export type ModuleStatus = "live" | "soon";

export interface ZedModule {
  /** URL slug, used for /modules/[slug] dynamic route */
  slug: string;
  /** Display name */
  name: string;
  /** One-line tagline shown on ecosystem cards and dashboard tiles */
  tagline: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Whether the module is currently available or upcoming */
  status: ModuleStatus;
  /** Roadmap phase label */
  phase: string;
  /**
   * Optional direct href for live modules.
   * "Soon" modules link to /modules/[slug] automatically.
   */
  href?: string;
  /**
   * Two-sentence description of what the module will do.
   * Used on the /modules/[slug] placeholder page.
   */
  what: string;
}

export const MODULES: ZedModule[] = [
  // -- Live ------------------------------------------------------------------
  {
    slug: "zed-nav",
    name: "Zed Nav",
    tagline:
      "Step-by-step verified civic playbooks for passport, NYSC, NIN, and business registration.",
    icon: Compass,
    status: "live",
    phase: "Phase 1",
    href: "/nav",
    what: "Zed Nav provides end-to-end bureaucratic navigation across official Nigerian civil processes. Every step is vetted against active agency requirements, with statutory fee tables, document checklists, and offline support.",
  },
  {
    slug: "cds-logger",
    name: "CDS Logger",
    tagline: "Personal CDS attendance tracker for NYSC corps members.",
    icon: FileText,
    status: "live",
    phase: "Phase 1",
    href: "/nav/nysc/cds",
    what: "CDS Logger lets corps members record Community Development Service sessions, track hours, and export a personal attendance log. It is a personal record — not an official NYSC document.",
  },

  // -- Coming soon -----------------------------------------------------------
  {
    slug: "zed-skill",
    name: "Zed Skill",
    tagline: "Practical career playbooks and technical roadmaps for Nigerian youth.",
    icon: Briefcase,
    status: "soon",
    phase: "Phase 2",
    what: "Zed Skill will deliver structured career-development playbooks covering in-demand technical and professional skills. It is designed to close the gap between Nigerian graduates and workplace readiness.",
  },
  {
    slug: "zed-market",
    name: "Zed Market",
    tagline: "Transparent, escrow-secured marketplace connecting youth with vetted providers.",
    icon: ShoppingBag,
    status: "soon",
    phase: "Phase 2",
    what: "Zed Market will be a trust-first services marketplace where buyers and sellers transact through an escrow layer, eliminating fraud risk for freelance work, digital services, and physical goods.",
  },
  {
    slug: "zed-chat",
    name: "Zed Chat",
    tagline: "Peer-to-peer discussion channels and community messaging.",
    icon: MessageSquare,
    status: "soon",
    phase: "Phase 2",
    what: "Zed Chat will provide persistent community channels and direct messaging so users can share tips, coordinate queue strategies, and support one another across all Zed modules in real time.",
  },
  {
    slug: "zed-mining",
    name: "Zed Mining",
    tagline: "Earn $ZED rewards for active platform participation and contributions.",
    icon: Pickaxe,
    status: "soon",
    phase: "Phase 3",
    what: "Zed Mining will track meaningful platform activity—guide completions, verified field reports, and community contributions—and convert that engagement into $ZED utility tokens redeemable within the ecosystem.",
  },
  {
    slug: "campus-hubs",
    name: "Campus Hubs",
    tagline: "University-specific mobilization guides and campus community networks.",
    icon: Building2,
    status: "soon",
    phase: "Phase 2",
    what: "Campus Hubs will bring institution-specific clearance checklists, hostel guides, departmental walkthrough flows, and a peer network tailored to each Nigerian university campus.",
  },
  {
    slug: "alumni-office-hours",
    name: "Alumni Office Hours",
    tagline: "Direct mentorship and career advice from experienced alumni.",
    icon: Users,
    status: "soon",
    phase: "Phase 3",
    what: "Alumni Office Hours will connect current students and early-career youth with seasoned professionals through structured, time-boxed mentorship sessions hosted on the Zed platform.",
  },
  {
    slug: "creator-lab",
    name: "Creator Lab",
    tagline: "Digital craft resources and monetization guides for independent Nigerian creators.",
    icon: Palette,
    status: "soon",
    phase: "Phase 3",
    what: "Creator Lab will equip independent Nigerian creatives with structured toolkits, publishing playbooks, and monetization pathways to build sustainable practices around their craft.",
  },
  {
    slug: "live-audio-rooms",
    name: "Live Audio Rooms",
    tagline: "Real-time community audio spaces for open discussions and Q&A.",
    icon: Radio,
    status: "soon",
    phase: "Phase 3",
    what: "Live Audio Rooms will enable community members and featured guests to host open-mic conversations, civic briefings, and knowledge-sharing sessions accessible directly inside the Zed platform.",
  },
  {
    slug: "zed-meet",
    name: "Zed Meet",
    tagline: "Local physical meetups, study sessions, and queue coordination across Nigeria.",
    icon: Video,
    status: "soon",
    phase: "Phase 2",
    what: "Zed Meet will help users self-organize in-person study circles, document preparation sessions, and community meetups, with location-aware listings across major Nigerian cities.",
  },
  {
    slug: "zed-sos",
    name: "Zed SOS",
    tagline: "Rapid assistance, verified emergency helplines, and critical civic safety resources.",
    icon: LifeBuoy,
    status: "soon",
    phase: "Phase 2",
    what: "Zed SOS will aggregate verified emergency contacts, legal aid resources, and civic safety information into a fast-access layer for users who need urgent help navigating critical situations.",
  },
  {
    slug: "internship-radar",
    name: "Internship Radar",
    tagline: "Curated tracking of verified internship and industrial training opportunities.",
    icon: Search,
    status: "soon",
    phase: "Phase 2",
    what: "Internship Radar will surface verified entry-level openings, SIWES placements, and graduate trainee programmes, filtered by field and location, so Nigerian youth spend less time searching and more time applying.",
  },
  {
    slug: "civic-trackers",
    name: "Civic Trackers",
    tagline: "Community-reported wait times and operational updates at public service centers.",
    icon: BarChart2,
    status: "soon",
    phase: "Phase 2",
    what: "Civic Trackers will aggregate user-submitted reports on crowd levels, queue lengths, and system availability at passport offices, NIMC enrollment points, and other high-traffic government service locations.",
  },
];

/** Convenience: just the live modules */
export const LIVE_MODULES = MODULES.filter((m) => m.status === "live");

/** Convenience: just the coming-soon modules */
export const SOON_MODULES = MODULES.filter((m) => m.status === "soon");
