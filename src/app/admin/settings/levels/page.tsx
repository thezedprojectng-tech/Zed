import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetLevelRequirements } from "./actions";
import { LevelRulesClient } from "./LevelRulesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — Level Promotion Rules",
  description: "Configure automatic promotion requirements per level (2 to 5).",
};

export default async function AdminLevelRulesPage() {
  await requireAdmin();

  const res = await adminGetLevelRequirements();
  const initialRules = res.ok ? res.rules : [];

  return <LevelRulesClient initialRules={initialRules} initialError={res.ok ? undefined : res.error} />;
}

