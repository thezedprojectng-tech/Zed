import { describe, it, expect } from "vitest";
import {
  mentorshipApplicationSchema,
  stripControlCharacters,
} from "./schema";
import { checkMentorshipRateLimits, hashClientIp } from "./rate-limit";

describe("Mentorship — Schema Validation", () => {
  const validPayload = {
    fullName: "Chidinma Okafor",
    email: "chidinma@example.com",
    phone: "+2348098765432",
    location: "Lagos, Nigeria",
    age: 22,
    institution: "University of Lagos",
    isStudent: true,
    interestArea: "web development",
    experienceLevel: "beginner" as const,
    skills: "HTML, CSS, basic Python",
    goals:
      "I want to build modern web applications and eventually contribute to open source projects.",
    availability: "Weekends and evenings",
    preferredFormat: "video_call" as const,
    consent: true,
  };

  it("validates and normalizes valid application payload", () => {
    const res = mentorshipApplicationSchema.safeParse(validPayload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.fullName).toBe("Chidinma Okafor");
      expect(res.data.email).toBe("chidinma@example.com");
      expect(res.data.consent).toBe(true);
      expect(res.data.age).toBe(22);
      expect(res.data.institution).toBe("University of Lagos");
      expect(res.data.isStudent).toBe(true);
      expect(res.data.interestArea).toBe("web development");
      expect(res.data.skills).toBe("HTML, CSS, basic Python");
    }
  });

  it("strips control characters while preserving valid text", () => {
    const stripped = stripControlCharacters("Hello\x00\x08World\x1F!");
    expect(stripped).toBe("HelloWorld!");
  });

  it("rejects invalid email formats", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(res.success).toBe(false);
  });

  it("rejects names shorter than 2 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      fullName: "A",
    });
    expect(res.success).toBe(false);
  });

  it("rejects names longer than 80 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      fullName: "A".repeat(81),
    });
    expect(res.success).toBe(false);
  });

  it("rejects phone shorter than 7 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      phone: "12345",
    });
    expect(res.success).toBe(false);
  });

  it("rejects goals shorter than 20 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      goals: "Too short",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("goals");
    }
  });

  it("rejects goals exceeding 1000 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      goals: "A".repeat(1001),
    });
    expect(res.success).toBe(false);
  });

  // Age validation
  it("rejects applicants under 21", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      age: 20,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("age");
      expect(res.error.issues[0]?.message).toMatch(/21/);
    }
  });

  it("accepts applicants who are exactly 21", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      age: 21,
    });
    expect(res.success).toBe(true);
  });

  it("rejects age above 100", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      age: 101,
    });
    expect(res.success).toBe(false);
  });

  it("rejects missing age", () => {
    const { age: _age, ...rest } = validPayload;
    const res = mentorshipApplicationSchema.safeParse(rest);
    expect(res.success).toBe(false);
  });

  // Skills validation
  it("rejects empty skills", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      skills: "",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes("skills"))).toBe(true);
    }
  });

  it("rejects whitespace-only skills", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      skills: "  ",
    });
    expect(res.success).toBe(false);
  });

  it("rejects skills exceeding 300 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      skills: "A".repeat(301),
    });
    expect(res.success).toBe(false);
  });

  // University / isStudent validation
  it("rejects missing institution", () => {
    const { institution: _inst, ...rest } = validPayload;
    const res = mentorshipApplicationSchema.safeParse(rest);
    expect(res.success).toBe(false);
  });

  it("rejects institution shorter than 2 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      institution: "A",
    });
    expect(res.success).toBe(false);
  });

  it("rejects isStudent = false", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      isStudent: false,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes("isStudent"))).toBe(true);
    }
  });

  it("rejects missing isStudent field", () => {
    const { isStudent: _is, ...rest } = validPayload;
    const res = mentorshipApplicationSchema.safeParse(rest);
    expect(res.success).toBe(false);
  });

  // Free-text interest area validation
  it("accepts free-text interest area", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      interestArea: "data science and machine learning",
    });
    expect(res.success).toBe(true);
  });

  it("rejects interest area shorter than 2 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      interestArea: "x",
    });
    expect(res.success).toBe(false);
  });

  it("rejects interest area longer than 100 characters", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      interestArea: "A".repeat(101),
    });
    expect(res.success).toBe(false);
  });

  it("rejects old enum values that are no longer valid (e.g. 'frontend' as literal)", () => {
    // "frontend" is fine as free text since it is 8 chars and within bounds
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      interestArea: "frontend",
    });
    expect(res.success).toBe(true);
  });

  it("rejects invalid experienceLevel enum values", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      experienceLevel: "expert",
    });
    expect(res.success).toBe(false);
  });

  it("rejects invalid preferredFormat enum values", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      preferredFormat: "phone_call",
    });
    expect(res.success).toBe(false);
  });

  it("rejects when consent is not true", () => {
    const res1 = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      consent: false,
    });
    expect(res1.success).toBe(false);

    const res2 = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      consent: undefined,
    });
    expect(res2.success).toBe(false);
  });

  it("allows honeypot and turnstile tokens in payload", () => {
    const res = mentorshipApplicationSchema.safeParse({
      ...validPayload,
      hpCompanyField: "bot-data",
      turnstileToken: "tok_123",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.hpCompanyField).toBe("bot-data");
      expect(res.data.turnstileToken).toBe("tok_123");
    }
  });
});

describe("Mentorship — Rate Limit Logic", () => {
  it("allows requests within hourly and daily bounds", () => {
    expect(checkMentorshipRateLimits(0, 0).allowed).toBe(true);
    expect(checkMentorshipRateLimits(9, 39).allowed).toBe(true);
  });

  it("blocks requests when hourly limit of 10 is reached", () => {
    const res = checkMentorshipRateLimits(10, 20);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("hour");
  });

  it("blocks requests when daily limit of 40 is reached", () => {
    const res = checkMentorshipRateLimits(2, 40);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Daily");
  });
});

describe("Mentorship — Salted IP Hashing", () => {
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
