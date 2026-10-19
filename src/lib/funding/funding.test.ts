import { describe, it, expect } from "vitest";
import {
  fundingSubmissionSchema,
  type FundingSubmissionInput,
} from "./schema";
import { escapeHtml, formatNaira } from "./email";
import { checkRateLimits, hashClientIp } from "./rate-limit";

describe("Funding Submission Schema Validation", () => {
  const validBaseInput: FundingSubmissionInput = {
    fullName: "Chinedu Okafor",
    email: "chinedu@example.com",
    phone: "+2348031234567",
    projectTitle: "SolarAgri Cold Storage",
    category: "Clean Energy & Climate",
    stage: "prototype",
    fundingNeededNgn: 1500000,
    summary:
      "A distributed network of solar-powered cold hubs for rural tomato farmers in Kano to reduce post-harvest losses.",
    problem:
      "Smallholder farmers lose over 40% of perishable harvests before reaching urban markets due to lack of local refrigeration.",
    plan:
      "Deploy 3 pilot solar cooling units, procure lithium batteries, and onboard the first cooperative of 40 farmers.",
    link: "https://solaragri.example.com",
    consent: true,
  };

  it("passes for a valid complete submission", () => {
    const result = fundingSubmissionSchema.safeParse(validBaseInput);
    expect(result.success).toBe(true);
  });

  it("fails if full name is less than 2 characters", () => {
    const result = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      fullName: "C",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 2 characters");
    }
  });

  it("fails if email is invalid", () => {
    const result = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("fails if project title is too short", () => {
    const result = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      projectTitle: "Hi",
    });
    expect(result.success).toBe(false);
  });

  it("fails if stage is not one of idea, prototype, launched", () => {
    const result = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      stage: "unicorn",
    });
    expect(result.success).toBe(false);
  });

  it("fails if fundingNeededNgn is zero or negative", () => {
    const zeroRes = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      fundingNeededNgn: 0,
    });
    expect(zeroRes.success).toBe(false);

    const negRes = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      fundingNeededNgn: -5000,
    });
    expect(negRes.success).toBe(false);
  });

  it("fails if summary, problem, or plan is under 20 characters", () => {
    const shortSummary = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      summary: "Too short text.",
    });
    expect(shortSummary.success).toBe(false);

    const shortProblem = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      problem: "Brief issue.",
    });
    expect(shortProblem.success).toBe(false);

    const shortPlan = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      plan: "Buy things.",
    });
    expect(shortPlan.success).toBe(false);
  });

  it("validates optional link format", () => {
    const badLink = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      link: "ftp://invalid-protocol.com",
    });
    expect(badLink.success).toBe(false);

    const emptyLink = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      link: "",
    });
    expect(emptyLink.success).toBe(true);

    const undefinedLink = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      link: undefined,
    });
    expect(undefinedLink.success).toBe(true);
  });

  it("fails if consent checkbox is not checked", () => {
    const result = fundingSubmissionSchema.safeParse({
      ...validBaseInput,
      consent: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("Funding Rate Limiting Logic", () => {
  it("allows requests within thresholds", () => {
    expect(checkRateLimits(0, 0)).toEqual({ allowed: true });
    expect(checkRateLimits(2, 4)).toEqual({ allowed: true });
  });

  it("blocks requests when email threshold of 3 per 24h is reached", () => {
    const check = checkRateLimits(3, 1);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("Too many submissions from this email");
  });

  it("blocks requests when IP threshold of 5 per 24h is reached", () => {
    const check = checkRateLimits(1, 5);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("Too many submissions from your connection");
  });

  it("hashes IP with salt deterministically to a 64-character hex string", () => {
    const ip = "197.210.55.12";
    const salt = "test-salt-secret-key-12345";
    const hash1 = hashClientIp(ip, salt);
    const hash2 = hashClientIp(ip, salt);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);

    const differentHash = hashClientIp(ip, "different-salt");
    expect(hash1).not.toBe(differentHash);
  });
});

describe("Email HTML Escaping & Formatting", () => {
  it("escapes dangerous HTML characters to prevent XSS and email injection", () => {
    const malicious = '<script>alert("XSS")</script>&<img src=\'x\' onerror=alert(1)>';
    const escaped = escapeHtml(malicious);

    expect(escaped).not.toContain("<script>");
    expect(escaped).not.toContain("</script>");
    expect(escaped).toContain("&lt;script&gt;");
    expect(escaped).toContain("&amp;");
    expect(escaped).toContain("&quot;XSS&quot;");
    expect(escaped).toContain("&#039;x&#039;");
  });

  it("leaves safe plain text unaffected", () => {
    const safe = "Building modern solar cold storage for Nigerian farmers.";
    expect(escapeHtml(safe)).toBe(safe);
  });

  it("formats naira currency amounts with proper currency symbol", () => {
    const formatted = formatNaira(500000);
    expect(formatted).toContain("500,000");
  });
});
