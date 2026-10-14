export interface PassportCenter {
  id: string;
  name: string;
  state: string;
}

/**
 * Static registry of official Nigerian Passport Enrolment & Processing Centres.
 * Names and states only — no invented addresses.
 */
export const PASSPORT_CENTRES: PassportCenter[] = [
  {
    id: "lagos-ikoyi",
    name: "Ikoyi Passport Office",
    state: "Lagos",
  },
  {
    id: "lagos-festac",
    name: "Festac Passport Office",
    state: "Lagos",
  },
  {
    id: "abuja-hq",
    name: "NIS Headquarters Passport Office",
    state: "Abuja",
  },
  {
    id: "ibadan-bodija",
    name: "Ibadan Passport Office",
    state: "Oyo",
  },
  {
    id: "enugu-ogui",
    name: "Enugu Passport Office",
    state: "Enugu",
  },
  {
    id: "ph-rivers",
    name: "Port Harcourt Passport Office",
    state: "Rivers",
  },
];

export const NIGERIAN_STATES = [
  "All States",
  "Lagos",
  "Abuja",
  "Oyo",
  "Enugu",
  "Rivers",
] as const;
