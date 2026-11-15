import type { Metadata } from "next";
import { getPublicNewsPosts } from "@/lib/news/public-queries";
import { NewsListClient } from "./NewsListClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "News & Updates — Zed",
  description:
    "Platform announcements, feature releases and civic guides from Zed.",
  openGraph: {
    title: "News & Updates — Zed",
    description:
      "Platform announcements, feature releases and civic guides from Zed.",
    url: "https://zedproject.ng/news",
    type: "website",
  },
};

export default async function PublicNewsPage() {
  const posts = await getPublicNewsPosts();

  return <NewsListClient initialPosts={posts} />;
}
