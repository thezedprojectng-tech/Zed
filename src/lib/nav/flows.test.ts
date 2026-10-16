import { describe, it, expect } from "vitest";
import passportFlow from "@/data/nav/passport.flow.json";
import nyscFlow from "@/data/nav/nysc.flow.json";
import ninBvnFlow from "@/data/nav/nin-bvn.flow.json";
import cacFlow from "@/data/nav/cac.flow.json";
import { navFlowSchema } from "@/lib/nav/schema";
import type { NavFlow, NavStep } from "@/types/nav";
import { initProgress, resolveBranch, advance } from "@/lib/nav/engine";

const ALL_FLOWS: NavFlow[] = [
  passportFlow as unknown as NavFlow,
  nyscFlow as unknown as NavFlow,
  ninBvnFlow as unknown as NavFlow,
  cacFlow as unknown as NavFlow,
];

describe("Zed Nav Flow Schemas & Graph Integrity", () => {
  ALL_FLOWS.forEach((flow) => {
    describe(`Flow: ${flow.title} (${flow.id})`, () => {
      it("passes zod schema validation", () => {
        const parsed = navFlowSchema.safeParse(flow);
        expect(parsed.success).toBe(true);
      });

      it("has unique step IDs", () => {
        const stepIds = flow.steps.map((s) => s.id);
        const uniqueIds = new Set(stepIds);
        expect(uniqueIds.size).toBe(stepIds.length);
      });

      it("all next and nextStepId references resolve to existing step IDs", () => {
        const stepIdSet = new Set(flow.steps.map((s) => s.id));
        flow.steps.forEach((step) => {
          if (step.type === "decision") {
            expect(step.options.length).toBeGreaterThanOrEqual(2);
            step.options.forEach((opt) => {
              expect(
                stepIdSet.has(opt.nextStepId),
                `Step "${step.id}" option "${opt.label}" references missing step "${opt.nextStepId}"`
              ).toBe(true);
            });
          } else if (step.next) {
            expect(
              stepIdSet.has(step.next),
              `Step "${step.id}" references missing step "${step.next}"`
            ).toBe(true);
          }
        });
      });

      it("contains no unreachable steps from the initial step", () => {
        const stepMap = new Map<string, NavStep>(flow.steps.map((s) => [s.id, s]));
        const initialStep = flow.steps[0];
        const visited = new Set<string>();
        const queue: string[] = [initialStep.id];

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          if (visited.has(currentId)) continue;
          visited.add(currentId);

          const currentStep = stepMap.get(currentId);
          if (!currentStep) continue;

          if (currentStep.type === "decision") {
            currentStep.options.forEach((opt) => {
              if (!visited.has(opt.nextStepId)) queue.push(opt.nextStepId);
            });
          } else if (currentStep.next) {
            if (!visited.has(currentStep.next)) queue.push(currentStep.next);
          }
        }

        const unreachable = flow.steps.filter((s) => !visited.has(s.id)).map((s) => s.id);
        expect(unreachable).toEqual([]);
      });

      it("every execution path terminates at the last step in the flow array", () => {
        const lastStep = flow.steps[flow.steps.length - 1];
        const stepMap = new Map<string, NavStep>(flow.steps.map((s) => [s.id, s]));

        // The last step itself should have no outgoing next
        if (lastStep.type !== "decision") {
          expect(lastStep.next).toBeUndefined();
        }

        // Check that from any step, all forward paths lead to lastStep without cycles
        function canReachEnd(stepId: string, visitedInPath: Set<string>): boolean {
          if (stepId === lastStep.id) return true;
          if (visitedInPath.has(stepId)) return false; // Cycle detected

          const step = stepMap.get(stepId);
          if (!step) return false;

          const nextVisited = new Set(visitedInPath).add(stepId);

          if (step.type === "decision") {
            return step.options.every((opt) => canReachEnd(opt.nextStepId, nextVisited));
          } else if (step.next) {
            return canReachEnd(step.next, nextVisited);
          }
          return false;
        }

        const reaches = canReachEnd(flow.steps[0].id, new Set<string>());
        expect(
          reaches,
          `Every path from start of "${flow.id}" must end at last step "${lastStep.id}"`
        ).toBe(true);
      });

      it("simulates full navigation through each decision option to completion", () => {
        const stepMap = new Map<string, NavStep>(flow.steps.map((s) => [s.id, s]));
        const firstStep = flow.steps[0];

        if (firstStep.type === "decision") {
          firstStep.options.forEach((opt) => {
            let progress = initProgress(flow);
            expect(progress.current_step).toBe(firstStep.id);

            // Select decision option
            progress = resolveBranch(flow, progress, firstStep, opt.label);
            expect(progress.current_step).toBe(opt.nextStepId);

            // Advance through the remaining linear chain
            let stepsCount = 0;
            const maxSteps = flow.steps.length * 2; // Guard against infinite loop

            while (stepsCount < maxSteps) {
              const current = stepMap.get(progress.current_step)!;
              if (current.type === "decision") {
                // If secondary decision encountered, pick first option
                progress = resolveBranch(flow, progress, current, current.options[0].label);
              } else if (current.next) {
                const nextProg = advance(flow, progress);
                expect(nextProg).not.toBeNull();
                progress = nextProg!;
              } else {
                // Reached terminal step
                break;
              }
              stepsCount++;
            }

            expect(progress.current_step).toBe(flow.steps[flow.steps.length - 1].id);
          });
        }
      });
    });
  });

  describe("NYSC Flow Specific Step Assertions", () => {
    it("contains the Medical certificate checklist step", () => {
      const step = nyscFlow.steps.find((s) => s.id === "medical-certificate");
      expect(step).toBeDefined();
      expect(step?.type).toBe("checklist");
      expect(step?.title).toBe("Medical certificate");
      if (step && step.type === "checklist") {
        expect(step.items).toHaveLength(3);
        const labels = (step.items ?? []).map((i) => i.label);
        expect(labels).toContain("Use a government-recognised hospital");
        expect(labels).toContain("Keep the original and a copy");
        expect(labels).toContain("Confirm requirements with NYSC before you go");
      }
    });

    it("contains the Primary Assignment (PPA) and relocation checklist step", () => {
      const step = nyscFlow.steps.find((s) => s.id === "ppa-and-relocation");
      expect(step).toBeDefined();
      expect(step?.type).toBe("checklist");
      expect(step?.title).toBe("Primary Assignment (PPA) and relocation");
      if (step && step.type === "checklist") {
        expect(step.items).toHaveLength(3);
        const labels = (step.items ?? []).map((i) => i.label);
        expect(labels).toContain("Get your posting letter");
        expect(labels).toContain("Speak to your Local Government Inspector or state coordinator");
        expect(labels).toContain("Prepare any supporting documents they ask for");
      }
    });
  });
});

