import type { Level } from "@/types";

/** Zed level definitions – display only in Phase 1. Unlock logic comes later. */
export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Zed Rookie",
    unlock_criteria: "Default level",
  },
  {
    id: 2,
    name: "Zed Citizen",
    unlock_criteria: "Verify your NIN and complete 3 nav guides",
  },
  {
    id: 3,
    name: "Zed Scholar",
    unlock_criteria: "Complete 10 nav guides and refer 2 users",
  },
  {
    id: 4,
    name: "Zed Pioneer",
    unlock_criteria: "Complete 25 nav guides and contribute 5 center reports",
  },
  {
    id: 5,
    name: "Zed Legend",
    unlock_criteria: "Top 1% contributor in your state",
  },
] as const;

export const LEVEL_MAP = Object.fromEntries(
  LEVELS.map((l) => [l.id, l])
) as Record<1 | 2 | 3 | 4 | 5, Level>;
