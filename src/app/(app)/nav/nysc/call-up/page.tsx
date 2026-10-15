import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CallUpClient } from "@/components/callup/CallUpClient";

export const metadata: Metadata = {
  title: "NYSC Call-up Letter Parser – Zed Nav",
  description:
    "Extract your NYSC state code, deployed state, and reporting countdown entirely on your device. Zero server uploads.",
};

export default async function CallUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/nav/nysc/call-up");
  }

  return <CallUpClient />;
}
