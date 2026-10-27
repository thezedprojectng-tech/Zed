export type MarketCategory =
  | "design-and-creative"
  | "tech-and-development"
  | "tutoring-and-lessons"
  | "writing-and-translation"
  | "photography-and-video"
  | "fashion-and-beauty-services"
  | "repairs-and-maintenance"
  | "errands-and-delivery"
  | "events-and-entertainment"
  | "business-and-admin"
  | "other-services";

export type MarketCondition = "new" | "used" | "na";

export type MarketStatus = "active" | "sold" | "removed";

export type MarketReportReason = "scam" | "prohibited" | "duplicate" | "other";

export interface MarketListing {
  id: string;
  seller_id: string;
  seller_name_masked: string;
  title: string;
  description: string;
  category: MarketCategory;
  price_ngn: number | null;
  condition: MarketCondition;
  location: string;
  image_paths: string[];
  status: MarketStatus;
  removed_reason: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  report_count: number;
  seller_verified: boolean;
}

export interface MarketListingContact {
  listing_id: string;
  whatsapp: string;
  created_at: string;
  updated_at: string;
}

export interface MarketReport {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: MarketReportReason;
  note: string | null;
  created_at: string;
  reporter_is_verified?: boolean;
}

export interface MarketListingWithReports extends MarketListing {
  reports?: MarketReport[];
}

export interface MarketFilterParams {
  search?: string;
  category?: MarketCategory | "all";
  status?: MarketStatus | "all";
  page?: number;
  limit?: number;
}
