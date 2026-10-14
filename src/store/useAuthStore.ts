// ─── Zed Auth Store ────────────────────────────────────────────────────────────
// Thin Zustand store that mirrors the Supabase session into React state.
// The source of truth for authentication is always the Supabase cookie-based
// session (managed by @supabase/ssr + middleware). This store is used purely
// for convenient access to the current user's profile metadata in UI components.

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  /** The currently signed-in Supabase user, or null when signed out. */
  user: User | null;
  /** True while the initial session check is in progress. */
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearUser: () => set({ user: null, isLoading: false }),
}));
