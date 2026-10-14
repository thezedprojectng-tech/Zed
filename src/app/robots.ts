import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zedproject.ng";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/profile/", "/home/", "/nav/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
