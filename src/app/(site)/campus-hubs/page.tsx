import type { Metadata } from "next";
import { getPublishedCampusHubs } from "@/lib/campus-hubs/queries";
import { CampusHubDirectoryClient } from "./CampusHubDirectoryClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Campus Hubs — University Mobilization & Student Guides",
  description:
    "University-specific clearance checklists, hostel accommodation guides, and departmental walkthroughs for Nigerian university campuses.",
  openGraph: {
    title: "Campus Hubs — Nigerian University Guides",
    description:
      "Clearance checklists, hostel accommodation, and departmental guides across Nigerian universities.",
    url: "https://zedproject.ng/campus-hubs",
    type: "website",
  },
};

export default async function CampusHubsPage() {
  const hubs = await getPublishedCampusHubs();

  return (
    <main id="main-content" className="w-full flex-1">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 sm:space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-wider text-[#2E82F7] font-semibold">
            Campus Hubs · University Directory
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-display">
            Campus Guides
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Institution-specific clearance checklists, hostel walkthroughs, and departmental guidance curated for Nigerian students.
          </p>
        </div>

        {/* Directory Client */}
        <CampusHubDirectoryClient initialHubs={hubs} />
      </div>
    </main>
  );
}

