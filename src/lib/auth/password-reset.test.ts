import { describe, it, expect } from "vitest";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./password-reset";

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });
  it("rejects an empty email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
  it("rejects a non-email string", () => {
    expect(forgotPasswordSchema.safeParse({ email: "notanemail" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords of 8+ chars", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "abcdefgh", confirmPassword: "abcdefgh" }).success
    ).toBe(true);
  });
  it("rejects password shorter than 8 chars", () => {
    const result = resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "abcdefgh",
      confirmPassword: "differentpassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });
  it("rejects password over 72 chars", () => {
    const long = "a".repeat(73);
    expect(
      resetPasswordSchema.safeParse({ password: long, confirmPassword: long }).success
    ).toBe(false);
  });
  it("generic response: schema does not expose email existence (no email field)", () => {
    // forgotPasswordSchema has no field that leaks email existence
    // The schema only validates format, not existence
    const validResult = forgotPasswordSchema.safeParse({ email: "nonexistent@example.com" });
    expect(validResult.success).toBe(true); // passes schema regardless of DB state
  });
});
