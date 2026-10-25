import { describe, it, expect } from "vitest";
import {
  usernameSchema,
  displayNameSchema,
  fullNameSchema,
  adminClearProfileSchema,
  isReservedUsername,
  findBannedSubstring,
  RESERVED_USERNAMES,
  BANNED_SUBSTRINGS,
} from "./validation";

describe("Profile Validation - Username", () => {
  it("accepts valid usernames", () => {
    const valid = ["zayd_t", "john123", "cool_dev_99", "alex", "user_abc_123"];
    for (const u of valid) {
      const res = usernameSchema.safeParse(u);
      expect(res.success, `Expected "${u}" to be valid`).toBe(true);
    }
  });

  it("rejects usernames that are too short or too long", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(21)).success).toBe(false);
  });

  it("rejects usernames starting with numbers or symbols", () => {
    expect(usernameSchema.safeParse("123user").success).toBe(false);
    expect(usernameSchema.safeParse("_secret").success).toBe(false);
    expect(usernameSchema.safeParse("-invalid").success).toBe(false);
  });

  it("rejects usernames with invalid characters", () => {
    expect(usernameSchema.safeParse("user-name").success).toBe(false);
    expect(usernameSchema.safeParse("user name").success).toBe(false);
    expect(usernameSchema.safeParse("user.name").success).toBe(false);
    expect(usernameSchema.safeParse("user@123").success).toBe(false);
  });

  it("rejects exact reserved usernames", () => {
    for (const res of RESERVED_USERNAMES) {
      expect(isReservedUsername(res)).toBe(true);
      const parsed = usernameSchema.safeParse(res);
      expect(parsed.success, `Expected reserved word "${res}" to fail`).toBe(false);
    }
  });

  it("rejects usernames containing banned substrings", () => {
    for (const b of BANNED_SUBSTRINGS) {
      const sample = `the_${b}_user`;
      const match = findBannedSubstring(sample);
      expect(match).toBe(b);
      const res = usernameSchema.safeParse(sample);
      expect(res.success, `Expected "${sample}" to fail banned substring check`).toBe(false);
    }
  });
});

describe("Profile Validation - Display Name", () => {
  it("accepts valid display names", () => {
    const valid = ["Zayd Tahir", "Chidi Eze", "Kemi A.", "Dr. Ngozi", "Pro Builder"];
    for (const d of valid) {
      const res = displayNameSchema.safeParse(d);
      expect(res.success, `Expected "${d}" to be valid`).toBe(true);
    }
  });

  it("rejects display names that are too short or too long", () => {
    expect(displayNameSchema.safeParse("A").success).toBe(false);
    expect(displayNameSchema.safeParse("A".repeat(41)).success).toBe(false);
  });

  it("rejects display names with URLs", () => {
    expect(displayNameSchema.safeParse("Visit http://test.com").success).toBe(false);
    expect(displayNameSchema.safeParse("Check https://zed.ng").success).toBe(false);
  });

  it("rejects display names with @ character", () => {
    expect(displayNameSchema.safeParse("User @ Zed").success).toBe(false);
    expect(displayNameSchema.safeParse("john@doe").success).toBe(false);
  });

  it("rejects display names with control characters", () => {
    expect(displayNameSchema.safeParse("John\x00Doe").success).toBe(false);
    expect(displayNameSchema.safeParse("John\x1FDoe").success).toBe(false);
  });

  it("rejects display names containing banned substrings case-insensitively", () => {
    const banned = [
      "Official Zed Account",
      "Support Team Agent",
      "Admin Zayd",
      "Senior Moderator",
      "ZedProject Ambassador",
      "Zed_Project Lead",
    ];
    for (const b of banned) {
      const match = findBannedSubstring(b);
      expect(match).not.toBeNull();
      const res = displayNameSchema.safeParse(b);
      expect(res.success, `Expected "${b}" to fail banned check`).toBe(false);
    }
  });
});

describe("Profile Validation - Full Name", () => {
  it("validates full name lengths", () => {
    expect(fullNameSchema.safeParse("A").success).toBe(false);
    expect(fullNameSchema.safeParse("Ab").success).toBe(true);
    expect(fullNameSchema.safeParse("A".repeat(100)).success).toBe(true);
    expect(fullNameSchema.safeParse("A".repeat(101)).success).toBe(false);
  });
});

describe("Profile Validation - Admin Clear Profile Schema", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts valid admin clear payloads", () => {
    const res = adminClearProfileSchema.safeParse({
      userId: validUuid,
      clearUsername: true,
      clearDisplayName: false,
      clearAvatar: false,
      reason: "Impersonation violation",
    });
    expect(res.success).toBe(true);
  });

  it("rejects when no fields are checked", () => {
    const res = adminClearProfileSchema.safeParse({
      userId: validUuid,
      clearUsername: false,
      clearDisplayName: false,
      clearAvatar: false,
      reason: "No fields selected test",
    });
    expect(res.success).toBe(false);
  });

  it("rejects when reason is too short", () => {
    const res = adminClearProfileSchema.safeParse({
      userId: validUuid,
      clearUsername: true,
      clearDisplayName: false,
      clearAvatar: false,
      reason: "no",
    });
    expect(res.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const res = adminClearProfileSchema.safeParse({
      userId: "not-a-uuid",
      clearUsername: true,
      clearDisplayName: false,
      clearAvatar: false,
      reason: "Valid reason text",
    });
    expect(res.success).toBe(false);
  });
});
