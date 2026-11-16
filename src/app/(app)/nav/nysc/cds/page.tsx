import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { CdsLoggerClient } from "@/components/cds/CdsLoggerClient";
import {
  fetchCdsLogs,
  createCdsLog,
  updateCdsLog,
  deleteCdsLog,
} from "./actions";

export const metadata: Metadata = {
  title: "CDS Logger – Zed Nav",
  description:
    "Track your NYSC Community Development Service attendance. Personal records only — not an official NYSC document.",
};

export default async function CDSLoggerPage() {
  // ── Server-side auth guard ──────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/nav/nysc/cds");

  // ── Initial data fetch ──────────────────────────────────────────────────────
  const result = await fetchCdsLogs();
  const initialLogs = "logs" in result ? result.logs : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <Header
        backHref="/nav"
        backLabel="Back to Zed Nav"
        title="CDS logger"
        subtitle="Track your Community Development Service attendance. Sessions are stored securely and tied to your account."
      />

      <CdsLoggerClient
        initialLogs={initialLogs}
        onCreate={createCdsLog}
        onUpdate={updateCdsLog}
        onDelete={deleteCdsLog}
      />
    </div>
  );
}
