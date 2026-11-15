"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Compass, Pickaxe, Briefcase, Menu } from "lucide-react";

interface BottomNavProps {
  onOpenDrawer: () => void;
}

const navItems = [
  { href: "/home", label: "Dashboard", icon: Home },
  { href: "/nav", label: "Zed Nav", icon: Compass },
  { href: "/mining", label: "Mining", icon: Pickaxe },
  { href: "/skill", label: "Skill", icon: Briefcase },
] as const;

export function BottomNav({ onOpenDrawer }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-14 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul
        className="flex h-full w-full items-center justify-around px-1"
        role="list"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1 h-full">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full py-1 transition-colors select-none",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-10 items-center justify-center rounded-full transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon
                    className="h-4 w-4 stroke-[1.5]"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-[11px] leading-none font-medium truncate">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}

        {/* More tab — opens MobileDrawer */}
        <li className="flex-1 h-full">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="flex flex-col items-center justify-center gap-1 w-full h-full py-1 text-muted-foreground hover:text-foreground transition-colors select-none"
            aria-label="Open navigation menu"
          >
            <div className="flex h-7 w-10 items-center justify-center rounded-full text-muted-foreground">
              <Menu className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
            </div>
            <span className="text-[11px] leading-none font-medium truncate">
              More
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
