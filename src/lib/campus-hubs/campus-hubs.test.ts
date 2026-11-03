import { describe, it, expect } from "vitest";
import {
  saveCampusHubSchema,
  generateSlug,
  SLUG_REGEX,
} from "./validation";
import { NIGERIAN_STATES } from "./constants";

describe("Campus Hubs - Validation & Helpers", () => {
  const validHubInput = {
    name: "University of Lagos",
    slug: "university-of-lagos",
    state: "Lagos",
    summary: "Comprehensive student guide for the University of Lagos, Akoka campus.",
    clearance_guide: "Step 1: Obtain your JAMB admission letter. Step 2: Visit the faculty office.",
    hostel_guide: "Hostel portal opens two weeks before semester resumption.",
    departments_guide: "Faculty of Engineering, Science, Arts, Law, and Social Sciences.",
  };

  it("passes validation with all valid fields", () => {
    const res = saveCampusHubSchema.safeParse(validHubInput);
    expect(res.success).toBe(true);
  });

  it("allows optional guide sections and summary to be null or empty", () => {
    const res = saveCampusHubSchema.safeParse({
      name: "Obafemi Awolowo University",
      slug: "obafemi-awolowo-university",
      state: "Osun",
      summary: null,
      clearance_guide: null,
      hostel_guide: null,
      departments_guide: null,
    });
    expect(res.success).toBe(true);
  });

  describe("Slug Validation", () => {
    it("accepts valid lowercase alphanumeric slugs with hyphens", () => {
      expect(SLUG_REGEX.test("unilag")).toBe(true);
      expect(SLUG_REGEX.test("university-of-lagos")).toBe(true);
      expect(SLUG_REGEX.test("futa-akure-2026")).toBe(true);
    });

    it("rejects uppercase characters in slug", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        slug: "University-Of-Lagos",
      });
      // validation strips to lowercase automatically via transform, test raw regex:
      expect(SLUG_REGEX.test("University-Of-Lagos")).toBe(false);
    });

    it("rejects consecutive hyphens, leading hyphens, or trailing hyphens in slug regex", () => {
      expect(SLUG_REGEX.test("-unilag")).toBe(false);
      expect(SLUG_REGEX.test("unilag-")).toBe(false);
      expect(SLUG_REGEX.test("uni--lag")).toBe(false);
      expect(SLUG_REGEX.test("uni_lag")).toBe(false);
      expect(SLUG_REGEX.test("uni lag")).toBe(false);
    });

    it("rejects slugs shorter than 2 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        slug: "u",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.path).toContain("slug");
      }
    });

    it("rejects slugs longer than 60 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        slug: "a".repeat(61),
      });
      expect(res.success).toBe(false);
    });
  });

  describe("Name & State Validation", () => {
    it("rejects names shorter than 2 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        name: "A",
      });
      expect(res.success).toBe(false);
    });

    it("rejects names longer than 120 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        name: "A".repeat(121),
      });
      expect(res.success).toBe(false);
    });

    it("accepts all 37 valid Nigerian states (36 states + FCT)", () => {
      expect(NIGERIAN_STATES).toHaveLength(37);
      for (const st of NIGERIAN_STATES) {
        const res = saveCampusHubSchema.safeParse({
          ...validHubInput,
          state: st,
        });
        expect(res.success).toBe(true);
      }
    });

    it("rejects invalid state values", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        state: "California",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.path).toContain("state");
      }
    });
  });

  describe("Length Bounds on Content Fields", () => {
    it("rejects summary exceeding 300 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        summary: "A".repeat(301),
      });
      expect(res.success).toBe(false);
    });

    it("rejects clearance_guide exceeding 8000 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        clearance_guide: "A".repeat(8001),
      });
      expect(res.success).toBe(false);
    });

    it("rejects hostel_guide exceeding 8000 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        hostel_guide: "A".repeat(8001),
      });
      expect(res.success).toBe(false);
    });

    it("rejects departments_guide exceeding 8000 characters", () => {
      const res = saveCampusHubSchema.safeParse({
        ...validHubInput,
        departments_guide: "A".repeat(8001),
      });
      expect(res.success).toBe(false);
    });
  });

  describe("generateSlug Helper", () => {
    it("converts mixed-case names with punctuation and spaces to clean slugs", () => {
      expect(generateSlug("University of Lagos")).toBe("university-of-lagos");
      expect(generateSlug("Federal University of Technology, Akure")).toBe(
        "federal-university-of-technology-akure"
      );
      expect(generateSlug(" Ahmadu Bello University (ABU) ")).toBe(
        "ahmadu-bello-university-abu"
      );
    });

    it("trims excess hyphens and caps at 60 characters", () => {
      const longName = "A".repeat(80) + " University";
      const slug = generateSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(60);
      expect(SLUG_REGEX.test(slug)).toBe(true);
    });
  });
});

