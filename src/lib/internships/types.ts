export type InternshipWorkMode = "remote" | "onsite" | "hybrid";

export type InternshipType =
  | "internship"
  | "siwes"
  | "industrial-training"
  | "graduate-trainee"
  | "volunteer"
  | "fellowship"
  | "other";

export type InternshipPaidStatus = "paid" | "unpaid" | "stipend" | "unknown";

export type InternshipStatus = "pending" | "published" | "rejected" | "expired";

export interface Internship {
  id: string;
  title: string;
  organization: string;
  location: string;
  work_mode: InternshipWorkMode;
  field: string;
  type: InternshipType;
  paid_status: InternshipPaidStatus;
  description: string;
  eligibility?: string | null;
  apply_url?: string | null;
  apply_email?: string | null;
  deadline?: string | null;
  status: InternshipStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyInternshipSubmission {
  id: string;
  title: string;
  organization: string;
  location: string;
  work_mode: InternshipWorkMode;
  field: string;
  type: InternshipType;
  paid_status: InternshipPaidStatus;
  deadline?: string | null;
  status: InternshipStatus;
  created_at: string;
  published_at?: string | null;
  rejection_reason?: string | null;
}

export interface AdminInternshipWithReview extends Internship {
  submitted_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  submitter_email?: string | null;
  submitter_name?: string | null;
}

export interface InternshipFilterState {
  search: string;
  field: string;
  work_mode: string;
  paid_status: string;
  type: string;
  location: string;
}
