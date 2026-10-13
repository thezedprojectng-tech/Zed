import { describe, it, expect } from "vitest";
import type { NavFlow, NavProgress } from "@/types/nav";
import {
  initProgress,
  advance,
  goBack,
  getProgress,
  resolveBranch,
  toggleChecklistItem,
  isChecklistComplete,
  isDocumentCheckComplete,
  toggleDocumentItem,
  isFlowComplete,
  getCurrentStep,
} from "@/lib/nav/engine";

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeLinearFlow(): NavFlow {
  return {
    id: "test-linear",
    title: "Linear Test Flow",
    summary: "Test",
    category: "Identity & Banking",
    estimatedMinutes: 5,
    difficulty: "easy",
    sourceUrl: "https://example.com",
    lastVerified: "2026-10-13",
    steps: [
      {
        type: "info",
        id: "step-1",
        title: "Step 1",
        body: "Body 1",
        next: "step-2",
      },
      {
        type: "info",
        id: "step-2",
        title: "Step 2",
        body: "Body 2",
        next: "step-3",
      },
      { type: "info", id: "step-3", title: "Step 3", body: "Body 3" },
    ],
  };
}

function makeBranchingFlow(): NavFlow {
  return {
    id: "test-branch",
    title: "Branching Test Flow",
    summary: "Test",
    category: "Immigration & Travel",
    estimatedMinutes: 10,
    difficulty: "moderate",
    sourceUrl: "https://example.com",
    lastVerified: "2026-10-13",
    steps: [
      {
        type: "decision",
        id: "choose",
        title: "Choose path",
        question: "New or renewal?",
        options: [
          { label: "New", nextStepId: "new-path" },
          { label: "Renewal", nextStepId: "renew-path" },
        ],
      },
      {
        type: "info",
        id: "new-path",
        title: "New application",
        body: "Body",
      },
      {
        type: "info",
        id: "renew-path",
        title: "Renewal application",
        body: "Body",
      },
    ],
  };
}

function makeChecklistFlow(): NavFlow {
  return {
    id: "test-checklist",
    title: "Checklist Flow",
    summary: "Test",
    category: "Corporate Affairs",
    estimatedMinutes: 5,
    difficulty: "easy",
    sourceUrl: "https://example.com",
    lastVerified: "2026-10-13",
    steps: [
      {
        type: "checklist",
        id: "docs",
        title: "Documents",
        items: [
          { id: "a", label: "Document A" },
          { id: "b", label: "Document B" },
        ],
        next: "done",
      },
      { type: "info", id: "done", title: "Done", body: "All good" },
    ],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("initProgress", () => {
  it("sets current_step to first step id", () => {
    const flow = makeLinearFlow();
    const progress = initProgress(flow);
    expect(progress.current_step).toBe("step-1");
    expect(progress.completed_steps).toEqual([]);
    expect(progress.flow_id).toBe("test-linear");
  });
});

describe("advance – linear flow", () => {
  it("moves to next step and marks previous as complete", () => {
    const flow = makeLinearFlow();
    const p0 = initProgress(flow);
    const p1 = advance(flow, p0);
    expect(p1).not.toBeNull();
    expect(p1!.current_step).toBe("step-2");
    expect(p1!.completed_steps).toContain("step-1");
  });

  it("returns null at the last step", () => {
    const flow = makeLinearFlow();
    const p = { ...initProgress(flow), current_step: "step-3" };
    expect(advance(flow, p)).toBeNull();
  });

  it("accumulates completed steps across multiple advances", () => {
    const flow = makeLinearFlow();
    const p0 = initProgress(flow);
    const p1 = advance(flow, p0)!;
    const p2 = advance(flow, p1)!;
    expect(p2.completed_steps).toContain("step-1");
    expect(p2.completed_steps).toContain("step-2");
    expect(p2.current_step).toBe("step-3");
  });
});

describe("goBack – back navigation", () => {
  it("returns to the previous step", () => {
    const flow = makeLinearFlow();
    const p = { ...initProgress(flow), current_step: "step-2" };
    const prev = goBack(flow, p);
    expect(prev).not.toBeNull();
    expect(prev!.current_step).toBe("step-1");
  });

  it("returns null on first step", () => {
    const flow = makeLinearFlow();
    const p = initProgress(flow);
    expect(goBack(flow, p)).toBeNull();
  });
});

describe("getProgress", () => {
  it("returns 0 when no steps completed", () => {
    const flow = makeLinearFlow();
    const p = initProgress(flow);
    expect(getProgress(flow, p)).toBe(0);
  });

  it("returns 67 when 2 of 3 completed", () => {
    const flow = makeLinearFlow();
    const p: NavProgress = {
      ...initProgress(flow),
      completed_steps: ["step-1", "step-2"],
    };
    expect(getProgress(flow, p)).toBe(67);
  });

  it("returns 100 when all steps completed", () => {
    const flow = makeLinearFlow();
    const p: NavProgress = {
      ...initProgress(flow),
      completed_steps: ["step-1", "step-2", "step-3"],
    };
    expect(getProgress(flow, p)).toBe(100);
  });
});

describe("resolveBranch – decision step", () => {
  it("routes to the correct branch step", () => {
    const flow = makeBranchingFlow();
    const p = initProgress(flow);
    const step = flow.steps[0];
    if (step.type !== "decision") throw new Error("not a decision");

    const next = resolveBranch(flow, p, step, "New");
    expect(next.current_step).toBe("new-path");
    expect(next.completed_steps).toContain("choose");

    const next2 = resolveBranch(flow, p, step, "Renewal");
    expect(next2.current_step).toBe("renew-path");
  });

  it("throws on unknown option label", () => {
    const flow = makeBranchingFlow();
    const p = initProgress(flow);
    const step = flow.steps[0];
    if (step.type !== "decision") throw new Error("not a decision");
    expect(() => resolveBranch(flow, p, step, "Unknown")).toThrow();
  });

  it("advance returns null for a decision step", () => {
    const flow = makeBranchingFlow();
    const p = initProgress(flow);
    expect(advance(flow, p)).toBeNull();
  });
});

describe("getProgress with branching", () => {
  it("counts completed_steps correctly after branch", () => {
    const flow = makeBranchingFlow();
    const p = initProgress(flow);
    const step = flow.steps[0];
    if (step.type !== "decision") throw new Error();
    const after = resolveBranch(flow, p, step, "New");
    // 1 of 3 steps completed
    expect(getProgress(flow, after)).toBe(33);
  });
});

describe("checklist helpers", () => {
  it("toggles item on and off", () => {
    const flow = makeChecklistFlow();
    const p = initProgress(flow);
    const p1 = toggleChecklistItem(p, "docs", "a");
    expect(p1.checklist_state["docs"]).toContain("a");
    const p2 = toggleChecklistItem(p1, "docs", "a");
    expect(p2.checklist_state["docs"]).not.toContain("a");
  });

  it("isChecklistComplete returns true only when all items checked", () => {
    const flow = makeChecklistFlow();
    const p = initProgress(flow);
    expect(isChecklistComplete(flow, p, "docs")).toBe(false);
    const p1 = toggleChecklistItem(p, "docs", "a");
    expect(isChecklistComplete(flow, p1, "docs")).toBe(false);
    const p2 = toggleChecklistItem(p1, "docs", "b");
    expect(isChecklistComplete(flow, p2, "docs")).toBe(true);
  });
});

describe("document helpers", () => {
  it("toggles document confirmation", () => {
    const flow: NavFlow = {
      id: "doc-flow",
      title: "Doc Flow",
      summary: "Test",
      category: "Youth Service",
      estimatedMinutes: 5,
      difficulty: "easy",
      sourceUrl: "https://example.com",
      lastVerified: "2026-10-13",
      steps: [
        {
          type: "document-check",
          id: "docs",
          title: "Documents",
          documents: [
            { id: "passport", label: "Passport", required: true },
            { id: "photo", label: "Photo", required: true },
          ],
        },
      ],
    };
    const p = initProgress(flow);
    const p1 = toggleDocumentItem(p, "docs", "passport");
    expect(p1.document_state["docs"]).toContain("passport");
    expect(isDocumentCheckComplete(flow, p1, "docs")).toBe(false);
    const p2 = toggleDocumentItem(p1, "docs", "photo");
    expect(isDocumentCheckComplete(flow, p2, "docs")).toBe(true);
  });
});

describe("isFlowComplete", () => {
  it("returns false when not all steps done", () => {
    const flow = makeLinearFlow();
    const p = initProgress(flow);
    expect(isFlowComplete(flow, p)).toBe(false);
  });

  it("returns true when last step advanced and all completed", () => {
    const flow = makeLinearFlow();
    const p: NavProgress = {
      ...initProgress(flow),
      completed_steps: ["step-1", "step-2", "step-3"],
    };
    expect(isFlowComplete(flow, p)).toBe(true);
  });
});

describe("getCurrentStep resilient recovery", () => {
  it("returns current step when step ID exists", () => {
    const flow = makeLinearFlow();
    const p = initProgress(flow);
    expect(getCurrentStep(flow, p).id).toBe("step-1");
  });

  it("gracefully falls back to first step when progress has a stale or missing step ID", () => {
    const flow = makeLinearFlow();
    const staleProgress: NavProgress = {
      ...initProgress(flow),
      current_step: "non-existent-old-step",
    };
    const step = getCurrentStep(flow, staleProgress);
    expect(step.id).toBe("step-1");
  });
});

