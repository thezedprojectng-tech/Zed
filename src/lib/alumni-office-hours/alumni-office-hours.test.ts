import { describe, it, expect } from "vitest";
import {
  alumniApplicationSchema,
  adminPublishAlumniSchema,
  stripControlCharacters,
  isValidContactUrl,
} from "./schema";
import { checkAlumniRateLimits, hashClientIp } from "./rate-limit";

describe("Alumni Office Hours — Schema & Validation", () => {
  const currentYear = new Date().getFullYear();

  const validPayload = {
    fullName: "Adebayo Olawale",
    email: "adebayo.olawale@example.com",
    graduationYear: 2018,
    institution: "University of Ibadan",
    field: "Software Engineering",
    occupation: "Senior Backend Engineer at Paystack",
    bio: "Graduated with Computer Science honors. Working on distributed payment gateways and fintech APIs for 6+ years. Happy to help with resume reviews, system design, and software interview prep.",
    topics: "System design, Go/Node.js, transitioning from school to industry, technical interview prep",
    availability: "Available for 1 hour on Saturdays, twice a month via LinkedIn messaging or quick call",
    contactUrl: "https://www.linkedin.com/in/adebayo-olawale",
    consentPublic: true,
  };

  it("validates and normalizes valid alumni application payload", () => {
    const res = alumniApplicationSchema.safeParse(validPayload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.fullName).toBe("Adebayo Olawale");
      expect(res.data.email).toBe("adebayo.olawale@example.com");
      expect(res.data.graduationYear).toBe(2018);
      expect(res.data.institution).toBe("University of Ibadan");
      expect(res.data.field).toBe("Software Engineering");
      expect(res.data.occupation).toBe("Senior Backend Engineer at Paystack");
      expect(res.data.contactUrl).toBe("https://www.linkedin.com/in/adebayo-olawale");
      expect(res.data.consentPublic).toBe(true);
    }
  });

  it("strips control characters while preserving valid text", () => {
    const stripped = stripControlCharacters("Adebayo\x00\x08 Olawale\x1F!");
    expect(stripped).toBe("Adebayo Olawale!");
  });

  // Graduation Year Checks
  it("accepts valid graduation year in the past or current year", () => {
    const resPast = alumniApplicationSchema.safeParse({
      ...validPayload,
      graduationYear: 1995,
    });
    expect(resPast.success).toBe(true);

    const resCurrent = alumniApplicationSchema.safeParse({
      ...validPayload,
      graduationYear: currentYear,
    });
    expect(resCurrent.success).toBe(true);
  });

  it("rejects future graduation years", () => {
    const res = alumniApplicationSchema.safeParse({
      ...validPayload,
      graduationYear: currentYear + 1,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("graduationYear");
      expect(res.error.issues[0]?.message).toMatch(/cannot be in the future/i);
    }
  });

  it("rejects graduation years prior to 1970", () => {
    const res = alumniApplicationSchema.safeParse({
      ...validPayload,
      graduationYear: 1969,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("graduationYear");
    }
  });

  // Contact URL Checks
  it("accepts valid LinkedIn and X/Twitter HTTPS URLs", () => {
    const validUrls = [
      "https://linkedin.com/in/username",
      "https://www.linkedin.com/in/username",
      "https://x.com/username",
      "https://twitter.com/username",
      "https://www.twitter.com/username",
    ];

    for (const url of validUrls) {
      expect(isValidContactUrl(url)).toBe(true);
      const res = alumniApplicationSchema.safeParse({
        ...validPayload,
        contactUrl: url,
      });
      expect(res.success).toBe(true);
    }
  });

  it("rejects non-HTTPS URLs", () => {
    const httpUrls = [
      "http://linkedin.com/in/username",
      "http://x.com/username",
      "ftp://linkedin.com/in/username",
    ];
    for (const url of httpUrls) {
      expect(isValidContactUrl(url)).toBe(false);
      const res = alumniApplicationSchema.safeParse({
        ...validPayload,
        contactUrl: url,
      });
      expect(res.success).toBe(false);
    }
  });

  it("rejects disallowed domains and subdomain attacks", () => {
    const badUrls = [
      "https://facebook.com/username",
      "https://instagram.com/username",
      "https://github.com/username",
      "https://evil-linkedin.com/in/username",
      "https://linkedin.com.attacker.com/in/username",
      "https://x.com.badsite.org/user",
    ];
    for (const url of badUrls) {
      expect(isValidContactUrl(url)).toBe(false);
      const res = alumniApplicationSchema.safeParse({
        ...validPayload,
        contactUrl: url,
      });
      expect(res.success).toBe(false);
    }
  });

  it("rejects contact URL exceeding 200 characters", () => {
    const longUrl = "https://linkedin.com/in/" + "a".repeat(200);
    expect(isValidContactUrl(longUrl)).toBe(false);
    const res = alumniApplicationSchema.safeParse({
      ...validPayload,
      contactUrl: longUrl,
    });
    expect(res.success).toBe(false);
  });

  // Consent requirement
  it("rejects submission if consent is false", () => {
    const res = alumniApplicationSchema.safeParse({
      ...validPayload,
      consentPublic: false,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("consentPublic");
    }
  });

  // Bio length checks
  it("rejects bio shorter than 20 characters", () => {
    const res = alumniApplicationSchema.safeParse({
      ...validPayload,
      bio: "Too short bio",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("bio");
    }
  });

  it("rejects bio longer than 600 characters", () => {
    const res = alumniApplicationSchema.safeParse({
      ...validPayload,
      bio: "A".repeat(601),
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.path).toContain("bio");
    }
  });

  // Name length checks
  it("rejects name shorter than 2 characters or longer than 80", () => {
    const resShort = alumniApplicationSchema.safeParse({
      ...validPayload,
      fullName: "A",
    });
    expect(resShort.success).toBe(false);

    const resLong = alumniApplicationSchema.safeParse({
      ...validPayload,
      fullName: "A".repeat(81),
    });
    expect(resLong.success).toBe(false);
  });

  // Email format check
  it("rejects invalid email formats", () => {
    const res = alumniApplicationSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(res.success).toBe(false);
  });
});

describe("Alumni Office Hours — Admin Publish Schema", () => {
  const validAdminPayload = {
    applicationId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    displayName: "Adebayo Olawale",
    graduationYear: 2018,
    institution: "University of Ibadan",
    field: "Software Engineering",
    occupation: "Staff Engineer at Paystack",
    bio: "Alumnus with 6+ years building financial infrastructure in Nigeria. Ready to advise undergrads on backend systems and career navigation.",
    topics: "System design, distributed systems, tech interviewing",
    availability: "1-2 hours on weekends via LinkedIn",
    contactUrl: "https://www.linkedin.com/in/adebayo-olawale",
  };

  it("validates valid admin publish input", () => {
    const res = adminPublishAlumniSchema.safeParse(validAdminPayload);
    expect(res.success).toBe(true);
  });

  it("rejects invalid applicationId UUID", () => {
    const res = adminPublishAlumniSchema.safeParse({
      ...validAdminPayload,
      applicationId: "not-a-uuid",
    });
    expect(res.success).toBe(false);
  });
});

describe("Alumni Office Hours — Rate Limiting & Hashing", () => {
  it("hashes IP to a 64-character hex string", () => {
    const hash = hashClientIp("192.168.1.1", "test-secret-salt");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes unknown if IP is undefined or empty", () => {
    const hash1 = hashClientIp(undefined, "test-secret-salt");
    const hash2 = hashClientIp("", "test-secret-salt");
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it("allows submission when counts are below limits", () => {
    const res = checkAlumniRateLimits(0, 0);
    expect(res.allowed).toBe(true);
  });

  it("blocks submission when hourly limit (10) is reached", () => {
    const res = checkAlumniRateLimits(10, 15);
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/wait an hour/i);
  });

  it("blocks submission when daily limit (40) is reached", () => {
    const res = checkAlumniRateLimits(5, 40);
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/daily application limit/i);
  });
});

