import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NavProgress } from "@/types/nav";

/**
 * Persisted nav progress store – works fully offline.
 * Key: flow_id → NavProgress object.
 */
interface NavProgressState {
  /** Map of flow_id to NavProgress */
  progressMap: Record<string, NavProgress>;
  setProgress: (flowId: string, progress: NavProgress) => void;
  getProgress: (flowId: string) => NavProgress | undefined;
  clearProgress: (flowId: string) => void;
  clearAll: () => void;
}

export const useNavProgressStore = create<NavProgressState>()(
  persist(
    (set, get) => ({
      progressMap: {},
      setProgress: (flowId, progress) =>
        set((state) => ({
          progressMap: { ...state.progressMap, [flowId]: progress },
        })),
      getProgress: (flowId) => get().progressMap[flowId],
      clearProgress: (flowId) =>
        set((state) => {
          const next = { ...state.progressMap };
          delete next[flowId];
          return { progressMap: next };
        }),
      clearAll: () => set({ progressMap: {} }),
    }),
    {
      name: "zed-nav-progress",
    }
  )
);
