// ─── CDS Logger – Type Definitions ────────────────────────────────────────────

export interface CdsLog {
  id: string;
  user_id: string;
  session_date: string; // ISO date "YYYY-MM-DD"
  group_name: string;
  activity: string;
  hours: number;
  notes: string | null;
  created_at: string;
}

/** Summary stats derived from a set of CdsLog entries */
export interface CdsSummary {
  totalSessions: number;
  totalHours: number;
  sessionsThisMonth: number;
  hoursThisMonth: number;
}

/** Shape of a queued-offline entry (no id/created_at yet) */
export interface PendingCdsLog {
  /** Client-side temp id for deduplication */
  tempId: string;
  session_date: string;
  group_name: string;
  activity: string;
  hours: number;
  notes: string | null;
  queued_at: string;
}
