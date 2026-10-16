"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Compass, Briefcase, Pickaxe, User } from "lucide-react";

const mobileNavItems = [
  { href: "/home", label: "Dashboard", icon: Home },
  { href: "/nav", label: "Zed Nav", icon: Compass },
  { href: "/skill", label: "Skill", icon: Briefcase },
  { href: "/mining", label: "Mining", icon: Pickaxe },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-hairline-t bg-card/95 pb-safe backdrop-blur-md"
    >
      <ul className="flex h-14 w-full items-center justify-around px-2" role="list">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/home"
              ? pathname === "/home"
              : href === "/nav"
              ? pathname === "/nav"
              : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 transition-colors select-none",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-10 items-center justify-center rounded-full transition-all",
                    isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon
                    className="h-4 w-4"
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </div>
                <span className="text-[10px] font-medium tracking-tight leading-none truncate max-w-[64px]">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
