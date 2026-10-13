import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = { title: "NYSC – CDS & Clearance" };

export default function NYSCCDSPage() {
  return (
    <>
      <Header title="CDS Logger & Clearance" subtitle="Log your CDS attendance and access clearance templates." />
      <section className="container-mobile py-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          CDS logger and clearance templates — Phase 2
        </p>
      </section>
    </>
  );
}
