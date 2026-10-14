"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function useSiteAuth() {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    isAuthenticated: mounted && !!user,
    user: mounted ? user : null,
    mounted,
  };
}
