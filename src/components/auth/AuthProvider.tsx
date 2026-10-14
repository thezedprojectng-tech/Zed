"use client";

// ─── Supabase Auth Session Provider ───────────────────────────────────────────
// Runs once on the client side to:
//  1. Fetch the current Supabase session and push it into useAuthStore.
//  2. Subscribe to onAuthStateChange so the store stays in sync after
//     sign-in, sign-out, and token refresh events.

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // 1. Hydrate the store with any existing session immediately
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        clearUser();
      }
    });

    // 2. Listen for future auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        clearUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearUser, setLoading]);

  return <>{children}</>;
}
