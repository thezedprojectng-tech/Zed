"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface AdminDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  timestamp?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  widthClassName?: string;
}

export function AdminDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  timestamp,
  children,
  footer,
  className,
  widthClassName = "sm:max-w-lg md:max-w-xl",
}: AdminDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className={cn(
          "p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl focus:outline-hidden",
          widthClassName,
          className
        )}
      >
        {/* Header Row: Title/Badge on left, Timestamp + Close on right */}
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6 sm:py-5 shrink-0 bg-card">
          <div className="flex flex-col gap-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              {badge}
              <SheetTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
                {title}
              </SheetTitle>
            </div>
            {subtitle && (
              <SheetDescription className="text-xs text-muted-foreground truncate">
                {subtitle}
              </SheetDescription>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {timestamp && (
              <span className="font-mono text-xs text-muted-foreground hidden xs:inline-block sm:inline-block">
                {timestamp}
              </span>
            )}
            <SheetClose
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:ring-2 focus:ring-ring focus:outline-hidden"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </SheetClose>
          </div>
        </div>

        {/* Scrollable Body with standard padding */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-6 admin-scrollbar text-foreground">
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="border-t border-border/70 px-5 py-3.5 sm:px-6 sm:py-4 bg-card/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

