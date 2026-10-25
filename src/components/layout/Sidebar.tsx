"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarContent } from "./SidebarContent";

/**
 * Desktop-only collapsible sidebar.
 * Hidden on mobile (md:flex). The mobile equivalent is MobileDrawer.
 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "hidden md:flex flex-col border-hairline-r bg-[var(--sidebar-background)] transition-all duration-200 select-none shrink-0 sticky top-0 h-dvh z-30",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {collapsed ? (
        /* ─── Collapsed view: icon-only with collapse toggle ─── */
        <CollapsedSidebar onExpand={() => setCollapsed(false)} />
      ) : (
        /* ─── Expanded view: full SidebarContent + collapse button ─── */
        <div className="flex flex-col h-full relative">
          {/* Collapse button */}
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="absolute top-3.5 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border-hairline text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <SidebarContent />
        </div>
      )}
    </aside>
  );
}

function CollapsedSidebar({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex flex-col h-full items-center py-3 gap-2">
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand sidebar"
        className="flex h-7 w-7 items-center justify-center rounded-md border-hairline text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
