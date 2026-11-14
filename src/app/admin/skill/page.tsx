import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getAdminTracks } from "@/lib/skill/admin-actions";
import { AdminSkillTracksClient } from "./AdminSkillTracksClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Skill Content — Admin Console",
  description: "Manage learning tracks, lessons, publishing status and skill points.",
};

export default async function AdminSkillPage() {
  await requireAdmin();
  const tracks = await getAdminTracks();

  return <AdminSkillTracksClient initialTracks={tracks} />;
}
