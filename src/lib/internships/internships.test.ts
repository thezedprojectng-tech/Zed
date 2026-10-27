import { describe, it, expect } from "vitest";
import {
  submitInternshipSchema,
  adminPublishSchema,
  adminRejectSchema,
} from "./validation";
import { detectSuspiciousFeeWords } from "./constants";

describe("Internship Radar - Zod Validation", () => {
  const validBaseInput = {
    title: "Software Engineering Intern",
    organization: "Zed Technology Ltd",
    location: "Lagos, Nigeria",
    work_mode: "hybrid" as const,
    field: "tech",
    type: "internship" as const,
    paid_status: "paid" as const,
    description: "Join our frontend engineering team to build accessible, high-performance web applications for Nigerian youth.",
    eligibility: "Final-year students or recent graduates with proficiency in TypeScript and React.",
    apply_url: "https://careers.zedproject.ng/apply",
    deadline: "2030-12-31",
    feeConfirmation: true as const,
  };

  it("passes validation with all valid fields and feeConfirmation true", () => {
    const res = submitInternshipSchema.safeParse(validBaseInput);
    expect(res.success).toBe(true);
  });

  it("fails validation when feeConfirmation is false or missing", () => {
    const res1 = submitInternshipSchema.safeParse({
      ...validBaseInput,
      feeConfirmation: false,
    });
    expect(res1.success).toBe(false);

    const res2 = submitInternshipSchema.safeParse({
      ...validBaseInput,
      feeConfirmation: undefined,
    });
    expect(res2.success).toBe(false);
  });

  it("fails when neither apply_url nor apply_email is provided", () => {
    const res = submitInternshipSchema.safeParse({
      ...validBaseInput,
      apply_url: "",
      apply_email: "",
    });
    expect(res.success).toBe(false);
  });

  it("passes when only apply_email is provided", () => {
    const res = submitInternshipSchema.safeParse({
      ...validBaseInput,
      apply_url: null,
      apply_email: "recruitment@zedproject.ng",
    });
    expect(res.success).toBe(true);
  });

  it("rejects apply_url that is not https://", () => {
    const res = submitInternshipSchema.safeParse({
      ...validBaseInput,
      apply_url: "http://careers.zedproject.ng/apply",
    });
    expect(res.success).toBe(false);
  });

  it("rejects apply_url containing whitespace or credentials", () => {
    const withSpaces = submitInternshipSchema.safeParse({
      ...validBaseInput,
      apply_url: "https://careers.zedproject.ng/ apply",
    });
    expect(withSpaces.success).toBe(false);

    const withCredentials = submitInternshipSchema.safeParse({
      ...validBaseInput,
      apply_url: "https://user:password@careers.zedproject.ng/apply",
    });
    expect(withCredentials.success).toBe(false);
  });

  it("rejects apply_url exceeding 500 characters", () => {
    const longUrl = "https://careers.zedproject.ng/" + "a".repeat(501);
    const res = submitInternshipSchema.safeParse({
      ...validBaseInput,
      apply_url: longUrl,
    });
    expect(res.success).toBe(false);
  });

  it("rejects deadline in the past", () => {
    const res = submitInternshipSchema.safeParse({
      ...validBaseInput,
      deadline: "2020-01-01",
    });
    expect(res.success).toBe(false);
  });

  it("rejects title shorter than 5 chars or longer than 120 chars", () => {
    const short = submitInternshipSchema.safeParse({
      ...validBaseInput,
      title: "Dev",
    });
    expect(short.success).toBe(false);

    const long = submitInternshipSchema.safeParse({
      ...validBaseInput,
      title: "D".repeat(121),
    });
    expect(long.success).toBe(false);
  });

  it("rejects description shorter than 30 chars", () => {
    const res = submitInternshipSchema.safeParse({
      ...validBaseInput,
      description: "Too short description",
    });
    expect(res.success).toBe(false);
  });

  it("accepts all 7 valid internship types", () => {
    const validTypes = [
      "internship",
      "siwes",
      "industrial-training",
      "graduate-trainee",
      "volunteer",
      "fellowship",
      "other",
    ] as const;

    for (const t of validTypes) {
      const res = submitInternshipSchema.safeParse({
        ...validBaseInput,
        type: t,
      });
      expect(res.success).toBe(true);
    }
  });

  it("rejects invalid internship types like full-time or part-time", () => {
    const res = submitInternshipSchema.safeParse({
      ...validBaseInput,
      type: "full-time",
    });
    expect(res.success).toBe(false);
  });
});

describe("Internship Radar - Suspicious Fee Detection", () => {
  it("detects fee-related phrases in text", () => {
    expect(detectSuspiciousFeeWords("Please note a registration fee of ₦2,000 applies.")).toContain("registration fee");
    expect(detectSuspiciousFeeWords("Applicants must pay to secure their placement.")).toContain("pay to");
    expect(detectSuspiciousFeeWords("Send money to account 0123456789.")).toContain("send money");
    expect(detectSuspiciousFeeWords("A refundable deposit is required.")).toContain("deposit");
    expect(detectSuspiciousFeeWords("Mandatory training fee applies.")).toContain("training fee");
  });

  it("returns empty array when text has no suspicious fee terms", () => {
    const cleanText = "Fully funded 3-month engineering internship with monthly stipend and mentorship.";
    expect(detectSuspiciousFeeWords(cleanText)).toEqual([]);
  });
});

describe("Admin Schemas", () => {
  it("validates admin rejection schema requiring at least 5 chars reason", () => {
    const valid = adminRejectSchema.safeParse({
      id: "a0000000-0000-4000-8000-000000000001",
      reason: "Duplicate listing already exists",
    });
    expect(valid.success).toBe(true);

    const invalid = adminRejectSchema.safeParse({
      id: "a0000000-0000-4000-8000-000000000001",
      reason: "No",
    });
    expect(invalid.success).toBe(false);
  });

  it("adminPublishSchema rejects non-uuid id", () => {
    const invalid = adminPublishSchema.safeParse({
      id: "invalid-id",
      title: "Valid Title",
      organization: "Valid Org",
      location: "Lagos",
      work_mode: "remote",
      field: "tech",
      type: "internship",
      paid_status: "paid",
      description: "Valid description over thirty characters long.",
      apply_url: "https://example.com",
    });
    expect(invalid.success).toBe(false);
  });
});
