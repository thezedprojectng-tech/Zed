// ─── Zed Auth Store ────────────────────────────────────────────────────────────
// Thin Zustand store that mirrors the Supabase session and user profile.
// The source of truth for authentication is always Supabase cookie-based sessions.
// Holds real user, profile, and loading state.

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  phone_number: string;
  nin_hash: string | null;
  full_name: string;
  display_name: string | null;
  username: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  level_id: number;
  is_verified: boolean;
  role: "user" | "admin";
  username_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  /** The currently signed-in Supabase user, or null when signed out. */
  user: User | null;
  /** The user's public profile row from public.users table. */
  profile: UserProfile | null;
  /** True while the session or profile check is in progress. */
  loading: boolean;
  /** Alias for loading (backward compatibility). */
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  fetchProfile: () => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading, isLoading: loading }),
  clearUser: () =>
    set({
      user: null,
      profile: null,
      loading: false,
      isLoading: false,
    }),
  fetchProfile: async () => {
    const user = get().user;
    if (!user) {
      set({ profile: null });
      return null;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      if (data) {
        const profile = data as UserProfile;
        set({ profile });
        return profile;
      }
      return null;
    } catch (err) {
      console.error("Unexpected error in fetchProfile:", err);
      return null;
    }
  },
}));
