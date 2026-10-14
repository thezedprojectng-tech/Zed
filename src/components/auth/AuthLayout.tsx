"use client";

import Link from "next/link";
import Image from "next/image";
import { GrainGradient } from "@paper-design/shaders-react";
import { ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  rightHeadline?: React.ReactNode;
  rightSubtext?: string;
  rightFooterLeft?: string;
  rightFooterRight?: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  rightHeadline,
  rightSubtext,
  rightFooterLeft,
  rightFooterRight,
}: AuthLayoutProps) {
  return (
    <section className="min-h-screen bg-background p-3 text-foreground antialiased [font-synthesis:none]">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left Form Container */}
        <div className="flex min-h-[640px] items-center rounded-2xl border border-hairline bg-card px-6 py-10 sm:px-10 lg:min-h-0 lg:px-14 lg:py-20 xl:px-20">
          <div className="mx-auto w-full max-w-[480px]">
            {/* Brand Logo */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="The Zed Project Home">
                <Image
                  src="/icons/zed-logo-full-dark.png"
                  alt="The Zed Project"
                  width={140}
                  height={70}
                  priority
                  className="h-8 sm:h-9 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/icons/zed-logo-full-light.png"
                  alt="The Zed Project"
                  width={140}
                  height={70}
                  priority
                  className="h-8 sm:h-9 w-auto object-contain hidden dark:block"
                />
                <span className="font-mono text-[10px] uppercase font-semibold text-primary border border-primary/20 bg-primary/10 px-2 py-0.5 rounded">
                  CIVIL v1.0
                </span>
              </Link>
            </div>

            {/* Header Titles */}
            <div className="space-y-2 mb-8">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                {title}
              </h1>
              <p className="type-body text-muted-foreground text-sm sm:text-base leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Form Content */}
            {children}
          </div>
        </div>

        {/* Right SolaceUI Ambient Shader Column */}
        <div className="relative hidden lg:flex min-h-[720px] overflow-hidden rounded-2xl bg-[#0a0a0b] p-8 text-white sm:p-12 lg:min-h-0 border border-hairline">
          {/* SolaceUI GrainGradient Shader configured with Zed's Emerald/Dark palette */}
          <GrainGradient
            speed={0.8}
            scale={1.2}
            rotation={45}
            offsetX={0}
            offsetY={0}
            softness={0.65}
            intensity={0.4}
            noise={0.2}
            shape="corners"
            frame={2854.5}
            colors={["#0A0A0B", "#059669", "#3ECF8E", "#0A0A0B"]}
            colorBack="#0A0A0B"
            className="absolute inset-0 bg-[#0a0a0b]"
          />

          {/* Overlay Content */}
          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            {/* Top Tag */}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-300 font-semibold">
                NIGERIAN CIVIC INFRASTRUCTURE · 2026
              </span>
            </div>

            {/* Middle Editorial Headline */}
            <div className="max-w-[560px] space-y-4 py-12">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] text-white leading-[1.04]">
                {rightHeadline || (
                  <>
                    Every next move,
                    <br />
                    in one{" "}
                    <span className="font-serif italic font-normal text-emerald-400">
                      place.
                    </span>
                  </>
                )}
              </h2>
              <p className="type-body text-white/70 text-base leading-relaxed max-w-md">
                {rightSubtext ||
                  "Deterministic bureaucratic navigation for Nigerian youth. Passport renewals, NYSC call-up, and harmonised civil records."}
              </p>
            </div>

            {/* Bottom Status Card */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[11px] text-white/60">
              <span>{rightFooterLeft || "FEDERATION WIDE COVERAGE"}</span>
              <span className="text-emerald-400">{rightFooterRight || "SECURE HTTPS"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
