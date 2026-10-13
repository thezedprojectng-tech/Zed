"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { PageTransition } from "@/components/layout/PageTransition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      {/* Desktop Sidebar (never shown on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Bar with Breadcrumbs, Search, Theme & Profile */}
        <TopBar onOpenCommand={() => setCommandOpen(true)} />

        {/* Subtly dotted main area */}
        <main className="flex-1 bg-dot-grid pb-24 md:pb-12">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Global Command Palette (Cmd/Ctrl + K) */}
      <CommandMenu
        open={commandOpen}
        onOpenChange={(open) => setCommandOpen(open)}
      />

      {/* Floating Scroll-to-Top Button with circular progress ring */}
      <ScrollToTop />

      {/* Mobile Bottom Tab Bar (never shown on desktop) */}
      <BottomNav />
    </div>
  );
}
