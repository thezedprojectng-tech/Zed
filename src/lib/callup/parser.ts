/**
 * Pure client-side NYSC Call-up Letter parser.
 *
 * PRIVACY: This parser is completely pure and runs exclusively in the browser.
 * Never send inputs or outputs to any external API, server, or database.
 */

export type FieldConfidence = "found" | "not found";

export interface ParsedField {
  value: string;
  confidence: FieldConfidence;
}

export interface ParsedCallUpResult {
  fullName: ParsedField;
  stateCode: ParsedField;
  callUpNumber: ParsedField;
  campState: ParsedField;
  campName: ParsedField;
  reportingDate: ParsedField;
  batch: ParsedField;
  stream: ParsedField;
}

export interface CountdownInfo {
  days: number;
  status: "future" | "today" | "past";
}

/** Standard list of Nigerian States and FCT for normalization */
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const MONTH_MAP: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

/**
 * Normalizes different date formats to ISO YYYY-MM-DD.
 * Supports:
 * - YYYY-MM-DD
 * - DD/MM/YYYY or DD-MM-YYYY
 * - DD Month YYYY (e.g. 18th November 2026, 18 Nov 2026)
 * - Month DD, YYYY (e.g. November 18, 2026)
 */
export function standardizeDate(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const clean = raw.trim().replace(/^[,\s.:-]+|[,\s.:-]+$/g, "");

  // 1. ISO YYYY-MM-DD
  const isoMatch = clean.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2})\b/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 3. DD [ordinal] Month YYYY (e.g., "18th November 2026", "5 Jan 2027")
  const wordMatch = clean.match(
    /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(20\d{2})\b/i
  );
  if (wordMatch) {
    const [, d, monthName, y] = wordMatch;
    const m = MONTH_MAP[monthName.toLowerCase()];
    if (m) {
      return `${y}-${m}-${d.padStart(2, "0")}`;
    }
  }

  // 4. Month DD [ordinal], YYYY (e.g., "November 18, 2026")
  const monthFirstMatch = clean.match(
    /\b([A-Za-z]+)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i
  );
  if (monthFirstMatch) {
    const [, monthName, d, y] = monthFirstMatch;
    const m = MONTH_MAP[monthName.toLowerCase()];
    if (m) {
      return `${y}-${m}-${d.padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Calculates days remaining from today (or reference date) until a given YYYY-MM-DD string.
 */
export function calculateDaysRemaining(
  dateStr: string,
  referenceDate: Date = new Date()
): CountdownInfo | null {
  if (!dateStr) return null;
  const iso = standardizeDate(dateStr) ?? dateStr;
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const nowMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const diffMs = targetMidnight.getTime() - nowMidnight.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return { days: 0, status: "today" };
  }
  if (days > 0) {
    return { days, status: "future" };
  }
  return { days: Math.abs(days), status: "past" };
}

/**
 * Formats a YYYY-MM-DD date string into a user-friendly format (e.g. "Tuesday, 18 Nov 2026").
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const iso = standardizeDate(dateStr) ?? dateStr;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function makeField(val: string | null | undefined): ParsedField {
  const trimmed = (val ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { value: "", confidence: "not found" };
  }
  return { value: trimmed, confidence: "found" };
}

/**
 * Pure tolerant NYSC Call-up Letter parser.
 * Extracts fields using case-insensitive label matches and regex patterns.
 * Does not throw on malformed or empty text.
 */
export function parseCallUpText(text: string): ParsedCallUpResult {
  if (!text || typeof text !== "string") {
    return {
      fullName: makeField(""),
      stateCode: makeField(""),
      callUpNumber: makeField(""),
      campState: makeField(""),
      campName: makeField(""),
      reportingDate: makeField(""),
      batch: makeField(""),
      stream: makeField(""),
    };
  }

  const cleanText = text.replace(/\r\n/g, "\n");

  // 1. Call-Up Number
  // Pattern: "Call-up No: NYSC/..." or direct pattern NYSC/...
  let callUpNumber = "";
  const callUpLabelMatch = cleanText.match(
    /(?:call[- ]?up\s*(?:no\.?|number|num)?)\s*[:=\-]\s*([A-Za-z0-9/\-_]+)/i
  );
  if (callUpLabelMatch && callUpLabelMatch[1]) {
    callUpNumber = callUpLabelMatch[1].trim();
  } else {
    const directCallUp = cleanText.match(/\b(NYSC\/[A-Za-z0-9\-_]{2,}\/\d{4}\/\d{3,8})\b/i);
    if (directCallUp && directCallUp[1]) {
      callUpNumber = directCallUp[1].trim();
    }
  }

  // 2. State Code
  // Pattern: "State Code: LA/26A/1234" or direct pattern 2 letters / 2 digits + letter / digits
  let stateCode = "";
  const stateCodeLabelMatch = cleanText.match(
    /(?:state\s*code\s*(?:no\.?|number)?)\s*[:=\-]\s*([A-Za-z0-9/]+)/i
  );
  if (stateCodeLabelMatch && stateCodeLabelMatch[1]) {
    stateCode = stateCodeLabelMatch[1].trim();
  } else {
    const directCode = cleanText.match(/\b([A-Za-z]{2}\/\d{2}[A-Za-z]\/\d{3,5})\b/);
    if (directCode && directCode[1]) {
      stateCode = directCode[1].trim();
    }
  }

  // 3. Full Name
  let fullName = "";
  // Check label patterns like "Name of Corps Member:", "Corps Member Name:", "Full Name:", "Name:"
  const nameMatch = cleanText.match(
    /(?:(?:corps\s+member\s+name|full\s*name|candidate\s*name|name\s+of\s+corps\s+member|^name))\s*[:=\-]\s*([^\r\n]+)/im
  );
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    // Exclude false positive headers like "NATIONAL YOUTH SERVICE CORPS"
    if (!/national\s+youth\s+service/i.test(candidate)) {
      fullName = candidate;
    }
  }

  // 4. Camp State / State of Deployment
  let campState = "";
  const campStateMatch = cleanText.match(
    /(?:state\s+of\s+deployment|deployment\s+state|deployed\s+state|camp\s+state)\s*[:=\-]\s*([^\r\n,]+)/i
  );
  if (campStateMatch && campStateMatch[1]) {
    campState = campStateMatch[1].trim().replace(/\s+state$/i, "");
  } else {
    // Check sentence pattern: "deployed to ... State"
    const sentenceStateMatch = cleanText.match(/deployed\s+to\s+([A-Za-z\s]+?)(?:\s+state|\s+for|\s+on|\.|$)/i);
    if (sentenceStateMatch && sentenceStateMatch[1]) {
      campState = sentenceStateMatch[1].trim();
    }
  }

  // Normalize camp state against known Nigerian states if close match
  if (campState) {
    const matchedState = NIGERIAN_STATES.find(
      (s) => s.toLowerCase() === campState.toLowerCase() || campState.toLowerCase().includes(s.toLowerCase())
    );
    if (matchedState) {
      campState = matchedState;
    }
  }

  // 5. Camp Name / Address / Venue
  let campName = "";
  const campVenueMatch = cleanText.match(
    /(?:orientation\s+camp|camp\s+address|camp\s+venue|camp\s+location|camp\s+name|reporting\s+venue|venue)\s*[:=\-]\s*([^\r\n]+)/i
  );
  if (campVenueMatch && campVenueMatch[1]) {
    campName = campVenueMatch[1].trim().replace(/[.,;]+$/, "");
  } else {
    // Check if there is an NYSC Camp mention in the body
    const directCamp = cleanText.match(/(NYSC\s+(?:Permanent\s+)?Orientation\s+Camp[^\r\n,.]*)/i);
    if (directCamp && directCamp[1]) {
      campName = directCamp[1].trim();
    }
  }

  // 6. Reporting Date
  let reportingDate = "";
  const reportDateMatch = cleanText.match(
    /(?:date\s+of\s+reporting|reporting\s+date|commencement\s+date|report\s+on\s+or\s+before|report\s+on|report\s+date|report\s+to\s+camp\s+on)\s*[:=\-]?\s*([0-9A-Za-z\s,\.\/\-]+)/i
  );
  if (reportDateMatch && reportDateMatch[1]) {
    const rawDateCandidate = reportDateMatch[1].trim();
    const standardized = standardizeDate(rawDateCandidate);
    reportingDate = standardized || rawDateCandidate;
  } else {
    // Look for any date pattern adjacent to the word "report"
    const nearbyDate = cleanText.match(/report[^\n]{0,40}?(\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b|\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b)/i);
    if (nearbyDate && nearbyDate[1]) {
      const standardized = standardizeDate(nearbyDate[1]);
      reportingDate = standardized || nearbyDate[1];
    }
  }

  // 7. Batch
  let batch = "";
  const batchMatch = cleanText.match(
    /(?:(?:20\d{2}\s+)?batch)\s*[:=\-]?\s*['"‘“]?\s*([A-Za-z0-9\s]+?)['"’”]?\b(?:\s+service|\s+stream|,|\r|\n|$)/i
  );
  if (batchMatch && batchMatch[1]) {
    const bVal = batchMatch[1].trim();
    batch = /batch/i.test(bVal) ? bVal : `Batch ${bVal}`;
  } else {
    const simpleBatch = cleanText.match(/\b(20\d{2}\s+Batch\s+[A-C]|Batch\s+[A-C])\b/i);
    if (simpleBatch && simpleBatch[1]) {
      batch = simpleBatch[1].trim();
    }
  }

  // 8. Stream
  let stream = "";
  const streamMatch = cleanText.match(/(?:stream)\s*[:=\-]?\s*(?:stream\s+)?([0-9IVXivx]+)/i);
  if (streamMatch && streamMatch[1]) {
    const rawVal = streamMatch[1].trim().toUpperCase();
    const normalized = rawVal === "I" ? "1" : rawVal === "II" ? "2" : rawVal;
    stream = `Stream ${normalized}`;
  }

  return {
    fullName: makeField(fullName),
    stateCode: makeField(stateCode.toUpperCase()),
    callUpNumber: makeField(callUpNumber.toUpperCase()),
    campState: makeField(campState),
    campName: makeField(campName),
    reportingDate: makeField(reportingDate),
    batch: makeField(batch),
    stream: makeField(stream),
  };
}

/** Pre-camp survival checklist items for NYSC corps members */
export interface PreCampChecklistItem {
  id: string;
  title: string;
  hint: string;
  category: "documents" | "gear" | "essentials";
}

export const PRE_CAMP_CHECKLIST_ITEMS: PreCampChecklistItem[] = [
  {
    id: "medical-cert",
    title: "Medical Fitness Certificate",
    hint: "Must be issued by a Government or General Hospital (with blood group & genotype). Private hospital certificates are rejected.",
    category: "documents",
  },
  {
    id: "statement-result",
    title: "Statement of Result / Degree Certificate",
    hint: "Original copy plus at least 4 clear photocopies.",
    category: "documents",
  },
  {
    id: "callup-greencard",
    title: "Call-up Letter & Green Card (Color Printouts)",
    hint: "Print 3–4 color copies. DO NOT laminate them; camp registration officials must sign and stamp them.",
    category: "documents",
  },
  {
    id: "passport-photos",
    title: "Passport Photographs (8–10 copies)",
    hint: "Recent photos with a clear white background for camp file, bank opening, and platoon documentation.",
    category: "documents",
  },
  {
    id: "student-id",
    title: "Institutional Student Identity Card",
    hint: "Original student ID card from your graduating institution.",
    category: "documents",
  },
  {
    id: "white-wear",
    title: "White T-shirts & White Shorts (3–4 pairs)",
    hint: "Plain white round-neck shirts and shorts. You will wear white outfits daily for 21 days.",
    category: "gear",
  },
  {
    id: "white-sneakers",
    title: "White Rubber / Tennis Shoes & White Socks",
    hint: "Rubber sneakers clean quickly after morning dew and mud drills on parade ground.",
    category: "gear",
  },
  {
    id: "waist-pouch",
    title: "Waist Pouch & Padlocks",
    hint: "Keep your phone, cash, and locker keys strapped to your waist at all times in camp.",
    category: "gear",
  },
  {
    id: "mosquito-net-bedding",
    title: "Mosquito Net, Bedsheet & Blanket",
    hint: "Essential for hostel bunk setup and mosquito protection.",
    category: "essentials",
  },
  {
    id: "toiletries-powerbank",
    title: "Basic Toiletries, Detergent & Power Bank",
    hint: "Camp charging spots can be congested; a charged power bank is invaluable.",
    category: "essentials",
  },
];
