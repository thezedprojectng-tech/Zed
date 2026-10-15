// ─── CDS Logger – Shared Zod Schema + Pure Helpers ────────────────────────────
// Used by both client-side react-hook-form and server actions for validation.

import { z } from "zod";
import type { CdsLog, CdsSummary } from "@/types/cds";

// ── Zod schema ────────────────────────────────────────────────────────────────

export const cdsLogSchema = z.object({
  session_date: z
    .string()
    .min(1, "Session date is required")
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, "Must be a valid date")
    .refine((val) => {
      // Not in the future (compare date-only strings to avoid timezone drift)
      const today = new Date().toISOString().slice(0, 10);
      return val <= today;
    }, "Session date cannot be in the future"),

  group_name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or fewer"),

  activity: z
    .string()
    .min(1, "Activity description is required")
    .max(500, "Activity must be 500 characters or fewer"),

  hours: z
    .number()
    .positive("Hours must be greater than 0")
    .max(12, "Hours cannot exceed 12 per session")
    // Round to 1 decimal place on the schema
    .transform((v) => Math.round(v * 10) / 10),

  notes: z
    .string()
    .max(1000, "Notes must be 1000 characters or fewer")
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});

export type CdsLogFormData = z.input<typeof cdsLogSchema>;
export type CdsLogParsed = z.output<typeof cdsLogSchema>;

// ── Pure helpers ──────────────────────────────────────────────────────────────

/**
 * Compute summary statistics from a list of CDS logs.
 * Pure function — no side effects — safe to test.
 */
export function computeCdsSummary(logs: CdsLog[]): CdsSummary {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth(); // 0-indexed

  let totalHours = 0;
  let sessionsThisMonth = 0;
  let hoursThisMonth = 0;

  for (const log of logs) {
    const h = Number(log.hours);
    totalHours += h;

    const d = new Date(log.session_date + "T00:00:00");
    if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
      sessionsThisMonth += 1;
      hoursThisMonth += h;
    }
  }

  return {
    totalSessions: logs.length,
    totalHours: Math.round(totalHours * 10) / 10,
    sessionsThisMonth,
    hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
  };
}

/**
 * Generate a CSV string from a list of CDS logs.
 * Pure function — safe to test.
 * Escapes double-quotes per RFC 4180.
 */
export function generateCdsCsv(logs: CdsLog[]): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val == null) return "";
    const str = String(val);
    // Wrap in quotes if contains comma, quote or newline
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = ["Date", "Group Name", "Activity", "Hours", "Notes", "Logged At"];
  const rows = logs.map((log) => [
    escape(log.session_date),
    escape(log.group_name),
    escape(log.activity),
    escape(log.hours),
    escape(log.notes),
    escape(log.created_at),
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Format a numeric hour value as a display string.
 * e.g. 1 → "1 hr", 1.5 → "1.5 hrs", 2 → "2 hrs"
 */
export function formatHours(h: number): string {
  return `${h} ${h === 1 ? "hr" : "hrs"}`;
}
