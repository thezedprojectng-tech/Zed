import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewListingClient } from "./NewListingClient";

export const metadata: Metadata = {
  title: "Post a Service | Zed Market",
  description: "List your service on Zed Market — design, tutoring, tech, photography, repairs, and more.",
};

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/market/new");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_verified, phone_number")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <NewListingClient
      isVerified={profile?.is_verified ?? false}
      userPhone={profile?.phone_number ?? null}
    />
  );
}
