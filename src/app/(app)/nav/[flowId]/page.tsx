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
import { ArrowLeft, ArrowRight, FileSearch } from "lucide-react";

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

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8">
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

        {/* Call-up parser link for NYSC */}
        {flowId === "nysc" && (
          <aside className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                <FileSearch className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Have your NYSC Call-up Letter?
                </p>
                <p className="text-xs text-muted-foreground">
                  Extract your state code, camp location, and countdown timer on your device.
                </p>
              </div>
            </div>
            <Link
              href="/nav/nysc/call-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              Parse Call-up Letter
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </aside>
        )}

        {/* Flow runner (client component) */}
        <FlowRunner flow={flow} />
      </div>
    </>
  );
}
