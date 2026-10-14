import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { CenterTracker } from "@/components/nav/CenterTracker";

export const metadata: Metadata = {
  title: "Passport Centers Wait-Time Tracker",
  description:
    "Live, crowdsourced queue and wait times for official Nigerian Immigration Passport Offices.",
};

export default function PassportCentersPage() {
  return (
    <>
      <Header
        title="Passport Centers Tracker"
        subtitle="Live crowdsourced queue and processing times reported by citizens on the ground."
      />
      <div className="mx-auto max-w-[1200px] px-3 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8">
        <CenterTracker />
      </div>
    </>
  );
}
