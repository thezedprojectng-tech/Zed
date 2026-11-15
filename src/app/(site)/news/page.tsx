import type { Metadata } from "next";
import { getPublicNewsPosts } from "@/lib/news/public-queries";
import { NewsListClient } from "./NewsListClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "News & Updates — The Zed Chronicle",
  description:
    "Explore platform announcements, feature releases, civil procedure guides, and community dispatches from Zed.",
  openGraph: {
    title: "News & Updates — The Zed Chronicle",
    description:
      "Explore platform announcements, feature releases, civil procedure guides, and community dispatches from Zed.",
    url: "https://zedproject.ng/news",
    type: "website",
  },
};

export default async function PublicNewsPage() {
  const posts = await getPublicNewsPosts();

  return <NewsListClient initialPosts={posts} />;
}
