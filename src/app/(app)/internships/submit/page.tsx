import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitInternshipClient } from "./SubmitInternshipClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit an Opportunity — Internship Radar",
  description: "Submit genuine internship, SIWES, and trainee opportunities for review.",
};

export default async function SubmitInternshipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/internships/submit");
  }

  return (
    <div className="w-full py-6 sm:py-10">
      <SubmitInternshipClient />
    </div>
  );
}
