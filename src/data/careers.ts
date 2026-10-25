export type JobLocation = "Remote" | "Hybrid" | "On-site";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";
export type CareerRoleStatus = "draft" | "published" | "closed";

export interface Job {
  slug: string;
  title: string;
  department: string;
  location: JobLocation;
  type: JobType;
  featured?: boolean;
  summary: string;
  about: string[];
  responsibilities: string[];
  requirements: string[];
  niceToHave?: string[];
  postedAt: string; // ISO date format e.g. "2026-10-24"
}

export interface CareerRoleRow {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: JobLocation;
  type: JobType;
  featured: boolean;
  summary: string;
  about: string[];
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[] | null;
  status: CareerRoleStatus;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const CAREERS_WHATSAPP = "2347046094344";
export const CAREERS_WHATSAPP_DISPLAY = "+234 704 609 4344";

/**
 * Maps a database career role record to the public Job interface.
 */
export function mapRoleRowToJob(row: CareerRoleRow): Job {
  return {
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    type: row.type,
    featured: Boolean(row.featured),
    summary: row.summary,
    about: Array.isArray(row.about) ? row.about : [],
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    niceToHave:
      Array.isArray(row.nice_to_have) && row.nice_to_have.length > 0
        ? row.nice_to_have
        : undefined,
    postedAt: row.posted_at || row.created_at,
  };
}

/**
 * Fallback empty array when database is unavailable or before first query.
 */
export const jobs: Job[] = [];
