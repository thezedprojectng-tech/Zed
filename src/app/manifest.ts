import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zed",
    short_name: "Zed",
    description:
      "The civil guide for Nigerian Gen Z – navigate bureaucracy with confidence.",
    start_url: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07101c",
    theme_color: "#101b2c",
    categories: ["productivity", "lifestyle", "education"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
