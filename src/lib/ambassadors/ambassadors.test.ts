import { describe, it, expect } from "vitest";
import {
  ambassadorApplicationSchema,
  stripControlCharacters,
} from "./schema";
import { checkAmbassadorRateLimits, hashClientIp } from "./rate-limit";

describe("Ambassadors — Schema Validation", () => {
  const validPayload = {
    fullName: "Adebayo Adeleke",
    email: "adebayo@unilag.edu.ng",
    phone: "+2348012345678",
    institution: "University of Lagos",
    state: "Lagos",
    course: "Computer Science",
    level: "300 Level",
    socialHandle: "@adebayo_dev",
    whyAmbassador:
      "I am deeply passionate about digital literacy and helping my fellow university students adopt technology for civil processes.",
    referralCode: "amb123",
    consent: true,
  };

  it("validates and normalizes valid application payload", () => {
    const res = ambassadorApplicationSchema.safeParse(validPayload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.fullName).toBe("Adebayo Adeleke");
      expect(res.data.email).toBe("adebayo@unilag.edu.ng");
      expect(res.data.referralCode).toBe("AMB123");
      expect(res.data.consent).toBe(true);
    }
  });

  it("strips control characters while preserving valid text", () => {
    const stripped = stripControlCharacters("Hello\x00\x08World\x1F!");
    expect(stripped).toBe("HelloWorld!");
  });

  it("rejects invalid email formats", () => {
    const res = ambassadorApplicationSchema.safeParse({
      ...validPayload,
      email: "invalid-email-address",
    });
    expect(res.success).toBe(false);
  });

  it("rejects names shorter than 2 characters", () => {
    const res = ambassadorApplicationSchema.safeParse({
      ...validPayload,
      fullName: "A",
    });
    expect(res.success).toBe(false);
  });

  it("rejects whyAmbassador responses shorter than 30 characters", () => {
    const res = ambassadorApplicationSchema.safeParse({
      ...validPayload,
      whyAmbassador: "Too short reason",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("whyAmbassador");
    }
  });

  it("rejects whyAmbassador responses exceeding 1000 characters", () => {
    const res = ambassadorApplicationSchema.safeParse({
      ...validPayload,
      whyAmbassador: "A".repeat(1001),
    });
    expect(res.success).toBe(false);
  });

  it("rejects when consent is not true", () => {
    const res1 = ambassadorApplicationSchema.safeParse({
      ...validPayload,
      consent: false,
    });
    expect(res1.success).toBe(false);

    const res2 = ambassadorApplicationSchema.safeParse({
      ...validPayload,
      consent: undefined,
    });
    expect(res2.success).toBe(false);
  });

  it("allows optional socialHandle and referralCode to be empty", () => {
    const res = ambassadorApplicationSchema.safeParse({
      ...validPayload,
      socialHandle: "",
      referralCode: "",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.socialHandle).toBe("");
      expect(res.data.referralCode).toBe("");
    }
  });
});

describe("Ambassadors — Rate Limit Logic", () => {
  it("allows requests within hourly and daily bounds", () => {
    expect(checkAmbassadorRateLimits(0, 0).allowed).toBe(true);
    expect(checkAmbassadorRateLimits(9, 39).allowed).toBe(true);
  });

  it("blocks requests when hourly limit of 10 is reached", () => {
    const res = checkAmbassadorRateLimits(10, 20);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("hour");
  });

  it("blocks requests when daily limit of 40 is reached", () => {
    const res = checkAmbassadorRateLimits(2, 40);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Daily");
  });
});

describe("Ambassadors — Salted IP Hashing", () => {
  it("generates deterministic 64-character SHA-256 hex string", () => {
    const hash1 = hashClientIp("192.168.1.1", "test_salt");
    const hash2 = hashClientIp("192.168.1.1", "test_salt");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("falls back to hashing 'unknown' when IP is empty or undefined", () => {
    const hashEmpty = hashClientIp("", "test_salt");
    const hashNull = hashClientIp(null, "test_salt");
    const hashUnknown = hashClientIp("unknown", "test_salt");
    expect(hashEmpty).toBe(hashUnknown);
    expect(hashNull).toBe(hashUnknown);
    expect(hashEmpty).toHaveLength(64);
  });

  it("produces different hashes for different salts", () => {
    const hashA = hashClientIp("10.0.0.1", "salt_a");
    const hashB = hashClientIp("10.0.0.1", "salt_b");
    expect(hashA).not.toBe(hashB);
  });
});

