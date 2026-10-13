import type { NavFlow, NavProgress, NavStep, DecisionStep } from "@/types/nav";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the step object for a given stepId.
 * Throws if not found.
 */
export function getStep(flow: NavFlow, stepId: string): NavStep {
  const step = flow.steps.find((s) => s.id === stepId);
  if (!step)
    throw new Error(
      `[nav/engine] Step "${stepId}" not found in flow "${flow.id}"`
    );
  return step;
}

/**
 * Returns the first step of a flow.
 */
export function getFirstStep(flow: NavFlow): NavStep {
  if (!flow.steps.length)
    throw new Error(`[nav/engine] Flow "${flow.id}" has no steps`);
  return flow.steps[0];
}

/**
 * Returns the current step object from a progress snapshot.
 * Gracefully falls back to the first step if the stored step ID no longer exists in the flow.
 */
export function getCurrentStep(flow: NavFlow, progress: NavProgress): NavStep {
  const step = flow.steps.find((s) => s.id === progress.current_step);
  return step ?? getFirstStep(flow);
}

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Resolves a decision branch by selecting the option with the given label.
 * Returns a new progress with current_step set to the chosen branch.
 */
export function resolveBranch(
  _flow: NavFlow,
  progress: NavProgress,
  step: DecisionStep,
  chosenLabel: string
): NavProgress {
  const option = step.options.find((o) => o.label === chosenLabel);
  if (!option)
    throw new Error(
      `[nav/engine] Decision option "${chosenLabel}" not found in step "${step.id}"`
    );

  const completed = Array.from(
    new Set([...progress.completed_steps, step.id])
  );

  return {
    ...progress,
    current_step: option.nextStepId,
    completed_steps: completed,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Advances to the next step using the current step's `next` field.
 * Marks the current step as completed.
 * Returns null if the current step has no next (end of flow).
 */
export function advance(
  flow: NavFlow,
  progress: NavProgress
): NavProgress | null {
  const current = getCurrentStep(flow, progress);

  // Decision steps have no linear `next`; use resolveBranch instead
  if (current.type === "decision") return null;

  if (!current.next) return null; // terminal step

  const completed = Array.from(
    new Set([...progress.completed_steps, current.id])
  );

  return {
    ...progress,
    current_step: current.next,
    completed_steps: completed,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Goes back to the previous step in the step array order.
 * Returns null if already on the first step.
 * Note: does NOT remove from completed_steps (allows re-visit, not undo).
 */
export function goBack(
  flow: NavFlow,
  progress: NavProgress
): NavProgress | null {
  const idx = flow.steps.findIndex((s) => s.id === progress.current_step);
  if (idx <= 0) return null;

  const prev = flow.steps[idx - 1];
  return {
    ...progress,
    current_step: prev.id,
    updated_at: new Date().toISOString(),
  };
}

// ── Progress ──────────────────────────────────────────────────────────────────

/**
 * Calculates completion percentage (0–100) based on completed_steps count
 * relative to total steps in the flow.
 */
export function getProgress(flow: NavFlow, progress: NavProgress): number {
  if (!flow.steps.length) return 0;
  return Math.round(
    (progress.completed_steps.length / flow.steps.length) * 100
  );
}

/**
 * Creates the initial NavProgress for a flow.
 */
export function initProgress(flow: NavFlow): NavProgress {
  return {
    flow_id: flow.id,
    current_step: getFirstStep(flow).id,
    completed_steps: [],
    checklist_state: {},
    document_state: {},
    updated_at: new Date().toISOString(),
  };
}

/**
 * Returns true if all steps are completed (i.e. flow is done).
 */
export function isFlowComplete(flow: NavFlow, progress: NavProgress): boolean {
  return flow.steps.every((s) => progress.completed_steps.includes(s.id));
}

// ── Checklist helpers ─────────────────────────────────────────────────────────

/**
 * Toggles a checklist item for a given step.
 * Returns an updated progress object.
 */
export function toggleChecklistItem(
  progress: NavProgress,
  stepId: string,
  itemId: string
): NavProgress {
  const current = progress.checklist_state[stepId] ?? [];
  const next = current.includes(itemId)
    ? current.filter((id) => id !== itemId)
    : [...current, itemId];

  return {
    ...progress,
    checklist_state: { ...progress.checklist_state, [stepId]: next },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Returns true when every required item in a checklist step is checked.
 */
export function isChecklistComplete(
  flow: NavFlow,
  progress: NavProgress,
  stepId: string
): boolean {
  const step = getStep(flow, stepId);
  if (step.type !== "checklist") return false;
  const checked = progress.checklist_state[stepId] ?? [];
  return step.items.every((item) => checked.includes(item.id));
}

// ── Document helpers ──────────────────────────────────────────────────────────

/**
 * Toggles a document confirmation for a given step.
 */
export function toggleDocumentItem(
  progress: NavProgress,
  stepId: string,
  docId: string
): NavProgress {
  const current = progress.document_state[stepId] ?? [];
  const next = current.includes(docId)
    ? current.filter((id) => id !== docId)
    : [...current, docId];

  return {
    ...progress,
    document_state: { ...progress.document_state, [stepId]: next },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Returns true when all required documents in a document-check step are confirmed.
 */
export function isDocumentCheckComplete(
  flow: NavFlow,
  progress: NavProgress,
  stepId: string
): boolean {
  const step = getStep(flow, stepId);
  if (step.type !== "document-check") return false;
  const confirmed = progress.document_state[stepId] ?? [];
  return step.documents
    .filter((d) => d.required)
    .every((d) => confirmed.includes(d.id));
}
