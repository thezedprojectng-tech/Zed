import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { CenterTracker } from "@/components/nav/CenterTracker";

export const metadata: Metadata = { title: "Passport Centers" };

export default function PassportCentersPage() {
  return (
    <>
      <Header
        title="Passport Centers"
        subtitle="Community-sourced wait times near you."
      />
      <section className="container-mobile py-4">
        <CenterTracker />
      </section>
    </>
  );
}
