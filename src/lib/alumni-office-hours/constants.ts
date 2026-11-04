export const ALLOWED_CONTACT_DOMAINS = [
  "linkedin.com",
  "www.linkedin.com",
  "x.com",
  "twitter.com",
  "www.twitter.com",
] as const;

export type AllowedContactDomain = (typeof ALLOWED_CONTACT_DOMAINS)[number];

export const ALUMNI_APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "approved",
  "declined",
] as const;

export type AlumniApplicationStatus = (typeof ALUMNI_APPLICATION_STATUSES)[number];

export const ALUMNI_PROFILE_STATUSES = [
  "published",
  "unpublished",
] as const;

export type AlumniProfileStatus = (typeof ALUMNI_PROFILE_STATUSES)[number];

export const DISCLAIMER_TEXT =
  "Profiles are reviewed by the Zed team, but conversations happen outside Zed. Mentorship here is free. Never pay anyone, and never share money details or sensitive personal information.";

export const COMMON_ALUMNI_FIELDS = [
  "Software Engineering",
  "Product & Design",
  "Data & AI",
  "Finance & Banking",
  "Healthcare & Medicine",
  "Business & Strategy",
  "Marketing & Communications",
  "Law & Policy",
  "Engineering & Energy",
  "Other",
] as const;

