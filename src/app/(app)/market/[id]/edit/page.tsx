import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingById, getMyListingContact } from "@/lib/market/actions";
import { EditListingClient } from "./EditListingClient";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Listing | Zed Market",
  description: "Modify your marketplace listing details on Zed.",
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/market/${id}/edit`);
  }

  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  // Only seller or admin can edit
  if (listing.seller_id !== user.id) {
    notFound();
  }

  if (listing.status === "removed") {
    redirect(`/market/${id}`);
  }

  const contactRes = await getMyListingContact(id);

  return (
    <EditListingClient
      listing={listing}
      initialWhatsapp={contactRes.whatsapp || null}
    />
  );
}
