"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { PageTransition } from "@/components/layout/PageTransition";
import { DobGateDialog } from "@/components/auth/DobGateDialog";
import { AppSidebarProvider } from "@/components/layout/AppSidebarContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AppSidebarProvider>
      <div className="flex min-h-dvh w-full bg-background text-foreground">
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
          {/* Top Bar — includes mobile hamburger on small screens and desktop sidebar toggle */}
          <TopBar
            onOpenCommand={() => setCommandOpen(true)}
            drawerOpen={drawerOpen}
            onDrawerOpen={() => setDrawerOpen(true)}
            onDrawerClose={() => setDrawerOpen(false)}
          />

          {/* Main content — stretched surface, clean bottom padding */}
          <main className="flex-1 pb-8 md:pb-12">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        {/* Global Command Palette (Cmd/Ctrl + K) */}
        <CommandMenu
          open={commandOpen}
          onOpenChange={(open) => setCommandOpen(open)}
        />

        {/* Mandatory Date of Birth gate dialog for existing users */}
        <DobGateDialog />
      </div>
    </AppSidebarProvider>
  );
}
