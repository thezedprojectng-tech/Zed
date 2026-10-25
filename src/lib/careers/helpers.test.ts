import { describe, it, expect } from "vitest";
import { getJobBySlug, getDepartments, buildApplyUrl } from "./helpers";
import { CAREERS_WHATSAPP, mapRoleRowToJob, type Job, type CareerRoleRow } from "@/data/careers";

// Sample test role (used strictly for unit testing, never in production data)
const sampleJob: Job = {
  slug: "lead-frontend-engineer",
  title: "Lead Frontend Engineer",
  department: "Engineering",
  location: "Remote",
  type: "Full-time",
  featured: true,
  summary: "Help architect and scale our public web experience.",
  about: ["You will shape our web platform."],
  responsibilities: ["Develop responsive UI components."],
  requirements: ["3+ years React experience."],
  niceToHave: ["Familiarity with Next.js App Router."],
  postedAt: "2026-10-24",
};

const sampleJobTwo: Job = {
  slug: "product-operations-specialist",
  title: "Product Operations Specialist",
  department: "Operations",
  location: "Hybrid",
  type: "Full-time",
  summary: "Coordinate product rollouts and user feedback loops.",
  about: ["Work with user communities."],
  responsibilities: ["Synthesize user feedback."],
  requirements: ["Excellent written and verbal communication."],
  postedAt: "2026-10-24",
};

describe("Careers helpers", () => {
  describe("getJobBySlug", () => {
    it("returns undefined when no roles exist or slug is not found", () => {
      expect(getJobBySlug("non-existent-slug")).toBeUndefined();
    });

    it("finds a job by its slug when passed a jobs array", () => {
      const found = getJobBySlug("lead-frontend-engineer", [sampleJob, sampleJobTwo]);
      expect(found).toBeDefined();
      expect(found?.title).toBe("Lead Frontend Engineer");
      expect(found?.department).toBe("Engineering");
    });

    it("returns undefined if slug does not match any job in the list", () => {
      const found = getJobBySlug("unknown-role", [sampleJob]);
      expect(found).toBeUndefined();
    });
  });

  describe("getDepartments", () => {
    it("returns only 'All Roles' when the jobs list is empty", () => {
      const depts = getDepartments([]);
      expect(depts).toEqual([{ label: "All Roles", value: "all" }]);
    });

    it("builds departments dynamically from jobs and deduplicates them without hardcoding", () => {
      const duplicateDeptJob: Job = {
        ...sampleJob,
        slug: "frontend-intern",
        title: "Frontend Intern",
        department: "Engineering",
      };

      const depts = getDepartments([sampleJob, sampleJobTwo, duplicateDeptJob]);
      expect(depts).toEqual([
        { label: "All Roles", value: "all" },
        { label: "Engineering", value: "Engineering" },
        { label: "Operations", value: "Operations" },
      ]);
    });
  });

  describe("buildApplyUrl", () => {
    it("contains the correct international WhatsApp number", () => {
      expect(CAREERS_WHATSAPP).toBe("2347046094344");
      const url = buildApplyUrl();
      expect(url).toContain("https://wa.me/2347046094344");
    });

    it("formats message for general applications without a specific job", () => {
      const url = buildApplyUrl();
      const expectedText = encodeURIComponent(
        "Hi, I'd like to work with Zed. Here is how I can help:"
      );
      expect(url).toBe(`https://wa.me/2347046094344?text=${expectedText}`);
    });

    it("formats message for a specific job with title properly encoded", () => {
      const url = buildApplyUrl(sampleJob);
      const expectedText = encodeURIComponent(
        "Hi, I'm interested in the Lead Frontend Engineer role at Zed."
      );
      expect(url).toBe(`https://wa.me/2347046094344?text=${expectedText}`);
    });

    it("properly encodes special characters and punctuation", () => {
      const jobWithSymbols: Job = {
        ...sampleJob,
        title: "C&S / Dev & Ops Lead (Gen-Z)",
      };
      const url = buildApplyUrl(jobWithSymbols);
      expect(url).not.toContain(" ");
      expect(url).not.toContain("&"); // only the query param delimiter &text=
      const textParam = new URL(url).searchParams.get("text");
      expect(textParam).toBe(
        "Hi, I'm interested in the C&S / Dev & Ops Lead (Gen-Z) role at Zed."
      );
    });
  });

  describe("mapRoleRowToJob", () => {
    it("maps database row fields into a public Job structure", () => {
      const mockRow: CareerRoleRow = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        slug: "data-analyst",
        title: "Data Analyst",
        department: "Analytics",
        location: "Remote",
        type: "Full-time",
        featured: true,
        summary: "Analyze user behaviors and key metrics.",
        about: ["Help build data foundations."],
        responsibilities: ["Build metric dashboards"],
        requirements: ["Proficiency in SQL and Python"],
        nice_to_have: ["Experience with Supabase"],
        status: "published",
        posted_at: "2026-10-24T12:00:00Z",
        created_at: "2026-10-24T10:00:00Z",
        updated_at: "2026-10-24T12:00:00Z",
      };

      const job = mapRoleRowToJob(mockRow);
      expect(job.slug).toBe("data-analyst");
      expect(job.title).toBe("Data Analyst");
      expect(job.department).toBe("Analytics");
      expect(job.location).toBe("Remote");
      expect(job.type).toBe("Full-time");
      expect(job.featured).toBe(true);
      expect(job.summary).toBe("Analyze user behaviors and key metrics.");
      expect(job.about).toEqual(["Help build data foundations."]);
      expect(job.responsibilities).toEqual(["Build metric dashboards"]);
      expect(job.requirements).toEqual(["Proficiency in SQL and Python"]);
      expect(job.niceToHave).toEqual(["Experience with Supabase"]);
      expect(job.postedAt).toBe("2026-10-24T12:00:00Z");
    });

    it("handles null nice_to_have and fallback for posted_at", () => {
      const mockRow: CareerRoleRow = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        slug: "intern-designer",
        title: "Design Intern",
        department: "Design",
        location: "Hybrid",
        type: "Internship",
        featured: false,
        summary: "Learn and craft UI elements.",
        about: [],
        responsibilities: ["Assist senior designers"],
        requirements: ["Portfolio of Figma prototypes"],
        nice_to_have: null,
        status: "draft",
        posted_at: null,
        created_at: "2026-10-24T08:00:00Z",
        updated_at: "2026-10-24T08:00:00Z",
      };

      const job = mapRoleRowToJob(mockRow);
      expect(job.niceToHave).toBeUndefined();
      expect(job.postedAt).toBe("2026-10-24T08:00:00Z");
    });
  });
});
