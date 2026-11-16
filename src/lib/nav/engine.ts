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

  const isCompleted =
    Boolean(progress.completed) ||
    getFlowProgress(_flow, { ...progress, completed_steps: completed }).isCompleted;

  return {
    ...progress,
    current_step: option.nextStepId,
    completed_steps: completed,
    completed: isCompleted,
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

  const isCompleted =
    Boolean(progress.completed) ||
    getFlowProgress(flow, { ...progress, completed_steps: completed }).isCompleted;

  return {
    ...progress,
    current_step: current.next,
    completed_steps: completed,
    completed: isCompleted,
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

// ── Flow Versioning & Path Analysis ───────────────────────────────────────────

/**
 * Computes a deterministic version signature for a flow based on its step IDs.
 */
export function getFlowVersion(flow: NavFlow): string {
  return flow.steps.map((s) => s.id).join(">");
}

/**
 * Counts how many steps in progress.completed_steps actually exist in the current flow.
 */
export function getCompletedStepsCount(flow: NavFlow, progress: NavProgress): number {
  const validStepIds = new Set(flow.steps.map((s) => s.id));
  const uniqueValidCompleted = new Set(
    (progress.completed_steps ?? []).filter((id) => validStepIds.has(id))
  );
  return uniqueValidCompleted.size;
}

/**
 * Returns the sequence of steps along the user's active traversal path.
 * For decision steps, follows the chosen branch if recorded in progress, or defaults to the first branch.
 */
export function getActivePathSteps(flow: NavFlow, progress: NavProgress): NavStep[] {
  if (!flow.steps.length) return [];

  const stepMap = new Map<string, NavStep>(flow.steps.map((s) => [s.id, s]));
  const path: NavStep[] = [];
  const visited = new Set<string>();

  let currentId: string | undefined = flow.steps[0]?.id;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const step = stepMap.get(currentId);
    if (!step) break;

    path.push(step);

    if (step.type === "decision") {
      const chosenOption =
        step.options.find(
          (o) =>
            progress.current_step === o.nextStepId ||
            progress.completed_steps.includes(o.nextStepId)
        ) ?? step.options[0];

      currentId = chosenOption?.nextStepId;
    } else {
      currentId = step.next;
    }
  }

  return path;
}

/**
 * Returns any steps along the active path prior to the target/current step that have not been completed.
 */
export function getIncompleteEarlierSteps(
  flow: NavFlow,
  progress: NavProgress,
  targetStepId?: string
): NavStep[] {
  let path = getActivePathSteps(flow, progress);
  if (path.length <= 1 && flow.steps.length > 1) {
    path = flow.steps;
  }
  const targetId = targetStepId ?? progress.current_step;
  const targetIndex = path.findIndex((s) => s.id === targetId);

  const earlierSteps = targetIndex > 0 ? path.slice(0, targetIndex) : path.slice(0, -1);
  const completedSet = new Set(progress.completed_steps ?? []);

  return earlierSteps.filter((s) => !completedSet.has(s.id));
}

// ── Progress & Reconciliation ─────────────────────────────────────────────────

export interface FlowProgressMetrics {
  completedCount: number;
  totalSlots: number;
  percentage: number;
  isCompleted: boolean;
}

/**
 * Computes flow progress using required slots:
 * - Non-optional, non-branchGroup steps = 1 slot each
 * - Each unique branchGroup = 1 slot (satisfied when ANY member is in completed_steps)
 * - Optional steps add to numerator only if completed; never count toward denominator
 * Returns isCompleted=true when all required slots are satisfied (or progress.completed is set).
 */
export function getFlowProgress(
  flow: NavFlow,
  progress?: NavProgress | null
): FlowProgressMetrics {
  const completedSet = new Set(progress?.completed_steps ?? []);

  // Collect branch groups and classify steps
  const branchGroups = new Set<string>();
  const optionalSteps: NavStep[] = [];
  const requiredLinearSteps: NavStep[] = [];

  for (const step of flow.steps) {
    if ((step as { branchGroup?: string }).branchGroup) {
      branchGroups.add((step as { branchGroup: string }).branchGroup);
    } else if ((step as { optional?: boolean }).optional) {
      optionalSteps.push(step);
    } else {
      requiredLinearSteps.push(step);
    }
  }

  // Required denominator = linear required + 1 per branchGroup
  const requiredSlots = requiredLinearSteps.length + branchGroups.size;

  // Count satisfied required linear slots
  const satisfiedLinear = requiredLinearSteps.filter((s) => completedSet.has(s.id)).length;

  // Count satisfied branch group slots (any member completed = slot satisfied)
  let satisfiedBranch = 0;
  for (const group of branchGroups) {
    const membersInGroup = flow.steps.filter(
      (s) => (s as { branchGroup?: string }).branchGroup === group
    );
    if (membersInGroup.some((s) => completedSet.has(s.id))) {
      satisfiedBranch++;
    }
  }

  // Count completed optional steps (bonus numerator, also expand denominator)
  const completedOptional = optionalSteps.filter((s) => completedSet.has(s.id)).length;

  const numerator = satisfiedLinear + satisfiedBranch + completedOptional;
  const denominator = requiredSlots + completedOptional;

  const percentage =
    denominator > 0 ? Math.min(100, Math.round((numerator / denominator) * 100)) : 0;

  // All required slots satisfied = completed
  const allRequiredSatisfied =
    requiredSlots > 0 ? satisfiedLinear + satisfiedBranch >= requiredSlots : true;

  const isCompleted = Boolean(progress?.completed) || allRequiredSatisfied;

  return {
    completedCount: numerator,
    totalSlots: denominator,
    percentage,
    isCompleted,
  };
}

/**
 * Calculates completion percentage (0–100) based on completed steps count
 * relative to total steps in the flow, counting only steps that exist in the current flow.
 */
export function getProgress(flow: NavFlow, progress: NavProgress): number {
  return getFlowProgress(flow, progress).percentage;
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
    completed: false,
    flow_version: getFlowVersion(flow),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Reconciles persisted progress with the current flow:
 * 1. Drops completed step IDs that no longer exist in the flow.
 * 2. If the saved current step is missing or invalid, moves to the first incomplete step.
 * 3. Updates flow_version and gracefully migrates state without resetting.
 */
export function reconcileProgress(
  flow: NavFlow,
  persisted: NavProgress | null | undefined
): NavProgress {
  const currentVersion = getFlowVersion(flow);
  if (!persisted) {
    return initProgress(flow);
  }

  const validStepIds = new Set(flow.steps.map((s) => s.id));

  // 1. Drop completed ids that no longer exist in the current flow
  const reconciledCompleted = Array.from(
    new Set((persisted.completed_steps ?? []).filter((id) => validStepIds.has(id)))
  );

  // Clean checklist and document states
  const reconciledChecklist: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(persisted.checklist_state ?? {})) {
    if (validStepIds.has(k)) reconciledChecklist[k] = v;
  }

  const reconciledDocument: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(persisted.document_state ?? {})) {
    if (validStepIds.has(k)) reconciledDocument[k] = v;
  }

  // 2. Validate current_step; if missing or invalid, move to first incomplete step
  let currentStep = persisted.current_step;
  const isCurrentInvalid = !currentStep || !validStepIds.has(currentStep);

  if (isCurrentInvalid) {
    const firstIncomplete = flow.steps.find((s) => !reconciledCompleted.includes(s.id));
    currentStep = firstIncomplete ? firstIncomplete.id : (flow.steps[0]?.id ?? "");
  }

  // 3. Preserve or update completion state
  const reconciledProgress: NavProgress = {
    ...persisted,
    completed_steps: reconciledCompleted,
    checklist_state: reconciledChecklist,
    document_state: reconciledDocument,
  };
  const { isCompleted: isComplete } = getFlowProgress(flow, reconciledProgress);

  return {
    ...persisted,
    flow_id: flow.id,
    current_step: currentStep,
    completed_steps: reconciledCompleted,
    checklist_state: reconciledChecklist,
    document_state: reconciledDocument,
    completed: isComplete,
    flow_version: currentVersion,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Marks the flow as completed from the terminal step.
 * Always finishes the flow by setting completed: true.
 */
export function completeFlow(flow: NavFlow, progress: NavProgress): NavProgress {
  const current = getCurrentStep(flow, progress);
  const finalCompleted = Array.from(
    new Set([...(progress.completed_steps ?? []), current.id])
  );
  return {
    ...progress,
    completed_steps: finalCompleted,
    completed: true,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Returns true if all required slots in the flow are satisfied,
 * or if the flow was explicitly finished.
 */
export function isFlowComplete(flow: NavFlow, progress: NavProgress): boolean {
  return getFlowProgress(flow, progress).isCompleted;
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
