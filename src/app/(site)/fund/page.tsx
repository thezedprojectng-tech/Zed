import type { Metadata } from "next";
import { Mail, Lightbulb, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Layers, Cpu, Compass } from "lucide-react";
import { FadeIn } from "@/components/site/FadeIn";
import { FundIdeaForm } from "./FundIdeaForm";

export const metadata: Metadata = {
  title: "Fund Your Idea — Let the Zeds Fund It",
  description:
    "Do you have a groundbreaking project or business idea but lack the capital to launch it? Pitch your project to Zed and let the community help bring it to life.",
  openGraph: {
    title: "Fund Your Idea | Zed Project",
    description:
      "Do you have a groundbreaking project or business idea but lack the capital to launch it? Let the Zeds fund it.",
    url: "https://zedproject.ng/fund",
    type: "website",
  },
};

export default function FundIdeaPage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start pb-20 overflow-hidden">
      {/* ── Top Hero Section with Glow & Centered Flow ──────────────────── */}
      <section className="relative w-full pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Hero Title & Subtitle */}
        <FadeIn className="space-y-6 max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Have a bold project idea but lack capital?<br />
            <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Let the Zeds fund it.
            </span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We back ambitious Nigerian youth building real solutions in technology, agriculture, commerce, creative media, and local services. Submit your proposal below for direct review by our team.
          </p>
        </FadeIn>

        {/* Hero Graphic Card Showcase Mockup */}
        <FadeIn delay={0.1} className="w-full max-w-6xl pt-4">
          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-muted/40 p-4 sm:p-8 shadow overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-5 rounded-2xl border border-border/80 bg-background/80 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="font-semibold text-sm text-foreground">Submit Proposal</h3>
                <p className="text-xs text-muted-foreground">Share your core value proposition and financial breakdown.</p>
              </div>

              <div className="p-5 rounded-2xl border border-border/80 bg-background/80 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h3 className="font-semibold text-sm text-foreground">Team Review</h3>
                <p className="text-xs text-muted-foreground">Evaluated strictly on real-world feasibility and execution skill.</p>
              </div>

              <div className="p-5 rounded-2xl border border-border/80 bg-background/80 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="font-semibold text-sm text-foreground">Capital Deployment</h3>
                <p className="text-xs text-muted-foreground">Receive direct grant funding and ongoing mentorship.</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Bento Guidance Cards Strip ────────────────────────────────────── */}
      <section className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FadeIn delay={0.15} className="h-full">
            <div className="h-full p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display font-bold text-base text-foreground">
                  Clear Problem & Plan
                </h2>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Focus on the concrete Nigerian problem you solve and exactly how capital will be deployed.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="h-full">
            <div className="h-full p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display font-bold text-base text-foreground">
                  Any Stage Welcome
                </h2>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  From early napkin concept and Figma prototype to launched projects with existing paying users.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.25} className="h-full">
            <div className="h-full p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display font-bold text-base text-foreground">
                  Direct Team Review
                </h2>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every proposal is reviewed privately by the Zed team. Direct follow-up is made via email and WhatsApp.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Main Form Container Section ───────────────────────────────────── */}
      <section className="w-full max-w-4xl px-4 sm:px-6 lg:px-8 mb-12">
        <FadeIn delay={0.3}>
          <div className="mb-8 text-center space-y-2">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
              Project Proposal Submission
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please fill out all relevant details below. Short, authentic answers perform best during our evaluation cycle.
            </p>
          </div>

          <FundIdeaForm />
        </FadeIn>
      </section>

      {/* ── Fallback Contact Footer Box ───────────────────────────────────── */}
      <section className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={0.35}>
          <footer className="rounded-3xl border border-border/80 bg-muted/40 p-8 text-center text-xs sm:text-sm text-muted-foreground space-y-3 shadow-inner">
            <p className="inline-flex items-center justify-center gap-2 flex-wrap font-medium text-foreground">
              <Mail className="w-4 h-4 text-primary" />
              <span>Prefer direct email? Send your pitch deck or overview to</span>
              <a
                href="mailto:thezedprojectng@gmail.com?subject=Project%20Funding%20Proposal"
                className="text-primary hover:underline font-semibold"
              >
                thezedprojectng@gmail.com
              </a>
            </p>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Submitting an idea does not guarantee funding. All applications are evaluated based on feasibility, real-world utility, and team commitment.
            </p>
          </footer>
        </FadeIn>
      </section>
    </div>
  );
}