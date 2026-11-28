import { getLevelName } from "@/types";

export type LeaderboardBoard = "learners" | "consistency";
export type LeaderboardPeriod = "week" | "all";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar_path: string | null;
  avatar_url: string | null;
  level: number;
  value: number;
  is_me: boolean;
}

export interface LeaderboardMe {
  rank: number | null;
  value: number;
  hidden: boolean;
}

export interface LeaderboardData {
  board: LeaderboardBoard;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  me: LeaderboardMe | null;
}

export function getLeaderboardAvatarSrc(
  avatarPath?: string | null,
  avatarUrl?: string | null
): string | undefined {
  if (avatarPath && avatarPath.trim().length > 0) {
    return `/api/avatar/${avatarPath.replace(/^\/+/, "")}`;
  }
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }
  return undefined;
}

export function getAvatarInitials(name?: string | null): string {
  if (!name || !name.trim()) return "ZE";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase() || "ZE";
}

export function getBoardValueLabel(board: LeaderboardBoard): string {
  return board === "learners" ? "points" : "days mined";
}

export function formatLeaderboardValue(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return safe.toLocaleString("en-NG");
}

export function formatLeaderboardLevel(level: number | string | null | undefined): {
  badge: string;
  title: string;
} {
  const parsed = typeof level === "number" ? level : Number(level);
  const safeLevel = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
  return {
    badge: `Level ${safeLevel}`,
    title: getLevelName(safeLevel),
  };
}

/**
 * Ensures tied values share the exact same rank (standard competition ranking: 1, 1, 3).
 * Preserves RPC-provided ranks when already consistent, or recalculates ties deterministically.
 */
export function resolveTiedRanks(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  let lastValue: number | null = null;
  let lastRank = 0;

  return entries.map((entry, idx) => {
    const safeValue = Number.isFinite(entry.value) ? entry.value : 0;
    let rank: number;
    if (lastValue !== null && safeValue === lastValue) {
      rank = lastRank;
    } else {
      rank = Number.isFinite(entry.rank) && entry.rank > 0 ? Math.floor(entry.rank) : idx + 1;
      // If previous entry had a higher rank than idx + 1 or RPC gave sequential ranks for ties,
      // ensure rank is at least idx + 1 when not tied.
      if (lastValue !== null && rank <= lastRank) {
        rank = idx + 1;
      }
    }
    lastValue = safeValue;
    lastRank = rank;
    return {
      ...entry,
      rank,
      value: safeValue,
    };
  });
}

export function normalizeLeaderboardResponse(
  raw: unknown,
  fallbackBoard: LeaderboardBoard,
  fallbackPeriod: LeaderboardPeriod
): LeaderboardData {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const board: LeaderboardBoard =
    obj.board === "consistency" || obj.board === "learners"
      ? obj.board
      : fallbackBoard;
  const period: LeaderboardPeriod =
    obj.period === "week" || obj.period === "all"
      ? obj.period
      : fallbackPeriod;

  const rawEntries = Array.isArray(obj.entries) ? obj.entries : [];
  const mapped: LeaderboardEntry[] = rawEntries.map((item, idx) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const rawLevel = Number(row.level);
    return {
      rank: Number.isFinite(Number(row.rank)) ? Number(row.rank) : idx + 1,
      name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : "Member",
      avatar_path: typeof row.avatar_path === "string" ? row.avatar_path : null,
      avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
      level: Number.isFinite(rawLevel) && rawLevel >= 1 ? Math.floor(rawLevel) : 1,
      value: Number.isFinite(Number(row.value)) ? Number(row.value) : 0,
      is_me: Boolean(row.is_me),
    };
  });

  const entries = resolveTiedRanks(mapped);

  let me: LeaderboardMe | null = null;
  if (obj.me && typeof obj.me === "object") {
    const meObj = obj.me as Record<string, unknown>;
    const rawRank = meObj.rank === null || meObj.rank === undefined ? null : Number(meObj.rank);
    me = {
      rank: rawRank !== null && Number.isFinite(rawRank) && rawRank > 0 ? Math.floor(rawRank) : null,
      value: Number.isFinite(Number(meObj.value)) ? Number(meObj.value) : 0,
      hidden: Boolean(meObj.hidden),
    };
  }

  return {
    board,
    period,
    entries,
    me,
  };
}
