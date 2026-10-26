import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isVerifiedBadgeEnabled, shouldShowContactWarning } from "./flags";

describe("isVerifiedBadgeEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns true when NEXT_PUBLIC_SHOW_VERIFIED_BADGE is "true"', () => {
    process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "true";
    expect(isVerifiedBadgeEnabled()).toBe(true);
  });

  it('returns false when NEXT_PUBLIC_SHOW_VERIFIED_BADGE is "false"', () => {
    process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "false";
    expect(isVerifiedBadgeEnabled()).toBe(false);
  });

  it("returns false when NEXT_PUBLIC_SHOW_VERIFIED_BADGE is not set", () => {
    delete process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE;
    expect(isVerifiedBadgeEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_SHOW_VERIFIED_BADGE is "TRUE" (case-sensitive)', () => {
    process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "TRUE";
    expect(isVerifiedBadgeEnabled()).toBe(false);
  });

  it('returns false when NEXT_PUBLIC_SHOW_VERIFIED_BADGE is "1"', () => {
    process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "1";
    expect(isVerifiedBadgeEnabled()).toBe(false);
  });

  it("returns false when NEXT_PUBLIC_SHOW_VERIFIED_BADGE is empty string", () => {
    process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "";
    expect(isVerifiedBadgeEnabled()).toBe(false);
  });
});

// ── Contact-warning logic ───────────────────────────────────────────────────
// Requirements:
// 1. flag off = no dialog (reveal contact directly)
// 2. flag on + unverified seller = dialog
// 3. verified seller = no dialog
describe("contact-warning logic (shouldShowContactWarning)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("scenario 1: flag off = no dialog", () => {
    it("returns false for unverified seller when flag is explicitly 'false'", () => {
      process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "false";
      expect(shouldShowContactWarning(false)).toBe(false);
    });

    it("returns false for unverified seller when flag is not set", () => {
      delete process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE;
      expect(shouldShowContactWarning(false)).toBe(false);
    });

    it("returns false for verified seller when flag is off", () => {
      process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "false";
      expect(shouldShowContactWarning(true)).toBe(false);
    });
  });

  describe("scenario 2: flag on + unverified seller = dialog", () => {
    it("returns true when flag is ON and seller is unverified", () => {
      process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "true";
      expect(shouldShowContactWarning(false)).toBe(true);
    });
  });

  describe("scenario 3: verified seller = no dialog", () => {
    it("returns false when flag is ON but seller is verified", () => {
      process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "true";
      expect(shouldShowContactWarning(true)).toBe(false);
    });

    it("returns false when flag is OFF and seller is verified", () => {
      process.env.NEXT_PUBLIC_SHOW_VERIFIED_BADGE = "false";
      expect(shouldShowContactWarning(true)).toBe(false);
    });
  });
});
