"use client";

import { cn } from "@/lib/utils";
import { SidebarContent } from "./SidebarContent";
import { useAppSidebar } from "./AppSidebarContext";

/**
 * Desktop-only collapsible sidebar.
 * Hidden on mobile (md:flex). The mobile equivalent is MobileDrawer.
 * Remembers collapsed state in localStorage and toggles via Ctrl/Cmd + B.
 */
export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useAppSidebar();

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "hidden md:flex flex-col border-r border-border/50 bg-[var(--sidebar-background)] select-none shrink-0 sticky top-0 h-dvh z-30",
        "transition-[width] duration-200 ease-out",
        isCollapsed ? "w-16" : "w-[240px]"
      )}
    >
      <SidebarContent
        collapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
    </aside>
  );
}
