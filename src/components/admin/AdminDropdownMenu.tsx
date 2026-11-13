"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

/**
 * Shared styling constants for all Admin dropdown panels & items
 */
export const adminDropdownStyles = {
  // Panel container: 8px radius, soft border matching cards, soft shadow, popover surface
  content: cn(
    "rounded-lg border border-border/80 bg-popover text-popover-foreground p-1.5",
    "shadow-md shadow-black/5 dark:shadow-black/25",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=right]:slide-in-from-left-1",
    "duration-150 motion-reduce:duration-0 motion-reduce:animate-none",
    "select-none"
  ),

  // Standard menu item: 36px high, 12px px, 6px radius, 8px gap, app font
  item: cn(
    "h-9 px-3 rounded-md flex items-center gap-2",
    "text-xs font-medium font-sans text-foreground/90",
    "hover:bg-secondary/70 hover:text-foreground",
    "focus:bg-secondary/70 focus:text-foreground",
    "outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "transition-colors duration-120 cursor-pointer select-none"
  ),

  // Destructive item: red text only (no red bg), light destructive tint on hover
  itemDestructive: cn(
    "h-9 px-3 rounded-md flex items-center gap-2",
    "text-xs font-medium font-sans text-destructive dark:text-rose-400",
    "hover:bg-destructive/10 hover:text-destructive dark:hover:text-rose-300",
    "focus:bg-destructive/10 focus:text-destructive dark:focus:text-rose-300",
    "outline-none focus-visible:ring-1 focus-visible:ring-destructive/30",
    "transition-colors duration-120 cursor-pointer select-none"
  ),

  // Full-bleed soft 1px divider with consistent 4px vertical margin
  separator: cn("h-px bg-border/70 my-1 -mx-1.5"),

  // Section label: sentence-case, muted text-xs
  label: cn("text-xs font-normal text-muted-foreground font-sans px-3 pt-1 pb-1"),
};

/**
 * Reusable Admin Menu Content wrapper with unified tokens & styling
 */
export function AdminMenuContent({
  className,
  children,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      sideOffset={sideOffset}
      className={cn(adminDropdownStyles.content, className)}
      {...props}
    >
      {children}
    </DropdownMenuContent>
  );
}

/**
 * Reusable Admin Menu Item wrapper
 */
export function AdminMenuItem({
  className,
  isDestructive = false,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & { isDestructive?: boolean }) {
  return (
    <DropdownMenuItem
      className={cn(
        isDestructive ? adminDropdownStyles.itemDestructive : adminDropdownStyles.item,
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuItem>
  );
}

/**
 * Reusable Admin Menu Separator
 */
export function AdminMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator
      className={cn(adminDropdownStyles.separator, className)}
      {...props}
    />
  );
}

/**
 * Reusable Admin Menu Section Label
 */
export function AdminMenuLabel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel>) {
  return (
    <DropdownMenuLabel
      className={cn(adminDropdownStyles.label, className)}
      {...props}
    >
      {children}
    </DropdownMenuLabel>
  );
}

