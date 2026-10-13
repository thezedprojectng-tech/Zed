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

// ── Level System (display only – no unlock logic in Phase 1) ──────────────────

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
