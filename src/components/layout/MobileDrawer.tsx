"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";

interface MobileDrawerProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Mobile hamburger button + left slide-in drawer.
 * Hidden on md+ (hamburger button is md:hidden; only rendered in mobile TopBar).
 *
 * Accessibility:
 * - aria-label / aria-expanded on the trigger button
 * - Focus returns to trigger when the sheet closes (handled by Radix Dialog)
 * - Escape closes (built-in Radix behaviour)
 * - Page scroll is locked while open (built-in Radix behaviour)
 * - prefers-reduced-motion: Radix respects the media query for its animations
 */
export function MobileDrawerTrigger({
  open,
  onOpen,
  onClose,
}: MobileDrawerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Hamburger button — rendered inside TopBar on mobile */}
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={open ? onClose : onOpen}
        className="md:hidden flex items-center justify-center h-11 w-11 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Left slide-in Sheet */}
      <Sheet open={open} onOpenChange={(v) => (v ? onOpen() : onClose())}>
        <SheetContent
          id="mobile-nav-drawer"
          side="left"
          showCloseButton={false}
          aria-label="Navigation menu"
          className="p-0 w-[300px] max-w-[85vw] flex flex-col bg-[var(--sidebar-background)] border-r border-border/50"
        >
          {/* Visually hidden title for screen readers */}
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent onNavigate={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
