export const INTERNSHIP_FIELDS = [
  { value: "tech", label: "Technology & Software" },
  { value: "design", label: "Product & Graphic Design" },
  { value: "marketing", label: "Marketing & Growth" },
  { value: "finance", label: "Finance & Accounting" },
  { value: "engineering", label: "Engineering & Hardware" },
  { value: "media", label: "Media, Content & Journalism" },
  { value: "healthcare", label: "Healthcare & Life Sciences" },
  { value: "business", label: "Business & Operations" },
  { value: "legal", label: "Legal & Compliance" },
  { value: "other", label: "Other Disciplines" },
] as const;

export const INTERNSHIP_WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

export const INTERNSHIP_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "siwes", label: "SIWES (Students Industrial Work Experience)" },
  { value: "industrial-training", label: "Industrial Training (IT)" },
  { value: "graduate-trainee", label: "Graduate Trainee" },
  { value: "fellowship", label: "Fellowship" },
  { value: "volunteer", label: "Volunteer Role" },
  { value: "other", label: "Other" },
] as const;

export const INTERNSHIP_PAID_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "stipend", label: "Monthly Stipend" },
  { value: "unpaid", label: "Unpaid" },
  { value: "unknown", label: "Not Disclosed" },
] as const;

export const SUSPICIOUS_FEE_PATTERNS = [
  /\b(registration\s+fee|application\s+fee|processing\s+fee|form\s+fee)\b/i,
  /\b(send\s+money|pay\s+to|pay\s+for|bank\s+transfer|acceptance\s+fee)\b/i,
  /\b(deposit|training\s+fee|pay\s+upfront|interview\s+fee)\b/i,
  /\b(admission\s+fee|charge|fee\s+required)\b/i,
];

export function detectSuspiciousFeeWords(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const pattern of SUSPICIOUS_FEE_PATTERNS) {
    const match = text.match(pattern);
    if (match && !found.includes(match[0].toLowerCase())) {
      found.push(match[0].toLowerCase());
    }
  }
  return found;
}
