"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useIsMounted } from "@/lib/hooks";

export function useSiteAuth() {
  const mounted = useIsMounted();
  const user = useAuthStore((s) => s.user);

  return {
    isAuthenticated: mounted && !!user,
    user: mounted ? user : null,
    mounted,
  };
}
