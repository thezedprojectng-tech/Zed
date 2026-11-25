import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getAdminSkillSettings } from "@/lib/skill/admin-actions";
import { AdminSkillSettingsClient } from "./AdminSkillSettingsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Skill Settings — Admin Console",
  description:
    "Configure default pass marks, attempt limits, score bands, and payment details.",
};

export default async function AdminSkillSettingsPage() {
  await requireAdmin();
  const settings = await getAdminSkillSettings();

  return <AdminSkillSettingsClient initialSettings={settings} />;
}
