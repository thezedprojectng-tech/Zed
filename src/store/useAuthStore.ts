import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ZedUser } from "@/types";

interface AuthState {
  user: ZedUser | null;
  isLoading: boolean;
  setUser: (user: ZedUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "zed-auth",
      // Only persist non-sensitive user metadata
      partialize: (state) => ({ user: state.user }),
    }
  )
);
