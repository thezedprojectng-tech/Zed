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
    title: track ? `Admin Console — ${track.title}` : "Admin Console — Track Detail",
    description: "Manage learning track lessons and point configurations",
  };
}

export default async function AdminTrackDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const track = await getAdminTrackDetail(id);

  if (!track) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <AdminTrackDetailClient initialTrack={track} />
    </div>
  );
}