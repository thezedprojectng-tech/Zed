import type { CampusHubStatus, NigerianState } from "./constants";

export type { CampusHubStatus, NigerianState };

export interface CampusHub {
  id: string;
  slug: string;
  name: string;
  state: string;
  summary: string | null;
  clearance_guide: string | null;
  hostel_guide: string | null;
  departments_guide: string | null;
  status: CampusHubStatus;
  published_at: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

