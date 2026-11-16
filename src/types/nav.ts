// ─── Zed Nav – Type Definitions ───────────────────────────────────────────────

// ── Step Discriminated Union ───────────────────────────────────────────────────

export interface InfoStep {
  type: "info";
  id: string;
  title: string;
  /** Markdown body text */
  body: string;
  tips?: string[];
  warning?: string;
  /** Next step id; omit for linear last step */
  next?: string;
  /** If set, this step belongs to a mutually-exclusive branch group.
   * Only one member of the group needs to be completed for the slot to count. */
  branchGroup?: string;
  /** If true, this step is optional and never counts toward the required denominator. */
  optional?: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

export interface ChecklistStep {
  type: "checklist";
  id: string;
  title: string;
  items: ChecklistItem[];
  /** Complete when all items are checked */
  next?: string;
  branchGroup?: string;
  optional?: boolean;
}

export interface LinkStep {
  type: "link";
  id: string;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
  /** Marked complete on "Done" tap */
  next?: string;
  branchGroup?: string;
  optional?: boolean;
}

export interface DecisionOption {
  label: string;
  nextStepId: string;
}

export interface DecisionStep {
  type: "decision";
  id: string;
  title: string;
  question: string;
  options: DecisionOption[];
  /** No `next` – branching is driven by DecisionOption.nextStepId */
  branchGroup?: string;
  optional?: boolean;
}

export interface DocumentItem {
  id: string;
  label: string;
  required: boolean;
  acceptedFormats?: string[];
}

export interface DocumentCheckStep {
  type: "document-check";
  id: string;
  title: string;
  documents: DocumentItem[];
  next?: string;
  branchGroup?: string;
  optional?: boolean;
}

/** Discriminated union of all step variants */
export type NavStep =
  | InfoStep
  | ChecklistStep
  | LinkStep
  | DecisionStep
  | DocumentCheckStep;

// ── Flow ──────────────────────────────────────────────────────────────────────

export type FlowCategory =
  | "Immigration & Travel"
  | "Youth Service"
  | "Identity & Banking"
  | "Corporate Affairs";

export type FlowDifficulty = "easy" | "moderate" | "involved";

export interface NavFlow {
  id: string;
  title: string;
  summary: string;
  category: FlowCategory;
  estimatedMinutes: number;
  difficulty: FlowDifficulty;
  sourceUrl: string;
  lastVerified: string; // ISO date YYYY-MM-DD
  steps: NavStep[];
}

// ── Progress ──────────────────────────────────────────────────────────────────

export interface NavProgress {
  flow_id: string;
  current_step: string;
  completed_steps: string[];
  /** Checklist state: stepId → array of checked item ids */
  checklist_state: Record<string, string[]>;
  /** Document state: stepId → array of confirmed doc ids */
  document_state: Record<string, string[]>;
  updated_at: string;
  /** Version signature based on flow step structure */
  flow_version?: string;
  /** Whether the flow has been explicitly finished */
  completed?: boolean;
}
