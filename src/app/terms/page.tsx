import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign up</span>
        </Link>
        <h1 className="font-display text-3xl font-bold">Terms of Service</h1>
        <div className="type-body text-sm text-muted-foreground space-y-4 leading-relaxed">
          <p>
            Zed provides civic procedural playbooks and directory assistance for Nigerian youth. By using our service, you agree to access official portals through legal means and provide authentic identity verification details.
          </p>
          <p>
            Zed does not issue government credentials, passports, or national certificates. We provide deterministic guides, fee audits, and crowd reports to assist your civil journey.
          </p>
        </div>
      </div>
    </div>
  );
}
