import type { Metadata } from "next";
import { CareersList } from "@/components/careers/CareersList";
import { getPublishedRoles } from "@/lib/careers/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Careers — Help build the OS for Nigerian Gen Z",
  description:
    "Join the team building Zed. Explore open roles or tell us how you can help build the digital operating system for Nigerian youth.",
  openGraph: {
    title: "Careers at Zed — Help build the OS for Nigerian Gen Z",
    description:
      "Join the team building Zed. Explore open roles or message us on WhatsApp to tell us how you can help.",
    url: "https://zedproject.ng/careers",
    type: "website",
  },
};

export default async function CareersPage() {
  const publishedRoles = await getPublishedRoles();

  return (
    <div className="w-full flex-1 py-6 sm:py-12">
      <CareersList jobs={publishedRoles} />
    </div>
  );
}
