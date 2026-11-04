import type { AlumniApplicationStatus, AlumniProfileStatus } from "./constants";

export interface AlumniApplicationRow {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  graduation_year: number;
  institution: string;
  field: string;
  occupation: string;
  bio: string;
  topics: string;
  availability: string;
  contact_url: string;
  consent_public: boolean;
  ip_hash: string;
  status: AlumniApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface AlumniProfileRow {
  id: string;
  application_id: string | null;
  display_name: string;
  graduation_year: number;
  institution: string;
  field: string;
  occupation: string;
  bio: string;
  topics: string;
  availability: string;
  contact_url: string;
  status: AlumniProfileStatus;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitAlumniApplicationResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

