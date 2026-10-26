"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Compass,
  Home,
  User,
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  Moon,
  Sun,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
} from "lucide-react";
import { SOCIAL_LINKS, XIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from "@/data/socials";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Zed Quick Navigation"
      description="Search Zed Nav guides, processes, and dashboard routes"
    >
      <CommandInput placeholder="Search routes, Zed Nav guides, or actions..." />
      <CommandList>
        <CommandEmpty className="py-8 text-center text-xs text-muted-foreground font-sans">
          No matching guide or route found.
        </CommandEmpty>

        <CommandGroup heading="Platform Routes">
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/home"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Dashboard</span>
              <span className="text-[11px] text-muted-foreground">
                Overview, active application status, and guide intelligence
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => router.push("/nav"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-muted-foreground">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Zed Nav</span>
              <span className="text-[11px] text-muted-foreground">
                Step-by-step civic and administrative navigation playbooks
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => router.push("/profile"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Profile & Credentials</span>
              <span className="text-[11px] text-muted-foreground">
                Verification status, progression levels, and saved records
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => router.push("/market"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Zed Market</span>
              <span className="text-[11px] text-muted-foreground">
                Buy and sell with verified users — phones, books, services, and more
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Zed Nav Guides">
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/nav/passport"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-primary/10 border-primary/20 shrink-0 text-primary">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Nigerian Passport Application</span>
                <span className="font-mono text-[10px] text-muted-foreground">NIS-01</span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                Official portal enrollment, fee structure, biometric slip, and collection
              </span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => router.push("/nav/nysc"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-primary/10 border-primary/20 shrink-0 text-primary">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">NYSC Mobilisation</span>
                <span className="font-mono text-[10px] text-muted-foreground">NYSC-02</span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                Senate list verification, green card checklist, camp medicals, call-up
              </span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => router.push("/nav/nin-bvn"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-primary/10 border-primary/20 shrink-0 text-primary">
              <Fingerprint className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">NIN & BVN Harmonisation</span>
                <span className="font-mono text-[10px] text-muted-foreground">NIMC-03</span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                Name order mismatch, date of birth correction, bank verification, SIM unbarring
              </span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect(() => router.push("/nav/cac"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-primary/10 border-primary/20 shrink-0 text-primary">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">CAC Business Registration</span>
                <span className="font-mono text-[10px] text-muted-foreground">CAC-04</span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                CRP name availability reservation, business objects drafting, automated TIN
              </span>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions & System">
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/verify-nin"))}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Verify National Identity (NIN)</span>
              <span className="text-[11px] text-muted-foreground">
                Verify your account and unlock Rookie (Level 1)
              </span>
            </div>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              handleSelect(() =>
                setTheme(isDark ? "light" : "dark")
              )
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-muted-foreground">
              {isDark ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">
                Switch to {isDark ? "Light" : "Dark"} Mode
              </span>
              <span className="text-[11px] text-muted-foreground">
                Currently using {isDark ? "Dark" : "Light"} theme
              </span>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Community & Socials">
          <CommandItem
            onSelect={() =>
              handleSelect(() =>
                window.open(SOCIAL_LINKS.whatsapp.href, "_blank", "noopener,noreferrer")
              )
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-[#25D366]/10 border-[#25D366]/20 shrink-0 text-[#25D366]">
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">WhatsApp Channel</span>
              <span className="text-[11px] text-muted-foreground">
                Join the official Zed community channel on WhatsApp
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>

          <CommandItem
            onSelect={() =>
              handleSelect(() =>
                window.open(SOCIAL_LINKS.x.href, "_blank", "noopener,noreferrer")
              )
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-foreground">
              <XIcon className="h-3 w-3" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Follow on X (Twitter)</span>
              <span className="text-[11px] text-muted-foreground">
                @thezedprojectng – updates, announcements, and guides
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>

          <CommandItem
            onSelect={() =>
              handleSelect(() =>
                window.open(SOCIAL_LINKS.instagram.href, "_blank", "noopener,noreferrer")
              )
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-[#E4405F]/10 border-[#E4405F]/20 shrink-0 text-[#E4405F]">
              <InstagramIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Follow on Instagram</span>
              <span className="text-[11px] text-muted-foreground">
                @thezedprojectng – visual guides, infographics, and highlights
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>

          <CommandItem
            onSelect={() =>
              handleSelect(() =>
                window.open(SOCIAL_LINKS.tiktok.href, "_blank", "noopener,noreferrer")
              )
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border-hairline bg-secondary shrink-0 text-foreground">
              <TikTokIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-foreground">Follow on TikTok</span>
              <span className="text-[11px] text-muted-foreground">
                @thezedprojectng – short-form explainers, updates & community videos
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Sleek Keyboard Helper Footer */}
      <div className="flex items-center justify-between border-t border-hairline bg-card/60 px-4 py-2.5 text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">↑</kbd>
            <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">↓</kbd>
            <span className="text-[10px] ml-0.5">Navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-secondary px-1.5 text-[10px]">↵</kbd>
            <span className="text-[10px] ml-0.5">Open</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-secondary px-1 text-[10px]">ESC</kbd>
            <span className="text-[10px] ml-0.5">Dismiss</span>
          </span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground/80">Zed Search</span>
      </div>
    </CommandDialog>
  );
}
