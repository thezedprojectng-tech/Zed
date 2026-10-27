import type { MetadataRoute } from "next";
import { getPublishedRoles } from "@/lib/careers/queries";
import { getPublishedInternshipsForSitemap } from "@/lib/internships/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedproject.ng";
  const lastModified = new Date();

  const routes = [
    "",
    "/careers",
    "/internships",
    "/fund",
    "/whitepaper",
    "/privacy",
    "/terms",
    "/cookies",
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency:
      route === ""
        ? ("daily" as const)
        : route === "/careers" || route === "/internships"
          ? ("weekly" as const)
          : ("monthly" as const),
    priority: route === "" ? 1.0 : route === "/careers" || route === "/internships" ? 0.8 : 0.6,
  }));

  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const roles = await getPublishedRoles();
    jobEntries = roles.map((job) => ({
      url: `${baseUrl}/careers/${job.slug}`,
      lastModified: new Date(job.postedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    jobEntries = [];
  }

  let internshipEntries: MetadataRoute.Sitemap = [];
  try {
    const internships = await getPublishedInternshipsForSitemap();
    internshipEntries = internships.map((item) => ({
      url: `${baseUrl}/internships/${item.id}`,
      lastModified: new Date(item.published_at || item.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    internshipEntries = [];
  }

  return [...staticEntries, ...jobEntries, ...internshipEntries];
}
