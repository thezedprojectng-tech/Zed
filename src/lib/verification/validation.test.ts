import { describe, it, expect } from "vitest";
import {
  bankVerificationSubmitSchema,
  adminReviewBankVerificationSchema,
} from "./validation";
import { NIGERIAN_BANKS, isValidBankCode, getBankName } from "./banks";

describe("Bank List & Helpers", () => {
  it("contains exactly 18 specified Nigerian banks and fintechs", () => {
    expect(NIGERIAN_BANKS.length).toBe(18);
  });

  it("validates known bank codes correctly", () => {
    expect(isValidBankCode("044")).toBe(true); // Access
    expect(isValidBankCode("058")).toBe(true); // GTBank
    expect(isValidBankCode("999992")).toBe(true); // OPay
    expect(isValidBankCode("999991")).toBe(true); // PalmPay
    expect(isValidBankCode("50211")).toBe(true); // Kuda
    expect(isValidBankCode("50515")).toBe(true); // Moniepoint
    expect(isValidBankCode("999")).toBe(false);
    expect(isValidBankCode("")).toBe(false);
  });

  it("resolves bank names from codes", () => {
    expect(getBankName("044")).toBe("Access Bank");
    expect(getBankName("058")).toBe("Guaranty Trust Bank (GTBank)");
    expect(getBankName("999992")).toBe("OPay");
    expect(getBankName("unknown")).toBeUndefined();
  });
});

describe("Bank Verification Submit Schema", () => {
  const validPayload = {
    bank_code: "058",
    account_number: "0123456789",
    account_name: "Chukwudi John Okafor",
  };

  it("accepts a valid submission", () => {
    const res = bankVerificationSubmitSchema.safeParse(validPayload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.bank_code).toBe("058");
      expect(res.data.account_number).toBe("0123456789");
      expect(res.data.account_name).toBe("Chukwudi John Okafor");
    }
  });

  it("rejects an unsupported bank code", () => {
    const res = bankVerificationSubmitSchema.safeParse({
      ...validPayload,
      bank_code: "999000",
    });
    expect(res.success).toBe(false);
  });

  it("rejects account numbers not equal to 10 digits", () => {
    // 9 digits
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_number: "123456789",
      }).success
    ).toBe(false);

    // 11 digits
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_number: "12345678901",
      }).success
    ).toBe(false);

    // Non-digits
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_number: "012345678A",
      }).success
    ).toBe(false);

    // With spaces
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_number: "01234 56789",
      }).success
    ).toBe(false);
  });

  it("rejects account names shorter than 2 chars or longer than 100 chars", () => {
    // 1 char
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_name: "A",
      }).success
    ).toBe(false);

    // empty or whitespace-only
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_name: "   ",
      }).success
    ).toBe(false);

    // 101 chars
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_name: "A".repeat(101),
      }).success
    ).toBe(false);

    // 100 chars (valid boundary)
    expect(
      bankVerificationSubmitSchema.safeParse({
        ...validPayload,
        account_name: "A".repeat(100),
      }).success
    ).toBe(true);
  });
});

describe("Admin Review Bank Verification Schema", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts approval without any reason", () => {
    const res = adminReviewBankVerificationSchema.safeParse({
      verification_id: validUuid,
      approve: true,
    });
    expect(res.success).toBe(true);
  });

  it("accepts rejection with valid reason (>= 5 chars)", () => {
    const res = adminReviewBankVerificationSchema.safeParse({
      verification_id: validUuid,
      approve: false,
      reason: "Account name does not match profile name",
    });
    expect(res.success).toBe(true);
  });

  it("rejects rejection when reason is missing or shorter than 5 chars", () => {
    // Missing reason
    const res1 = adminReviewBankVerificationSchema.safeParse({
      verification_id: validUuid,
      approve: false,
    });
    expect(res1.success).toBe(false);

    // Short reason (4 chars)
    const res2 = adminReviewBankVerificationSchema.safeParse({
      verification_id: validUuid,
      approve: false,
      reason: "nope",
    });
    expect(res2.success).toBe(false);

    // Whitespace only
    const res3 = adminReviewBankVerificationSchema.safeParse({
      verification_id: validUuid,
      approve: false,
      reason: "    ",
    });
    expect(res3.success).toBe(false);
  });

  it("rejects rejection when reason exceeds 200 chars", () => {
    const res = adminReviewBankVerificationSchema.safeParse({
      verification_id: validUuid,
      approve: false,
      reason: "X".repeat(201),
    });
    expect(res.success).toBe(false);
  });

  it("rejects invalid UUIDs", () => {
    const res = adminReviewBankVerificationSchema.safeParse({
      verification_id: "not-a-uuid",
      approve: true,
    });
    expect(res.success).toBe(false);
  });
});

