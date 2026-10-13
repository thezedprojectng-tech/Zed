import { z } from "zod";

// ── Item validators ───────────────────────────────────────────────────────────

const checklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  hint: z.string().optional(),
});

const decisionOptionSchema = z.object({
  label: z.string().min(1),
  nextStepId: z.string().min(1),
});

const documentItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean(),
  acceptedFormats: z.array(z.string()).optional(),
});

// ── Step validators ───────────────────────────────────────────────────────────

const infoStepSchema = z.object({
  type: z.literal("info"),
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  tips: z.array(z.string()).optional(),
  warning: z.string().optional(),
  next: z.string().optional(),
});

const checklistStepSchema = z.object({
  type: z.literal("checklist"),
  id: z.string().min(1),
  title: z.string().min(1),
  items: z.array(checklistItemSchema).min(1),
  next: z.string().optional(),
});

const linkStepSchema = z.object({
  type: z.literal("link"),
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  href: z.string().url(),
  linkLabel: z.string().min(1),
  next: z.string().optional(),
});

const decisionStepSchema = z.object({
  type: z.literal("decision"),
  id: z.string().min(1),
  title: z.string().min(1),
  question: z.string().min(1),
  options: z.array(decisionOptionSchema).min(2),
});

const documentCheckStepSchema = z.object({
  type: z.literal("document-check"),
  id: z.string().min(1),
  title: z.string().min(1),
  documents: z.array(documentItemSchema).min(1),
  next: z.string().optional(),
});

/** Discriminated union validator for all step variants */
export const navStepSchema = z.discriminatedUnion("type", [
  infoStepSchema,
  checklistStepSchema,
  linkStepSchema,
  decisionStepSchema,
  documentCheckStepSchema,
]);

// ── Flow validator ────────────────────────────────────────────────────────────

export const navFlowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.enum([
    "Immigration & Travel",
    "Youth Service",
    "Identity & Banking",
    "Corporate Affairs",
  ]),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(["easy", "moderate", "involved"]),
  sourceUrl: z.string().url(),
  lastVerified: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date YYYY-MM-DD"),
  steps: z.array(navStepSchema).min(1),
});

export type NavFlowInput = z.input<typeof navFlowSchema>;
