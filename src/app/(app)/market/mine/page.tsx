import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyListings } from "@/lib/market/actions";
import { MyListingsClient } from "./MyListingsClient";

export const metadata: Metadata = {
  title: "My Listings | Zed Market",
  description: "View and manage your marketplace listings on Zed.",
};

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/market/mine");
  }

  const listings = await getMyListings();

  return <MyListingsClient initialListings={listings} />;
}
