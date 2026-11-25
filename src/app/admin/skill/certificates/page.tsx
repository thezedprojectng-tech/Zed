import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  adminListCertificateOrdersAction,
  adminListIssuedCertificatesAction,
} from "@/lib/skill/admin-actions";
import { AdminSkillCertificatesClient } from "./AdminSkillCertificatesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Certificates — Skill Admin — Zed",
  description: "Review manual certificate orders and manage issued certificates.",
};

export default async function AdminSkillCertificatesPage() {
  await requireAdmin();

  const [ordersRes, issuedRes] = await Promise.all([
    adminListCertificateOrdersAction("pending"),
    adminListIssuedCertificatesAction(),
  ]);

  return (
    <AdminSkillCertificatesClient
      initialPendingOrders={ordersRes.ok ? (ordersRes.data ?? []) : []}
      initialOrdersError={ordersRes.ok ? null : ordersRes.error}
      initialIssuedCertificates={issuedRes.ok ? (issuedRes.data ?? []) : []}
      initialIssuedError={issuedRes.ok ? null : issuedRes.error}
    />
  );
}
