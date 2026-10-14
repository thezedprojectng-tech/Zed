"use client";

// ─── Supabase Auth Session Provider ───────────────────────────────────────────
// Runs once on the client side to:
//  1. Fetch current Supabase user and profile (from public.users) into useAuthStore.
//  2. Subscribe to onAuthStateChange so store stays in sync on auth events.
//  3. Automatically hydrate nav progress on user login.

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, type UserProfile } from "@/store/useAuthStore";
import { useNavProgressStore } from "@/store/useNavProgressStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, clearUser, setLoading } = useAuthStore();
  const { syncWithRemote } = useNavProgressStore();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const supabase = createClient();

    async function loadUserProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("Failed to load user profile:", error.message);
          return null;
        }
        return (data as UserProfile) || null;
      } catch (err) {
        console.error("Unexpected error loading user profile:", err);
        return null;
      }
    }

    async function handleUserAuthenticated(user: any) {
      setUser(user);
      const profile = await loadUserProfile(user.id);
      setProfile(profile);
      setLoading(false);

      // Trigger nav progress sync on login
      syncWithRemote(user.id, supabase).catch((err) => {
        console.error("Nav progress sync failed:", err);
      });
    }

    // 1. Initial session load
    setLoading(true);
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        await handleUserAuthenticated(user);
      } else {
        clearUser();
      }
    });

    // 2. Auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleUserAuthenticated(session.user);
      } else if (event === "SIGNED_OUT" || !session) {
        clearUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, clearUser, setLoading, syncWithRemote]);

  return <>{children}</>;
}
