import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { adminGetZedSettings } from "@/lib/withdraw/actions";
import { ZedSettingsClient } from "./ZedSettingsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Console — ZED Token & Withdrawal Settings",
  description: "Configure token price (NGN), redemption limits, and audit price history.",
};

export default async function AdminZedSettingsPage() {
  await requireAdmin();

  const res = await adminGetZedSettings();
  if (!res.ok) {
    throw new Error(res.error);
  }

  return (
    <ZedSettingsClient
      initialSettings={res.settings}
      initialHistory={res.history}
    />
  );
}
