"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR/hydration and true once mounted on client.
 * Uses useSyncExternalStore to safely avoid setState-in-effect and cascading renders.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * Tracks navigator.onLine using useSyncExternalStore subscribed to online/offline window events.
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
    () => true
  );
}
