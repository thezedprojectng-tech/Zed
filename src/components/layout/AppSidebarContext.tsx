"use client";

import * as React from "react";

const STORAGE_KEY = "zed_app_sidebar_collapsed";

interface AppSidebarContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapse: () => void;
}

const AppSidebarContext = React.createContext<AppSidebarContextValue | null>(null);

export function AppSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = React.useState<boolean>(false);

  // 1. Read stored collapse state from localStorage inside try/catch
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsedState(stored === "true");
      }
    } catch {
      // Ignore storage errors (private mode / sandboxed iframe)
    }
  }, []);

  // 2. Persist collapse state to localStorage inside try/catch
  const setIsCollapsed = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsCollapsedState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });
    },
    []
  );

  // 3. Global keyboard shortcut Ctrl/Cmd + B to toggle desktop collapse
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsCollapsed]);

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  const value = React.useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
    }),
    [isCollapsed, setIsCollapsed, toggleCollapse]
  );

  return (
    <AppSidebarContext.Provider value={value}>
      {children}
    </AppSidebarContext.Provider>
  );
}

export function useAppSidebar(): AppSidebarContextValue {
  const ctx = React.useContext(AppSidebarContext);
  if (!ctx) {
    throw new Error("useAppSidebar must be used within an AppSidebarProvider");
  }
  return ctx;
}
