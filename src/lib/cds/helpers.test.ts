import { describe, it, expect } from "vitest";
import { cdsLogSchema, computeCdsSummary, generateCdsCsv, formatHours } from "@/lib/cds/helpers";
import type { CdsLog } from "@/types/cds";

// ── Schema validation ─────────────────────────────────────────────────────────

describe("cdsLogSchema", () => {
  const valid = {
    session_date: "2026-01-15",
    group_name: "Health CDS",
    activity: "Community immunisation drive",
    hours: 2,
    notes: null,
  };

  it("accepts a valid entry", () => {
    const result = cdsLogSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const r = cdsLogSchema.safeParse({
      ...valid,
      session_date: future.toISOString().slice(0, 10),
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.session_date).toBeDefined();
    }
  });

  it("rejects an empty group name", () => {
    const r = cdsLogSchema.safeParse({ ...valid, group_name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects group name over 100 chars", () => {
    const r = cdsLogSchema.safeParse({ ...valid, group_name: "x".repeat(101) });
    expect(r.success).toBe(false);
  });

  it("rejects hours of 0", () => {
    const r = cdsLogSchema.safeParse({ ...valid, hours: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects hours over 12", () => {
    const r = cdsLogSchema.safeParse({ ...valid, hours: 12.5 });
    expect(r.success).toBe(false);
  });

  it("accepts hours of exactly 12", () => {
    const r = cdsLogSchema.safeParse({ ...valid, hours: 12 });
    expect(r.success).toBe(true);
  });

  it("accepts hours of 0.5", () => {
    const r = cdsLogSchema.safeParse({ ...valid, hours: 0.5 });
    expect(r.success).toBe(true);
  });

  it("rejects activity over 500 chars", () => {
    const r = cdsLogSchema.safeParse({ ...valid, activity: "a".repeat(501) });
    expect(r.success).toBe(false);
  });

  it("rejects notes over 1000 chars", () => {
    const r = cdsLogSchema.safeParse({ ...valid, notes: "n".repeat(1001) });
    expect(r.success).toBe(false);
  });

  it("accepts null notes", () => {
    const r = cdsLogSchema.safeParse({ ...valid, notes: null });
    expect(r.success).toBe(true);
  });

  it("accepts undefined notes (coerces to null)", () => {
    const withoutNotes = { ...valid, notes: undefined };
    const r = cdsLogSchema.safeParse(withoutNotes);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBeNull();
  });

  it("rounds hours to 1 decimal", () => {
    const r = cdsLogSchema.safeParse({ ...valid, hours: 1.55 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hours).toBe(1.6);
  });
});

// ── computeCdsSummary ─────────────────────────────────────────────────────────

describe("computeCdsSummary", () => {
  function makeLog(overrides: Partial<CdsLog> = {}): CdsLog {
    return {
      id: "1",
      user_id: "u1",
      session_date: "2026-01-10",
      group_name: "Health",
      activity: "First aid",
      hours: 2,
      notes: null,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  it("returns zeros for empty list", () => {
    const s = computeCdsSummary([]);
    expect(s.totalSessions).toBe(0);
    expect(s.totalHours).toBe(0);
    expect(s.sessionsThisMonth).toBe(0);
  });

  it("sums total sessions and hours", () => {
    const logs = [makeLog({ hours: 2 }), makeLog({ hours: 1.5 })];
    const s = computeCdsSummary(logs);
    expect(s.totalSessions).toBe(2);
    expect(s.totalHours).toBe(3.5);
  });

  it("counts this-month sessions using current date", () => {
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const thisMonthDate = `${thisMonth}-05`;
    const lastMonthDate = "2000-01-01"; // definitely not this month

    const logs = [
      makeLog({ session_date: thisMonthDate, hours: 3 }),
      makeLog({ session_date: lastMonthDate, hours: 2 }),
    ];
    const s = computeCdsSummary(logs);
    expect(s.sessionsThisMonth).toBe(1);
    expect(s.hoursThisMonth).toBe(3);
  });
});

// ── generateCdsCsv ────────────────────────────────────────────────────────────

describe("generateCdsCsv", () => {
  const log: CdsLog = {
    id: "abc",
    user_id: "u1",
    session_date: "2026-03-12",
    group_name: "Education CDS",
    activity: "Reading session",
    hours: 2,
    notes: "Went well",
    created_at: "2026-03-12T10:00:00Z",
  };

  it("produces a header row and one data row", () => {
    const csv = generateCdsCsv([log]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Date");
    expect(lines[0]).toContain("Hours");
    expect(lines[1]).toContain("2026-03-12");
    expect(lines[1]).toContain("Education CDS");
    expect(lines[1]).toContain("2");
  });

  it("returns only header for empty list", () => {
    const csv = generateCdsCsv([]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Date");
  });

  it("escapes commas in field values", () => {
    const tricky = { ...log, group_name: "Health, Sanitation" };
    const csv = generateCdsCsv([tricky]);
    expect(csv).toContain('"Health, Sanitation"');
  });

  it("escapes double-quotes in field values", () => {
    const tricky = { ...log, activity: 'He said "hello"' };
    const csv = generateCdsCsv([tricky]);
    expect(csv).toContain('"He said ""hello"""');
  });
});

// ── formatHours ───────────────────────────────────────────────────────────────

describe("formatHours", () => {
  it("uses singular for 1", () => expect(formatHours(1)).toBe("1 hr"));
  it("uses plural for 2", () => expect(formatHours(2)).toBe("2 hrs"));
  it("works with decimals", () => expect(formatHours(1.5)).toBe("1.5 hrs"));
  it("uses plural for 0.5", () => expect(formatHours(0.5)).toBe("0.5 hrs"));
});
