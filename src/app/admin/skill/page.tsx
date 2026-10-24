import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getAdminTracks } from "@/lib/skill/admin-actions";
import { AdminSkillTracksClient } from "./AdminSkillTracksClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Skill Content",
  description: "Manage learning tracks, lessons, publishing status and skill points.",
};

export default async function AdminSkillPage() {
  await requireAdmin();
  const tracks = await getAdminTracks();

  return (
    <div className="max-w-6xl mx-auto py-2">
      <AdminSkillTracksClient initialTracks={tracks} />
    </div>
  );
}
