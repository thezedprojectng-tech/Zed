import type { MetadataRoute } from "next";
import { getPublishedRoles } from "@/lib/careers/queries";
import { getPublishedInternshipsForSitemap } from "@/lib/internships/queries";
import { getPublishedCampusHubsForSitemap } from "@/lib/campus-hubs/queries";
import { getPublishedAlumniForSitemap } from "@/lib/alumni-office-hours/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedproject.ng";
  const lastModified = new Date();

  const routes = [
    "",
    "/careers",
    "/internships",
    "/campus-hubs",
    "/alumni-office-hours",
    "/alumni-office-hours/apply",
    "/ambassadors",
    "/mentorship",
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
        : route === "/careers" ||
            route === "/internships" ||
            route === "/campus-hubs" ||
            route === "/alumni-office-hours"
          ? ("weekly" as const)
          : ("monthly" as const),
    priority:
      route === ""
        ? 1.0
        : route === "/careers" ||
            route === "/internships" ||
            route === "/campus-hubs" ||
            route === "/alumni-office-hours"
          ? 0.8
          : 0.6,
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

  let campusHubEntries: MetadataRoute.Sitemap = [];
  try {
    const hubs = await getPublishedCampusHubsForSitemap();
    campusHubEntries = hubs.map((hub) => ({
      url: `${baseUrl}/campus-hubs/${hub.slug}`,
      lastModified: new Date(hub.published_at || hub.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    campusHubEntries = [];
  }

  let alumniEntries: MetadataRoute.Sitemap = [];
  try {
    const alumni = await getPublishedAlumniForSitemap();
    alumniEntries = alumni.map((item) => ({
      url: `${baseUrl}/alumni-office-hours/${item.id}`,
      lastModified: new Date(item.published_at || item.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    alumniEntries = [];
  }

  return [
    ...staticEntries,
    ...jobEntries,
    ...internshipEntries,
    ...campusHubEntries,
    ...alumniEntries,
  ];
}
