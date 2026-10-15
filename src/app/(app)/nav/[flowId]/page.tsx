import { notFound } from "next/navigation";
import type { Metadata } from "next";
import passportFlow from "@/data/nav/passport.flow.json";
import nyscFlow from "@/data/nav/nysc.flow.json";
import ninBvnFlow from "@/data/nav/nin-bvn.flow.json";
import cacFlow from "@/data/nav/cac.flow.json";
import type { NavFlow } from "@/types/nav";
import { Header } from "@/components/layout/Header";
import { FlowRunner } from "@/components/nav/FlowRunner";
import { navFlowSchema } from "@/lib/nav/schema";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <>
      <Header
        title={flow.title}
        subtitle={`${flow.category} · ~${flow.estimatedMinutes} min · ${difficultyLabel}`}
        actions={
          <Link
            href="/nav"
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to all guides"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Guides
          </Link>
        }
      />

      <div className="mx-auto max-w-8xl px-4 py-6">
        {/* Flow meta */}
        <div className="mb-6 flex items-center justify-between border-hairline-b pb-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {flow.steps.length} Steps · Source verified{" "}
            {new Date(flow.lastVerified).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <a
            href={flow.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            Official Source ↗
          </a>
        </div>

        {/* Flow runner (client component) */}
        <FlowRunner flow={flow} />
      </div>
    </>
  );
}
