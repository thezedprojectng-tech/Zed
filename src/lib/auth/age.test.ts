import { describe, it, expect } from "vitest";
import { MIN_AGE, lagosToday, buildDob, ageOn, validateDob } from "./age";

describe("age utilities", () => {
  describe("MIN_AGE", () => {
    it("is strictly 16", () => {
      expect(MIN_AGE).toBe(16);
    });
  });

  describe("lagosToday", () => {
    it("returns ISO formatted date string YYYY-MM-DD", () => {
      const today = lagosToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("buildDob", () => {
    it("formats valid year, month, day into YYYY-MM-DD", () => {
      expect(buildDob(2000, 7, 5)).toBe("2000-07-05");
      expect(buildDob(1999, 12, 31)).toBe("1999-12-31");
    });

    it("rejects 31 Feb as invalid", () => {
      expect(buildDob(2004, 2, 31)).toBeNull();
    });

    it("rejects 29 Feb in non-leap year", () => {
      expect(buildDob(2023, 2, 29)).toBeNull();
    });

    it("accepts 29 Feb in leap year", () => {
      expect(buildDob(2024, 2, 29)).toBe("2024-02-29");
      expect(buildDob(2008, 2, 29)).toBe("2008-02-29");
    });

    it("rejects non-integer or out of range values", () => {
      expect(buildDob(2000, 5, 0)).toBeNull();
      expect(buildDob(2000, 1, 32)).toBeNull();
      expect(buildDob(2000, 13, 15)).toBeNull();
      expect(buildDob(2000, 0, 15)).toBeNull();
      expect(buildDob(2000, 6, 15.5)).toBeNull();
    });
  });

  describe("ageOn", () => {
    it("calculates exact 16 on birthday", () => {
      expect(ageOn("2008-05-10", "2024-05-10")).toBe(16);
    });

    it("calculates 15 on day before 16th birthday", () => {
      expect(ageOn("2008-05-10", "2024-05-09")).toBe(15);
    });

    it("calculates 16 on day after 16th birthday", () => {
      expect(ageOn("2008-05-10", "2024-05-11")).toBe(16);
    });

    it("handles Feb 29 leap day birthdays correctly", () => {
      // 2008 was a leap year; 2024 is a leap year (16 years later)
      expect(ageOn("2008-02-29", "2024-02-29")).toBe(16);
      expect(ageOn("2008-02-29", "2024-02-28")).toBe(15);
      expect(ageOn("2008-02-29", "2024-03-01")).toBe(16);
    });
  });

  describe("validateDob", () => {
    it("accepts a user who is exactly 16 today in Lagos", () => {
      const today = lagosToday();
      const [ty, tm, td] = today.split("-").map(Number);
      const dob16 = buildDob(ty - 16, tm, td);
      expect(dob16).not.toBeNull();
      expect(validateDob(dob16!)).toEqual({ ok: true });
    });

    it("rejects a user who turns 16 tomorrow as underage", () => {
      const today = lagosToday();
      const todayDate = new Date(`${today}T00:00:00Z`);
      const tomorrow = new Date(todayDate.getTime() + 86400000);
      const tm = tomorrow.getUTCMonth() + 1;
      const td = tomorrow.getUTCDate();
      const ty = tomorrow.getUTCFullYear() - 16;
      const dobTomorrow = buildDob(ty, tm, td);
      if (dobTomorrow) {
        expect(validateDob(dobTomorrow)).toEqual({
          ok: false,
          reason: "underage",
        });
      }
    });

    it("handles Feb 29 leap-year birthday correctly", () => {
      expect(ageOn("2008-02-29", "2024-02-29")).toBe(16);
      expect(ageOn("2008-02-29", "2024-02-28")).toBe(15);
    });

    it("returns invalid for impossible calendar dates like 31 Feb", () => {
      expect(validateDob("2004-02-31")).toEqual({
        ok: false,
        reason: "invalid",
      });
      expect(validateDob("2005-02-29")).toEqual({
        ok: false,
        reason: "invalid",
      });
    });

    it("returns invalid for future dates", () => {
      const today = lagosToday();
      const [ty, tm, td] = today.split("-").map(Number);
      const future = `${ty + 1}-${String(tm).padStart(2, "0")}-${String(td).padStart(2, "0")}`;
      expect(validateDob(future)).toEqual({
        ok: false,
        reason: "invalid",
      });
    });

    it("returns invalid for year before 1900", () => {
      expect(validateDob("1899-12-31")).toEqual({
        ok: false,
        reason: "invalid",
      });
      expect(validateDob("1850-05-10")).toEqual({
        ok: false,
        reason: "invalid",
      });
    });

    it("returns missing for empty string, null, or undefined", () => {
      expect(validateDob("")).toEqual({ ok: false, reason: "missing" });
      expect(validateDob(null)).toEqual({ ok: false, reason: "missing" });
      expect(validateDob(undefined)).toEqual({ ok: false, reason: "missing" });
    });

    it("returns invalid for malformed strings", () => {
      expect(validateDob("not-a-date")).toEqual({
        ok: false,
        reason: "invalid",
      });
      expect(validateDob("2000/05/10")).toEqual({
        ok: false,
        reason: "invalid",
      });
    });
  });
});
