import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = { title: "NYSC – PPA & Relocation" };

export default function NYSCPPAPage() {
  return (
    <>
      <Header title="PPA & Relocation Hub" subtitle="Understand your posting and how to request a relocation." />
      <section className="container-mobile py-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          PPA and relocation guide — Phase 2
        </p>
      </section>
    </>
  );
}
