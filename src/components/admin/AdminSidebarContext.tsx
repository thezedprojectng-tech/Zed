"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "zed_admin_sidebar_collapsed";

interface AdminSidebarContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapse: () => void;
  toggleMobile: () => void;
}

const AdminSidebarContext = React.createContext<AdminSidebarContextValue | null>(null);

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = React.useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState<boolean>(false);
  const pathname = usePathname();

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
      // Don't intercept if user is typing in an input, textarea or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsCollapsed]);

  // 4. Auto-close mobile sheet on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  const toggleMobile = React.useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
      isMobileOpen,
      setIsMobileOpen,
      toggleCollapse,
      toggleMobile,
    }),
    [isCollapsed, setIsCollapsed, isMobileOpen, toggleCollapse, toggleMobile]
  );

  return (
    <AdminSidebarContext.Provider value={value}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const ctx = React.useContext(AdminSidebarContext);
  if (!ctx) {
    throw new Error("useAdminSidebar must be used within an AdminSidebarProvider");
  }
  return ctx;
}

