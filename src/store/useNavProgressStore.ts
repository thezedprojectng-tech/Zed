import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavProgress } from "@/types/nav";
import { createClient } from "@/lib/supabase/client";

/** Shape of a nav_progress row returned from Supabase */
interface NavProgressRow {
  flow_id: string;
  state: NavProgress;
  updated_at: string | null;
}

/**
 * Persisted nav progress store – offline first with automatic Supabase sync.
 * Table: public.nav_progress (user_id, flow_id, state JSONB, updated_at TIMESTAMPTZ)
 */
interface NavProgressState {
  /** Map of flow_id to NavProgress */
  progressMap: Record<string, NavProgress>;
  setProgress: (flowId: string, progress: NavProgress, userId?: string) => void;
  getProgress: (flowId: string) => NavProgress | undefined;
  clearProgress: (flowId: string) => void;
  clearAll: () => void;
  /** Sync local progress with remote database on login (latest updatedAt wins) */
  syncWithRemote: (userId: string, customClient?: SupabaseClient) => Promise<void>;
}

export const useNavProgressStore = create<NavProgressState>()(
  persist(
    (set, get) => ({
      progressMap: {},

      setProgress: (flowId, progress, userId) => {
        // 1. Immediately update local state (offline-first)
        set((state) => ({
          progressMap: { ...state.progressMap, [flowId]: progress },
        }));

        // 2. If user is logged in, sync to Supabase in the background
        const syncToRemote = async () => {
          try {
            const supabase = createClient();
            let effectiveUserId = userId;
            if (!effectiveUserId) {
              const { data: { user } } = await supabase.auth.getUser();
              effectiveUserId = user?.id;
            }

            if (!effectiveUserId) return;

            const { error } = await supabase.from("nav_progress").upsert(
              {
                user_id: effectiveUserId,
                flow_id: flowId,
                state: progress,
                updated_at: progress.updated_at || new Date().toISOString(),
              },
              { onConflict: "user_id,flow_id" }
            );

            if (error) {
              console.warn("Background nav_progress sync failed:", error.message);
            }
          } catch (err) {
            console.warn("Error in background nav_progress sync:", err);
          }
        };

        syncToRemote();
      },

      getProgress: (flowId) => get().progressMap[flowId],

      clearProgress: (flowId) =>
        set((state) => {
          const next = { ...state.progressMap };
          delete next[flowId];
          return { progressMap: next };
        }),

      clearAll: () => set({ progressMap: {} }),

      syncWithRemote: async (userId: string, customClient?: SupabaseClient) => {
        if (!userId) return;

        try {
          const supabase = customClient || createClient();
          const { data: remoteRows, error } = await supabase
            .from("nav_progress")
            .select("flow_id, state, updated_at")
            .eq("user_id", userId);

          if (error) {
            console.warn("Failed to fetch remote nav_progress:", error.message);
            return;
          }

          const localMap = { ...get().progressMap };
          let changed = false;

          if (remoteRows && Array.isArray(remoteRows)) {
            for (const row of remoteRows) {
              const flowId = row.flow_id;
              const remoteProgress = row.state as NavProgress;
              const remoteUpdatedAt = new Date(row.updated_at || remoteProgress?.updated_at || 0).getTime();

              const localProgress = localMap[flowId];
              const localUpdatedAt = localProgress?.updated_at
                ? new Date(localProgress.updated_at).getTime()
                : 0;

              if (!localProgress || remoteUpdatedAt >= localUpdatedAt) {
                // Remote wins
                if (remoteProgress) {
                  localMap[flowId] = remoteProgress;
                  changed = true;
                }
              } else if (localUpdatedAt > remoteUpdatedAt) {
                // Local is newer – push back to remote
                await supabase.from("nav_progress").upsert(
                  {
                    user_id: userId,
                    flow_id: flowId,
                    state: localProgress,
                    updated_at: localProgress.updated_at,
                  },
                  { onConflict: "user_id,flow_id" }
                );
              }
            }
          }

          // If local has flows that remote doesn't have yet, push them to remote
          const remoteFlowIds = new Set((remoteRows || []).map((r: NavProgressRow) => r.flow_id));
          for (const [flowId, progress] of Object.entries(localMap)) {
            if (!remoteFlowIds.has(flowId)) {
              await supabase.from("nav_progress").upsert(
                {
                  user_id: userId,
                  flow_id: flowId,
                  state: progress,
                  updated_at: progress.updated_at || new Date().toISOString(),
                },
                { onConflict: "user_id,flow_id" }
              );
            }
          }

          if (changed) {
            set({ progressMap: localMap });
          }
        } catch (err) {
          console.warn("Error during nav_progress sync:", err);
        }
      },
    }),
    {
      name: "zed-nav-progress",
    }
  )
);
