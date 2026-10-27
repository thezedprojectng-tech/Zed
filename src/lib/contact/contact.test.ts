import { describe, it, expect } from "vitest";
import {
  contactMessageSchema,
  stripControlCharacters,
  type ContactSubmissionInput,
} from "./schema";
import { escapeHtml } from "./email";
import { checkContactRateLimits, hashClientIp } from "./rate-limit";

describe("Contact Message Schema Validation", () => {
  const validBaseInput: ContactSubmissionInput = {
    name: "Zayd Tahir",
    email: "zayd@example.com",
    phone: "+2348012345678",
    subject: "Inquiry about Zed Skill track",
    message: "Hello team, I would like to inquire about enrolling in the civic development tracks.",
  };

  it("passes for a valid complete submission", () => {
    const result = contactMessageSchema.safeParse(validBaseInput);
    expect(result.success).toBe(true);
  });

  it("passes without optional phone", () => {
    const result = contactMessageSchema.safeParse({
      name: "Zayd Tahir",
      email: "zayd@example.com",
      subject: "General Inquiry",
      message: "This is a valid inquiry message with more than ten characters.",
    });
    expect(result.success).toBe(true);
  });

  it("fails if name is less than 2 characters", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      name: "Z",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 2 characters");
    }
  });

  it("fails if name exceeds 80 characters", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      name: "A".repeat(81),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("cannot exceed 80 characters");
    }
  });

  it("fails if email is invalid", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("fails if subject is less than 3 characters", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      subject: "Hi",
    });
    expect(result.success).toBe(false);
  });

  it("fails if subject exceeds 120 characters", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      subject: "S".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it("fails if message is less than 10 characters", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      message: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("fails if message exceeds 2000 characters", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      message: "M".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("fails if phone exceeds 30 characters", () => {
    const result = contactMessageSchema.safeParse({
      ...validBaseInput,
      phone: "+1234567890123456789012345678901", // 31 chars
    });
    expect(result.success).toBe(false);
  });

  it("strips control characters properly", () => {
    const dirty = "Hello\x00\x08World\x1F!\r\nSafe\tTab";
    const cleaned = stripControlCharacters(dirty);
    expect(cleaned).toBe("HelloWorld!\r\nSafe\tTab");

    const parsed = contactMessageSchema.safeParse({
      ...validBaseInput,
      name: "Zayd\x00\x07Tahir",
      subject: "Clean\x1BSubject",
      message: "Clean\x0CMessage with enough length to pass validation.",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("ZaydTahir");
      expect(parsed.data.subject).toBe("CleanSubject");
      expect(parsed.data.message).toBe("CleanMessage with enough length to pass validation.");
    }
  });
});

describe("Contact Rate Limiting", () => {
  it("allows requests below hourly and daily thresholds", () => {
    const result = checkContactRateLimits(2, 5);
    expect(result.allowed).toBe(true);
  });

  it("blocks requests when hourly limit (5) is reached", () => {
    const result = checkContactRateLimits(5, 5);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Too many messages sent recently");
  });

  it("blocks requests when daily limit (20) is reached", () => {
    const result = checkContactRateLimits(3, 20);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Daily contact submission limit reached");
  });
});

describe("Client IP Hashing", () => {
  it("produces deterministic 64-char SHA-256 hash without storing raw IP", () => {
    const salt = "test-salt-12345";
    const ip = "192.168.1.100";
    const hash1 = hashClientIp(ip, salt);
    const hash2 = hashClientIp(ip, salt);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
    expect(hash1).not.toContain(ip);
  });
});

describe("HTML Escaping", () => {
  it("escapes special characters to prevent HTML injection", () => {
    const raw = '<script>alert("xss")</script> & \'test\'';
    const escaped = escapeHtml(raw);
    expect(escaped).toBe("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#039;test&#039;");
  });
});
