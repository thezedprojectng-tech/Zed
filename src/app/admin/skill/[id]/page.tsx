import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getAdminTrackDetail } from "@/lib/skill/admin-actions";
import { AdminTrackDetailClient } from "./AdminTrackDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const track = await getAdminTrackDetail(id);
  return {
    title: track ? `Track: ${track.title} — Admin Console` : "Track Details — Admin Console",
    description: "Manage learning track lessons, modules and point configurations",
  };
}

export default async function AdminTrackDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const track = await getAdminTrackDetail(id);

  if (!track) {
    notFound();
  }

  return <AdminTrackDetailClient initialTrack={track} />;
}
