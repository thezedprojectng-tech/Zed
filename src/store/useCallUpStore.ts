import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ConfirmedCallUpDetails {
  fullName: string;
  stateCode: string;
  callUpNumber: string;
  campState: string;
  campName: string;
  reportingDate: string;
  batch: string;
  stream: string;
  savedAt: string;
}

interface CallUpStoreState {
  details: ConfirmedCallUpDetails | null;
  /** List of checked checklist item IDs (e.g. 'medical-cert', 'white-wear') */
  checkedChecklistIds: string[];
  saveDetails: (data: Omit<ConfirmedCallUpDetails, "savedAt">) => void;
  clearDetails: () => void;
  toggleChecklistItem: (id: string) => void;
  resetChecklist: () => void;
}

export const useCallUpStore = create<CallUpStoreState>()(
  persist(
    (set) => ({
      details: null,
      checkedChecklistIds: [],

      saveDetails: (data) => {
        set({
          details: {
            ...data,
            savedAt: new Date().toISOString(),
          },
        });
      },

      clearDetails: () => {
        set({
          details: null,
          checkedChecklistIds: [],
        });
      },

      toggleChecklistItem: (id: string) => {
        set((state) => {
          const exists = state.checkedChecklistIds.includes(id);
          return {
            checkedChecklistIds: exists
              ? state.checkedChecklistIds.filter((item) => item !== id)
              : [...state.checkedChecklistIds, id],
          };
        });
      },

      resetChecklist: () => {
        set({ checkedChecklistIds: [] });
      },
    }),
    {
      name: "zed-callup-details",
    }
  )
);
