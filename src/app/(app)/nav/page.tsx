import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Fingerprint,
  Building2,
  ArrowRight,
  Clock,
  FileSearch,
  Smartphone,
  FileText,
  MessagesSquare,
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

interface ComingNextItem {
  label: string;
  description: string;
  icon: React.ElementType;
  code: string;
  href?: string;
  live?: boolean;
}

const COMING_NEXT: ComingNextItem[] = [
  {
    label: "Call-up Letter Parser",
    description:
      "Paste your NYSC call-up letter text to extract your state code, camp details, and reporting countdown entirely on your device with a pre-camp checklist.",
    icon: FileSearch,
    code: "NYSC-07",
    href: "/nav/nysc/call-up",
    live: true,
  },
  {
    label: "PPA Hub",
    description:
      "Find and confirm your Place of Primary Assignment. Search verified NYSC-approved organizations, track posting letters, and flag discrepancies before camp ends.",
    icon: MessagesSquare,
    code: "NYSC-05",
  },
  {
    label: "CDS Logger",
    description:
      "Log Community Development Service attendance and track your hours across sessions — your personal record, not an official NYSC document.",
    icon: FileText,
    code: "NYSC-06",
    href: "/nav/nysc/cds",
    live: true,
  },
  {
    label: "Phone OTP Sign-in",
    description:
      "Sign in to Zed with your Nigerian phone number via one-time password, with no email required. Designed with data protection in mind.",
    icon: Smartphone,
    code: "AUTH-02",
  },
];

export default function NavPage() {
  return (
    <div className="mx-auto max-w-8xl px-3 py-6 md:px-8 space-y-10">
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
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Active guides">
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
                        {String(guide.flow.steps.length).padStart(2, "0")} Steps &middot; ~{guide.flow.estimatedMinutes} mins
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
                    Open Guide &rarr;
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* Coming next */}
      <section aria-label="Coming next in Zed Nav" className="space-y-4">
        <div className="flex items-center gap-2 border-hairline-b pb-4">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <h2 className="type-caption text-muted-foreground font-semibold">
            COMING NEXT IN ZED NAV
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMING_NEXT.map((item) => {
            const Icon = item.icon;
            const card = (
              <div
                className={`rounded-xl border-hairline p-5 space-y-3 transition-colors ${
                  item.live
                    ? "border-primary/30 bg-card hover:border-primary/60 cursor-pointer"
                    : "bg-card/40 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md border-hairline ${
                      item.live
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-secondary/60 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] px-1.5 py-0 ${
                      item.live
                        ? "border-primary/40 text-primary bg-primary/5"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {item.live ? "Live" : "Coming soon"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-foreground font-sans flex items-center justify-between">
                    {item.label}
                    {item.live && (
                      <span className="text-[11px] text-primary font-normal">
                        Open tool →
                      </span>
                    )}
                  </h3>
                  <p className="type-small text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground/60">
                  REF: {item.code}
                </div>
              </div>
            );

            if (item.href && item.live) {
              return (
                <Link key={item.code} href={item.href} className="block">
                  {card}
                </Link>
              );
            }

            return <div key={item.code}>{card}</div>;
          })}
        </div>
      </section>
    </div>
  );
}
