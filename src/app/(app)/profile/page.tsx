import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <>
      <Header title="Your Profile" subtitle="Manage your account and level." />
      <section className="container-mobile py-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          {/* Phase 2: avatar, level badge, stats, settings */}
          Profile — Phase 2
        </p>
      </section>
    </>
  );
}
