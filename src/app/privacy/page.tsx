import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
        <div className="type-body text-sm text-muted-foreground space-y-4 leading-relaxed">
          <p>
            Zed is built on privacy-by-design principles. We do not sell, rent, or monetize your identity information.
          </p>
          <p>
            Your National Identity Number (NIN) and personal identification data are processed locally on your client device. Verification against NIMC records uses secure cryptographic hashing so raw credentials are never persisted on centralized servers.
          </p>
        </div>
      </div>
    </div>
  );
}
