import type { Metadata } from "next";
import { getPublishedInternships } from "@/lib/internships/queries";
import { InternshipFeedClient } from "./InternshipFeedClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Internship Radar — Student Placements, SIWES & Trainee Roles",
  description:
    "Curated tracking of internship, SIWES, and industrial training placements across Nigeria. Submitted by the community and reviewed for legitimacy.",
  openGraph: {
    title: "Internship Radar — Placements & Trainee Roles in Nigeria",
    description:
      "Find genuine internships, SIWES placements, and graduate trainee programs. Filter by field, location, and work mode.",
    url: "https://zedproject.ng/internships",
    type: "website",
  },
};

export default async function InternshipsPage() {
  const publishedInternships = await getPublishedInternships();

  return (
    <div className="w-full flex-1">
      <InternshipFeedClient initialInternships={publishedInternships} />
    </div>
  );
}
