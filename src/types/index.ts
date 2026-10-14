// ─── Zed Project – Core Types (Phase 1) ───────────────────────────────────────

// ── User / Auth ───────────────────────────────────────────────────────────────

export interface ZedUser {
  id: string;
  phone_number: string;
  nin_hash?: string | null;
  full_name: string;
  avatar_url?: string | null;
  level_id: 1 | 2 | 3 | 4 | 5;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ── Level System (spec level names) ──────────────────────────────────────────

export const LEVEL_NAMES: Record<number, string> = {
  1: "Rookie",
  2: "Explorer",
  3: "Builder",
  4: "Pro",
  5: "Zed Legend",
} as const;

export function getLevelName(levelId: number | undefined | null): string {
  if (!levelId) return "Rookie";
  return LEVEL_NAMES[levelId] || `Level ${levelId}`;
}

export interface Level {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  unlock_criteria: string;
}

// ── Zed Nav – Flow Engine (re-exported from @/types/nav) ──────────────────────

export type {
  NavStep,
  NavFlow,
  NavProgress,
  InfoStep,
  ChecklistStep,
  ChecklistItem,
  LinkStep,
  DecisionStep,
  DecisionOption,
  DocumentCheckStep,
  DocumentItem,
  FlowCategory,
  FlowDifficulty,
} from "./nav";

// ── Center Reports ────────────────────────────────────────────────────────────

export interface CenterReport {
  id: string;
  user_id: string;
  center_name: string;
  state: string;
  wait_minutes: number;
  reported_at: string;
}

// ── API Payloads ──────────────────────────────────────────────────────────────

export interface OtpRequestPayload {
  phone_number: string;
}

export interface OtpVerifyPayload {
  phone_number: string;
  token: string;
}

export interface NinVerifyPayload {
  nin: string;
}

export interface NinVerifyResponse {
  success: boolean;
  message: string;
  is_verified?: boolean;
}
