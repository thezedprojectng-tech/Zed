import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingById } from "@/lib/market/actions";
import { ListingDetailClient } from "./ListingDetailClient";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return {
      title: "Listing Not Found | Zed Market",
    };
  }

  return {
    title: `${listing.title} | Zed Market`,
    description: listing.description.slice(0, 160),
  };
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVerified = false;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .maybeSingle();

    isVerified = profile?.is_verified ?? false;
  }

  return (
    <ListingDetailClient
      listing={listing}
      currentUserId={user?.id || null}
      isCurrentUserVerified={isVerified}
    />
  );
}
