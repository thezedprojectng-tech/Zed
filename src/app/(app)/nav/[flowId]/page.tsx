import { notFound } from "next/navigation";
import type { Metadata } from "next";
import passportFlow from "@/data/nav/passport.flow.json";
import nyscFlow from "@/data/nav/nysc.flow.json";
import ninBvnFlow from "@/data/nav/nin-bvn.flow.json";
import cacFlow from "@/data/nav/cac.flow.json";
import type { NavFlow } from "@/types/nav";
import { FlowRunner } from "@/components/nav/FlowRunner";
import { navFlowSchema } from "@/lib/nav/schema";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileSearch, ExternalLink } from "lucide-react";

// ── Flow registry ─────────────────────────────────────────────────────────────

const RAW_FLOWS = [passportFlow, nyscFlow, ninBvnFlow, cacFlow] as unknown[];
const FLOWS: NavFlow[] = RAW_FLOWS.map((raw) => navFlowSchema.parse(raw) as NavFlow);
const FLOW_MAP = new Map<string, NavFlow>(FLOWS.map((f) => [f.id, f]));

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return FLOWS.map((f) => ({ flowId: f.id }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ flowId: string }>;
}): Promise<Metadata> {
  const { flowId } = await params;
  const flow = FLOW_MAP.get(flowId);
  if (!flow) return { title: "Guide Not Found" };
  return {
    title: `${flow.title} – Zed Nav`,
    description: flow.summary,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function FlowPage({
  params,
}: {
  params: Promise<{ flowId: string }>;
}) {
  const { flowId } = await params;
  const flow = FLOW_MAP.get(flowId);
  if (!flow) notFound();

  const difficultyLabel = {
    easy: "Easy",
    moderate: "Moderate",
    involved: "Involved",
  }[flow.difficulty];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24 sm:pb-8">
      {/* ── 1. Top Navigation & Header ─────────────────────────────── */}
      <div className="space-y-4 border-b border-border/50 pb-5">
        <div>
          <Link
            href="/nav"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>All civic guides</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {flow.category}
              </span>
              <span className="text-xs text-muted-foreground font-sans">
                ~{flow.estimatedMinutes} mins · {difficultyLabel}
              </span>
            </div>
            <h1 className="text-[26px] leading-[34px] sm:text-[28px] sm:leading-[36px] font-semibold text-foreground tracking-tight">
              {flow.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="font-sans">
              Verified {new Date(flow.lastVerified).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <a
              href={flow.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <span>Source</span>
              <ExternalLink className="h-3 w-3 stroke-[1.5]" />
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. Call-up letter banner for NYSC ─────────────────────── */}
      {flowId === "nysc" && (
        <aside
          aria-label="Call-up letter extraction tool"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-secondary/20 p-4 border-l-4 border-l-primary"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary shrink-0">
              <FileSearch className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                Have your NYSC call-up letter?
              </p>
              <p className="text-xs text-muted-foreground">
                Extract your state code, camp location, and countdown timer directly on your device.
              </p>
            </div>
          </div>
          <Link
            href="/nav/nysc/call-up"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          >
            <span>Parse call-up letter</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
          </Link>
        </aside>
      )}

      {/* ── 3. Flow runner (interactive client component) ──────────── */}
      <FlowRunner flow={flow} />
    </div>
  );
}
