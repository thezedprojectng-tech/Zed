import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import passportFlow from "@/data/nav/passport.flow.json";
import nyscFlow from "@/data/nav/nysc.flow.json";
import ninBvnFlow from "@/data/nav/nin-bvn.flow.json";
import cacFlow from "@/data/nav/cac.flow.json";
import type { NavFlow } from "@/types/nav";

export const metadata: Metadata = {
  title: "Civil Guides – Zed Nav",
  description:
    "Interactive step-by-step guidance for Nigerian passport, NYSC, NIN-BVN, and CAC registrations.",
};

interface GuideItem {
  flow: NavFlow;
  href: string;
  code: string;
  icon: React.ElementType;
}

const guides: GuideItem[] = [
  {
    flow: passportFlow as unknown as NavFlow,
    href: "/nav/passport",
    code: "NIS-01",
    icon: BookOpen,
  },
  {
    flow: nyscFlow as unknown as NavFlow,
    href: "/nav/nysc",
    code: "NYSC-02",
    icon: GraduationCap,
  },
  {
    flow: ninBvnFlow as unknown as NavFlow,
    href: "/nav/nin-bvn",
    code: "NIMC-03",
    icon: Fingerprint,
  },
  {
    flow: cacFlow as unknown as NavFlow,
    href: "/nav/cac",
    code: "CAC-04",
    icon: Building2,
  },
];

export default function NavPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 space-y-6">
      {/* Header */}
      <section className="space-y-1.5 border-hairline-b pb-6">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          CIVIL INSTITUTION CATALOGUE
        </span>
        <h1 className="type-display text-foreground">Zed Nav Guides</h1>
        <p className="type-body text-muted-foreground max-w-2xl">
          Verified workflows for official Nigerian administrative procedures.
          Every step is vetted against active 2026 agency requirements.
        </p>
      </section>

      {/* Guides Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Link
              key={guide.href}
              href={guide.href}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              <Card className="h-full border-hairline bg-card/70 hover:bg-card hover:border-border transition-all duration-150 p-5 sm:p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border-hairline bg-secondary/80 text-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {String(guide.flow.steps.length).padStart(2, "0")} Steps · ~{guide.flow.estimatedMinutes} mins
                      </span>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] border-border text-muted-foreground px-1.5 py-0"
                      >
                        {guide.flow.category}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h2 className="type-h3 text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{guide.flow.title}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </h2>
                    <p className="type-small text-muted-foreground mt-1.5 leading-relaxed">
                      {guide.flow.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-hairline-t mt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>REF: {guide.code}</span>
                  <span className="group-hover:text-foreground transition-colors">
                    Open Guide →
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
