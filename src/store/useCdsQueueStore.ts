// ─── CDS Offline Queue Store ──────────────────────────────────────────────────
// Persists pending CDS logs to localStorage when the user is offline.
// The CDSLogger component drains this queue when connectivity is restored.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PendingCdsLog } from "@/types/cds";

interface CdsQueueState {
  /** Entries logged while offline, awaiting server sync */
  pending: PendingCdsLog[];
  /** Enqueue a new entry (called when offline) */
  enqueue: (entry: Omit<PendingCdsLog, "tempId" | "queued_at">) => void;
  /** Remove a successfully synced entry by tempId */
  dequeue: (tempId: string) => void;
  /** Clear all pending entries */
  clearAll: () => void;
}

export const useCdsQueueStore = create<CdsQueueState>()(
  persist(
    (set) => ({
      pending: [],

      enqueue: (entry) =>
        set((state) => ({
          pending: [
            ...state.pending,
            {
              ...entry,
              tempId: `cds-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              queued_at: new Date().toISOString(),
            },
          ],
        })),

      dequeue: (tempId) =>
        set((state) => ({
          pending: state.pending.filter((p) => p.tempId !== tempId),
        })),

      clearAll: () => set({ pending: [] }),
    }),
    { name: "zed-cds-offline-queue" }
  )
);
