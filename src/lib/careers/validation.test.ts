import { describe, it, expect } from "vitest";
import {
  slugify,
  parseLines,
  formatLines,
  careerRoleSchema,
  mapAdminCareerError,
} from "./validation";

describe("Careers validation & helpers", () => {
  describe("slugify", () => {
    it("converts mixed case strings to lowercase with hyphens", () => {
      expect(slugify("Senior Frontend Engineer")).toBe("senior-frontend-engineer");
    });

    it("strips special characters, punctuation and extra spaces", () => {
      expect(slugify("  Lead & Principal Architect (Mobile / Web)!! ")).toBe(
        "lead-principal-architect-mobile-web"
      );
    });

    it("removes leading and trailing hyphens", () => {
      expect(slugify("---product-manager---")).toBe("product-manager");
    });

    it("handles already slugified strings", () => {
      expect(slugify("growth-marketing-lead")).toBe("growth-marketing-lead");
    });

    it("truncates to at most 80 characters", () => {
      const longTitle = "a".repeat(100);
      const slug = slugify(longTitle);
      expect(slug.length).toBeLessThanOrEqual(80);
    });
  });

  describe("parseLines & formatLines", () => {
    it("parses multiline strings into trimmed arrays, dropping empty lines", () => {
      const input = "  Item 1  \n\n  Item 2\r\n  Item 3  \n   ";
      expect(parseLines(input)).toEqual(["Item 1", "Item 2", "Item 3"]);
    });

    it("returns empty array for empty or null input", () => {
      expect(parseLines("")).toEqual([]);
      expect(parseLines(null)).toEqual([]);
      expect(parseLines(undefined)).toEqual([]);
    });

    it("formats array back to newline separated string", () => {
      expect(formatLines(["Line 1", "Line 2"])).toBe("Line 1\nLine 2");
      expect(formatLines([])).toBe("");
      expect(formatLines(null)).toBe("");
    });
  });

  describe("careerRoleSchema", () => {
    const validRole = {
      title: "Senior Product Designer",
      slug: "senior-product-designer",
      department: "Design",
      location: "Remote" as const,
      type: "Full-time" as const,
      featured: true,
      summary: "Lead end-to-end user research and product design flows.",
      about: ["We are building for Nigerian youth."],
      responsibilities: ["Design intuitive flows", "Work with frontend devs"],
      requirements: ["3+ years experience with Figma", "Portfolio demonstrating shipped products"],
      nice_to_have: ["Experience with design systems"],
    };

    it("successfully validates a valid role payload", () => {
      const result = careerRoleSchema.safeParse(validRole);
      expect(result.success).toBe(true);
    });

    it("rejects invalid slug formats", () => {
      const invalidSlugs = [
        "Senior-Designer", // Uppercase
        "senior_designer", // Underscores
        "senior--designer", // Double hyphens
        "-senior-designer", // Leading hyphen
        "senior-designer-", // Trailing hyphen
        "ab", // Under 3 chars
      ];

      for (const s of invalidSlugs) {
        const result = careerRoleSchema.safeParse({ ...validRole, slug: s });
        expect(result.success).toBe(false);
      }
    });

    it("enforces title length constraints (3-120 chars)", () => {
      expect(careerRoleSchema.safeParse({ ...validRole, title: "ab" }).success).toBe(false);
      expect(careerRoleSchema.safeParse({ ...validRole, title: "a".repeat(121) }).success).toBe(false);
    });

    it("enforces department length constraints (2-40 chars)", () => {
      expect(careerRoleSchema.safeParse({ ...validRole, department: "a" }).success).toBe(false);
      expect(careerRoleSchema.safeParse({ ...validRole, department: "a".repeat(41) }).success).toBe(false);
    });

    it("enforces valid location and type enums", () => {
      expect(careerRoleSchema.safeParse({ ...validRole, location: "Everywhere" }).success).toBe(false);
      expect(careerRoleSchema.safeParse({ ...validRole, type: "Hourly" }).success).toBe(false);
    });

    it("enforces array length limits", () => {
      // About: max 5
      expect(
        careerRoleSchema.safeParse({
          ...validRole,
          about: Array.from({ length: 6 }, (_, i) => `Paragraph item ${i + 1}`),
        }).success
      ).toBe(false);

      // Responsibilities: max 15
      expect(
        careerRoleSchema.safeParse({
          ...validRole,
          responsibilities: Array.from({ length: 16 }, (_, i) => `Responsibility ${i + 1}`),
        }).success
      ).toBe(false);

      // Requirements: max 15
      expect(
        careerRoleSchema.safeParse({
          ...validRole,
          requirements: Array.from({ length: 16 }, (_, i) => `Requirement ${i + 1}`),
        }).success
      ).toBe(false);

      // Nice to have: max 10
      expect(
        careerRoleSchema.safeParse({
          ...validRole,
          nice_to_have: Array.from({ length: 11 }, (_, i) => `Nice to have ${i + 1}`),
        }).success
      ).toBe(false);
    });

    it("enforces item string length (3-300 chars)", () => {
      expect(
        careerRoleSchema.safeParse({
          ...validRole,
          responsibilities: ["ab"],
        }).success
      ).toBe(false);

      expect(
        careerRoleSchema.safeParse({
          ...validRole,
          responsibilities: ["a".repeat(301)],
        }).success
      ).toBe(false);
    });
  });

  describe("mapAdminCareerError", () => {
    it("returns friendly message for duplicate slug errors", () => {
      expect(mapAdminCareerError({ code: "23505", message: "duplicate key value" })).toBe(
        "A role with this URL slug already exists. Please choose a different slug."
      );
      expect(mapAdminCareerError("A role with this slug already exists")).toBe(
        "A role with this URL slug already exists. Please choose a different slug."
      );
      expect(mapAdminCareerError("violates unique constraint career_roles_slug_key")).toBe(
        "A role with this URL slug already exists. Please choose a different slug."
      );
    });

    it("returns friendly message for slug locked errors", () => {
      expect(mapAdminCareerError("Slug cannot be changed once a role has been published")).toBe(
        "The URL slug cannot be changed once a role has been published."
      );
    });

    it("returns friendly message for missing responsibilities or requirements when publishing", () => {
      expect(
        mapAdminCareerError("A role needs at least one responsibility before it can be published")
      ).toBe("Please add at least 1 responsibility before publishing this role.");

      expect(
        mapAdminCareerError("A role needs at least one requirement before it can be published")
      ).toBe("Please add at least 1 requirement before publishing this role.");
    });

    it("returns friendly message for unauthorized errors", () => {
      expect(mapAdminCareerError("Unauthorized")).toBe(
        "You do not have permission to perform this action."
      );
    });

    it("returns fallback message for unknown errors", () => {
      expect(mapAdminCareerError("Custom server error message")).toBe(
        "Custom server error message"
      );
    });
  });
});
