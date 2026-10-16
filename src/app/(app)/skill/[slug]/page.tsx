import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrackDetail } from "@/lib/skill/actions";
import { TrackDetailClient } from "./TrackDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTrackDetail(slug);

  if (!data) {
    return {
      title: "Track Not Found — Zed Skill",
    };
  }

  return {
    title: `${data.track.title} — Zed Skill`,
    description: data.track.description,
  };
}

export default async function TrackPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const data = await getTrackDetail(slug);

  if (!data) {
    notFound();
  }

  return <TrackDetailClient data={data} />;
}
