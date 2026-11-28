import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboardAction } from "@/lib/leaderboard/actions";
import { LeaderboardClient } from "./LeaderboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Leaderboard — The Zed Project",
  description:
    "Top community learners by skill points and daily mining consistency.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const res = await getLeaderboardAction("learners", "week", 20);

  return (
    <LeaderboardClient
      initialData={res.ok ? res.data : null}
      initialError={res.ok ? null : res.error}
    />
  );
}
