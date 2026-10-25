import { CAREERS_WHATSAPP, jobs, type Job } from "@/data/careers";

export interface DepartmentOption {
  label: string;
  value: string;
}

/**
 * Find a job by its unique URL slug.
 */
export function getJobBySlug(slug: string, jobsList: Job[] = jobs): Job | undefined {
  return jobsList.find((j) => j.slug === slug);
}

/**
 * Build department filter options dynamically from existing jobs.
 * Always includes "All Roles" (value: "all") as the first option,
 * followed by the distinct departments found in jobsList.
 */
export function getDepartments(jobsList: Job[] = jobs): DepartmentOption[] {
  const departments = Array.from(new Set(jobsList.map((j) => j.department).filter(Boolean)));
  return [
    { label: "All Roles", value: "all" },
    ...departments.map((dept) => ({ label: dept, value: dept })),
  ];
}

/**
 * Generate a direct WhatsApp link pre-filled with an application message.
 *
 * If a job is provided: "Hi, I'm interested in the {job.title} role at Zed."
 * Otherwise (general banner): "Hi, I'd like to work with Zed. Here is how I can help:"
 */
export function buildApplyUrl(job?: Job): string {
  const message = job
    ? `Hi, I'm interested in the ${job.title} role at Zed.`
    : "Hi, I'd like to work with Zed. Here is how I can help:";

  return `https://wa.me/${CAREERS_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
