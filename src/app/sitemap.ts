import type { MetadataRoute } from "next";
import { getPublishedRoles } from "@/lib/careers/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedproject.ng";
  const lastModified = new Date();

  const routes = [
    "",
    "/careers",
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
        : route === "/careers"
          ? ("weekly" as const)
          : ("monthly" as const),
    priority: route === "" ? 1.0 : route === "/careers" ? 0.8 : 0.6,
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

  return [...staticEntries, ...jobEntries];
}
