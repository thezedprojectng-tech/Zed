import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Rocket, Mail, Lightbulb, CheckCircle, ShieldAlert } from "lucide-react";
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
    <div className="w-full flex-1 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <header className="space-y-4 mb-10">

        {/* Poster context: Headline & Subheadline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0f0f0f] leading-[1.15]">
          Do you have a groundbreaking project or business idea but lack the capital to launch it?
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-primary">
          Let the Zeds fund it.
        </p>

        <p className="text-sm sm:text-base text-[#0f0f0f] max-w-2xl leading-relaxed pt-2">
          We back ambitious Nigerian youth building real solutions in technology, agriculture,
          commerce, creative industries, and local services. Submit your proposal below
          for evaluation by our team.
        </p>
      </header>

      {/* ── Informational Notice ──────────────────────────────────────────── */}
      <aside aria-label="Submission Guidelines" className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            Clear Problem & Plan
          </div>
          <p className="text-xs text-muted-foreground">
            Focus on the actual problem you are tackling and how the specific capital amount will be used.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            Any Stage Welcome
          </div>
          <p className="text-xs text-muted-foreground">
            Whether at the concept stage, with a working prototype, or already launched with early users.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
            Direct Team Review
          </div>
          <p className="text-xs text-muted-foreground">
            Submissions are privately reviewed by the Zed team. Contact is made directly by email.
          </p>
        </div>
      </aside>

      {/* ── Submission Form Component ─────────────────────────────────────── */}
      <main>
        <FundIdeaForm />
      </main>

      {/* ── Fallback Contact Line ─────────────────────────────────────────── */}
      <footer className="mt-12 text-center text-sm text-muted-foreground space-y-2">
        <p className="inline-flex items-center justify-center gap-1.5 flex-wrap">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span>Prefer email? Send your proposal to</span>
          <a
            href="mailto:thezedprojectng@gmail.com?subject=Project%20Funding%20Proposal"
            className="text-primary hover:underline font-medium"
          >
            thezedprojectng@gmail.com
          </a>
        </p>
        <p className="text-xs text-muted-foreground/80">
          Submitting an idea does not guarantee funding. All applications are reviewed based on merit and feasibility.
        </p>
      </footer>
    </div>
  );
}
