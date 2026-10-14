"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavProgressStore } from "@/store/useNavProgressStore";
import { getLevelName } from "@/types";
import passportFlow from "@/data/nav/passport.flow.json";
import nyscFlow from "@/data/nav/nysc.flow.json";
import ninBvnFlow from "@/data/nav/nin-bvn.flow.json";
import cacFlow from "@/data/nav/cac.flow.json";
import type { NavFlow } from "@/types/nav";
import { MODULES } from "@/data/modules";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

interface HomeGuide {
  id: string;
  href: string;
  flow: NavFlow;
  title: string;
  code: string;
  icon: React.ElementType;
  badge: string;
}

const guides: HomeGuide[] = [
  {
    id: "passport",
    href: "/nav/passport",
    flow: passportFlow as unknown as NavFlow,
    title: "Nigerian Passport",
    code: "NIS-01",
    icon: BookOpen,
    badge: "High Demand",
  },
  {
    id: "nysc",
    href: "/nav/nysc",
    flow: nyscFlow as unknown as NavFlow,
    title: "NYSC Mobilisation",
    code: "NYSC-02",
    icon: GraduationCap,
    badge: "Batch A Open",
  },
  {
    id: "nin-bvn",
    href: "/nav/nin-bvn",
    flow: ninBvnFlow as unknown as NavFlow,
    title: "NIN & BVN Harmonisation",
    code: "NIMC-03",
    icon: Fingerprint,
    badge: "Essential",
  },
  {
    id: "cac",
    href: "/nav/cac",
    flow: cacFlow as unknown as NavFlow,
    title: "CAC Business Reg.",
    code: "CAC-04",
    icon: Building2,
    badge: "Incorporation",
  },
];

const civilTips = [
  {
    category: "PASSPORT ENROLLMENT",
    title: "Early Morning Slot Advantage",
    body: "Arrive at Ikoyi or Alausa centers before 08:30 AM. Processing booths prioritize pre-booked online applicants with verified payment slips.",
  },
  {
    category: "NYSC CLEARANCE",
    title: "Valid Medical Certificate",
    body: "Certificates of medical fitness must be issued by a registered General Hospital. Private clinic notes are strictly rejected at camp gates.",
  },
  {
    category: "NATIONAL IDENTITY",
    title: "NIN QR Code Validation",
    body: "Commercial banks and immigration officials require the standard NIMC slip with a scannable QR code. Laminated mini cards often fail verification.",
  },
];

export default function HomePage() {
  const { user, profile } = useAuthStore();
  const { progressMap } = useNavProgressStore();
  const [greeting] = useState(() => getTimeGreeting());
  const [dateString] = useState(() => getFormattedDate());

  const fullName = profile?.full_name || (user?.user_metadata?.full_name as string | undefined);
  const firstName = fullName ? fullName.trim().split(" ")[0] : "there";
  const isVerified = Boolean(profile?.is_verified);
  const civicLevel = profile?.level_id || 1;

  const activeFlow = progressMap["passport"] || {
    flow_id: "passport",
    current_step: "step-3",
    completed_steps: ["step-1", "step-2"],
    updated_at: new Date().toISOString(),
  };

  const totalSteps = passportFlow.steps.length;
  const completedCount = activeFlow.completed_steps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-8 md:py-10 space-y-10">

      {/* ── 1. Header & Time-aware Greeting ───────────────────────────── */}
      <section className="space-y-2 border-hairline-b pb-8">
        <p className="type-caption text-muted-foreground">
          {dateString || "FEDERAL REPUBLIC OF NIGERIA"}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h1 className="type-display text-foreground">
            {greeting}, {firstName}.
          </h1>
          <span className="type-caption text-muted-foreground font-mono">
            {getLevelName(civicLevel).toUpperCase()} · {isVerified ? "VERIFIED" : "UNVERIFIED"}
          </span>
        </div>
        <p className="type-body text-muted-foreground max-w-3xl">
          Track official document progress, bypass center congestion, and navigate{" "}
          <span className="inline-block">
            Nigerian civic processes{" "}
            <span className="type-accent-serif text-foreground">seamlessly</span>.
          </span>
        </p>
      </section>

      {/* ── 2. Verification Banner (Hidden when verified) ─────────────── */}
      {!isVerified && (
        <section aria-label="Identity Verification">
          <Card className="p-0 border-hairline bg-card relative overflow-hidden">
            {/* 2px accent line at top */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-primary rounded-t-xl" />
            <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <span className="type-caption text-primary">
                    IDENTITY VERIFICATION
                  </span>
                </div>
                <h2 className="type-h2 text-foreground">
                  Verify your NIN to level up
                </h2>
                <p className="type-small text-muted-foreground">
                  Verify your 11-digit National Identity Number to confirm your verified status and unlock your next progression level.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-48">
                    <Progress value={33} className="h-1.5 bg-secondary" />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Level: {getLevelName(civicLevel)}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-5"
                >
                  <Link href="/verify-nin">
                    Verify National Identity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ── 3. Active Civil Application ───────────────────────────────── */}
      <section aria-label="In-progress civil flow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="type-caption text-muted-foreground font-semibold">
            ACTIVE ZED NAV GUIDE
          </h2>
          <span className="type-caption text-primary">IN PROGRESS</span>
        </div>

        <Card className="p-0 border-hairline bg-card hover:border-border transition-colors">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="type-caption text-muted-foreground">
                  NIS-01 · NIGERIAN IMMIGRATION SERVICE
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] border-primary/30 bg-primary/10 text-primary px-1.5 py-0"
                >
                  RENEWAL (32 PAGES)
                </Badge>
              </div>

              <h3 className="type-h2 text-foreground">
                Standard Passport Application & Renewal
              </h3>

              <p className="type-small text-muted-foreground">
                Current Step:{" "}
                <strong className="text-foreground font-medium">
                  Biometric Capture Slip Preparation
                </strong>
                . Ensure your printed National Identity slip and transaction reference code match your enrollment form.
              </p>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 max-w-xs">
                  <Progress value={progressPercent} className="h-1.5 bg-secondary" />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {completedCount} of {totalSteps} steps completed ({progressPercent}%)
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                asChild
                variant="outline"
                className="border-hairline hover:bg-secondary hover:text-foreground text-foreground px-5 font-medium"
              >
                <Link href="/nav/passport">
                  Resume Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ── 4. Civil Process Guides Grid ──────────────────────────────── */}
      <section aria-label="Official Civil Guides" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-foreground">Zed Nav Guides</h2>
            <p className="type-small text-muted-foreground mt-0.5">
              End-to-end bureaucratic navigation with official requirements, fees, and traps to avoid.
            </p>
          </div>
          <Link
            href="/nav"
            className="hidden sm:inline-flex items-center gap-1 type-caption text-primary hover:underline"
          >
            <span>VIEW ALL</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.id}
                href={guide.href}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              >
                <Card className="p-0 h-full border-hairline bg-card hover:border-border transition-all duration-150">
                  <div className="p-5 sm:p-6 flex flex-col justify-between h-full gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border-hairline bg-secondary text-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {String(guide.flow.steps.length).padStart(2, "0")} STEPS · ~{guide.flow.estimatedMinutes} MINS
                          </span>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] border-border text-muted-foreground px-1.5 py-0"
                          >
                            {guide.badge}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h3 className="type-h3 text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                          <span>{guide.title}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </h3>
                        <p className="type-small text-muted-foreground mt-1.5 leading-relaxed">
                          {guide.flow.summary}
                        </p>
                      </div>
                    </div>

                    <div className="border-hairline-t pt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                      <span>CODE: {guide.code}</span>
                      <span className="group-hover:text-foreground transition-colors">
                        Start walkthrough →
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 5. Field Intelligence Tips ────────────────────────────────── */}
      <section aria-label="Field intelligence & tips" className="space-y-3">
        <h2 className="type-caption text-muted-foreground font-semibold">
          FIELD INTELLIGENCE & INSIDER TIPS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {civilTips.map((tip, idx) => (
            <div
              key={idx}
              className="rounded-xl border-hairline bg-card p-5 space-y-2 hover:border-border transition-colors"
            >
              <span className="type-caption text-primary font-semibold">
                {tip.category}
              </span>
              <h3 className="text-xs font-semibold text-foreground font-sans">
                {tip.title}
              </h3>
              <p className="type-small text-muted-foreground leading-relaxed">
                {tip.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Platform Modules ───────────────────────────────────────── */}
      <section aria-label="Platform modules" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h2 text-foreground">Zed Modules</h2>
            <p className="type-small text-muted-foreground mt-0.5">
              The full Zed platform. One module is live today; more are in development.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isLive = mod.status === "live";
            const href = isLive ? (mod.href ?? "/nav") : `/modules/${mod.slug}`;

            return (
              <Link
                key={mod.slug}
                href={href}
                className={cn(
                  "group rounded-xl border-hairline bg-card p-4 flex flex-col gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isLive
                    ? "hover:border-border hover:bg-card/90"
                    : "opacity-60 hover:opacity-80 cursor-default"
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border-hairline",
                      isLive
                        ? "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  {isLive ? (
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] border-primary/20 bg-primary/10 text-primary px-1.5 py-0"
                    >
                      Live
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] border-border text-muted-foreground/60 px-1.5 py-0"
                    >
                      Soon
                    </Badge>
                  )}
                </div>
                <div>
                  <p className={cn("text-xs font-semibold leading-tight", isLive ? "text-foreground" : "text-muted-foreground")}>
                    {mod.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                    {mod.phase}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
