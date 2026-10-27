"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Flag,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Edit,
  Tag,
  AlertCircle,
  Eye,
} from "lucide-react";
import { WhatsAppIcon } from "@/data/socials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CATEGORY_DEFINITIONS,
  STATUS_LABELS,
  formatNgnPrice,
  buildWhatsAppLink,
  SAFETY_DISCLAIMER,
} from "@/lib/market/helpers";
import { getListingContact, reportListing, markListingSold } from "@/lib/market/actions";
import type { MarketListing, MarketReportReason } from "@/lib/market/types";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import { isVerifiedBadgeEnabled, shouldShowContactWarning } from "@/lib/verification/flags";

interface ListingDetailClientProps {
  listing: MarketListing;
  currentUserId?: string | null;
  isCurrentUserVerified?: boolean;
}

export function ListingDetailClient({
  listing,
  currentUserId,
  isCurrentUserVerified = false,
}: ListingDetailClientProps) {
  const isOwner = currentUserId === listing.seller_id;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cautionModalOpen, setCautionModalOpen] = useState(false);
  const [sellerVerified, setSellerVerified] = useState<boolean>(listing.seller_verified ?? false);
  const [contactState, setContactState] = useState<{
    loading: boolean;
    whatsapp: string | null;
    hasContact: boolean;
    error: string | null;
    revealed: boolean;
  }>({
    loading: false,
    whatsapp: null,
    hasContact: false,
    error: null,
    revealed: false,
  });

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<MarketReportReason>("scam");
  const [reportNote, setReportNote] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(listing.status);

  const images = listing.image_paths && listing.image_paths.length > 0 ? listing.image_paths : [];
  const categoryMeta = CATEGORY_DEFINITIONS[listing.category];
  const statusMeta = STATUS_LABELS[currentStatus];

  const executeRevealContact = async () => {
    setContactState((prev) => ({ ...prev, loading: true, error: null }));

    const res = await getListingContact(listing.id);
    if (!res.success) {
      setContactState({
        loading: false,
        whatsapp: null,
        hasContact: false,
        error: res.error || "Failed to retrieve seller contact.",
        revealed: false,
      });
      return;
    }

    if (typeof res.seller_verified === "boolean") {
      setSellerVerified(res.seller_verified);
    }

    setContactState({
      loading: false,
      whatsapp: res.whatsapp || null,
      hasContact: res.has_contact,
      error: null,
      revealed: true,
    });

    if (res.has_contact && res.whatsapp) {
      const waUrl = buildWhatsAppLink(res.whatsapp, listing.title);
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleRevealContact = () => {
    if (!currentUserId) {
      window.location.href = `/login?redirect=/market/${listing.id}`;
      return;
    }

    if (shouldShowContactWarning(sellerVerified)) {
      setCautionModalOpen(true);
      return;
    }

    executeRevealContact();
  };

  const handleCopyPhone = () => {
    if (!contactState.whatsapp) return;
    navigator.clipboard.writeText(contactState.whatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      window.location.href = `/login?redirect=/market/${listing.id}`;
      return;
    }

    setReportSubmitting(true);
    setReportError(null);

    const res = await reportListing({
      listing_id: listing.id,
      reason: reportReason,
      note: reportNote.trim() || null,
    });

    setReportSubmitting(false);

    if (!res.success) {
      setReportError(res.error || "Failed to submit report.");
      return;
    }

    setReportSuccessMessage(res.message || "Thank you. Your report has been submitted to moderators.");
    setTimeout(() => {
      setReportModalOpen(false);
      setReportSuccessMessage(null);
      setReportNote("");
    }, 2200);
  };

  const handleMarkSold = async () => {
    if (!confirm("Are you sure you want to mark this listing as sold?")) return;
    setIsMarkingSold(true);
    const res = await markListingSold(listing.id);
    setIsMarkingSold(false);
    if (res.success) {
      setCurrentStatus("sold");
    } else {
      alert(res.error || "Failed to mark listing as sold.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      {/* ── Breadcrumb & Navigation ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumbs" className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/market">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to marketplace</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs">
              <Link href={`/market/${listing.id}/edit`}>
                <Edit className="h-3.5 w-3.5" />
                <span>Edit listing</span>
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Report</span>
            </Button>
          )}
        </div>
      </nav>

      {/* ── Owner Banner (if viewing own listing) ─────────────────────────── */}
      {isOwner && (
        <aside
          aria-label="Owner status"
          className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-primary"
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 shrink-0" />
            <span>
              This is your listing (Status: <strong>{statusMeta.label}</strong>).
            </span>
          </div>
          {currentStatus === "active" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isMarkingSold}
              onClick={handleMarkSold}
              className="h-7 text-xs bg-card"
            >
              {isMarkingSold ? "Updating..." : "Mark as sold"}
            </Button>
          )}
        </aside>
      )}

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery (7 cols) */}
        <section aria-label="Listing images" className="lg:col-span-7 space-y-3">
          <div className="relative aspect-4/3 w-full rounded-2xl border border-border bg-muted/40 overflow-hidden">
            {images.length > 0 ? (
              <Image
                src={`/api/market/image?path=${encodeURIComponent(images[activeImageIndex])}`}
                alt={listing.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground gap-2">
                {categoryMeta && <categoryMeta.icon className="h-16 w-16 stroke-[1]" />}
                <span className="text-xs">No photos uploaded for this listing</span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery (if > 1 image) */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1" role="tablist" aria-label="Image thumbnails">
              {images.map((path, idx) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-18 w-24 shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                    activeImageIndex === idx
                      ? "border-primary ring-2 ring-primary/20 scale-102"
                      : "border-border hover:border-muted-foreground/60 opacity-75"
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <Image
                    src={`/api/market/image?path=${encodeURIComponent(path)}`}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <article className="rounded-xl border border-border bg-card p-5 space-y-3 mt-6">
            <h2 className="text-sm font-semibold tracking-tight uppercase tracking-wider text-[11px] text-muted-foreground">
              Service Description
            </h2>
            <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed break-words">
              {listing.description}
            </div>
          </article>
        </section>

        {/* Right Column: Key Details & Seller Contact Action (5 cols) */}
        <section aria-label="Listing action and seller details" className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            {/* Category & Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {categoryMeta?.label || listing.category}
                </Badge>
                <VerifiedBadge isVerified={sellerVerified} />
              </div>
              <Badge variant="outline" className={`text-xs ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
              {listing.title}
            </h1>

            {/* Price */}
            <div className="py-2 border-y border-border/70 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {listing.price_ngn === null || listing.price_ngn === undefined
                  ? "Contact for price"
                  : listing.price_ngn === 0
                  ? "Free"
                  : `Starting from ₦${Number(listing.price_ngn).toLocaleString("en-NG", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}`}
              </span>
              <span className="text-xs text-muted-foreground">Service rate</span>
            </div>

            {/* Meta attributes */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                <span className="text-foreground/90 font-medium">{listing.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                <span>
                  Listed on{" "}
                  {new Date(listing.created_at).toLocaleDateString("en-NG", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Seller Info Card (Masked Name Only) */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  {listing.seller_name_masked.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>{listing.seller_name_masked}</span>
                    <VerifiedBadge isVerified={sellerVerified} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">Service Provider</div>
                </div>
              </div>
            </div>

            {/* Contact Action */}
            <div className="space-y-2.5 pt-2">
              {currentStatus !== "active" ? (
                <div className="rounded-xl border border-zinc-500/20 bg-zinc-500/10 p-3 text-center text-xs text-muted-foreground">
                  This listing is no longer active ({currentStatus}). Contacting the provider is disabled.
                </div>
              ) : contactState.revealed && contactState.hasContact && contactState.whatsapp ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Provider WhatsApp Contact
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="text-base font-mono font-bold text-foreground">
                    {contactState.whatsapp}
                  </div>
                  <Button size="sm" asChild className="w-full gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white">
                    <a
                      href={buildWhatsAppLink(contactState.whatsapp, listing.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      <span>Chat on WhatsApp</span>
                      <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                    </a>
                  </Button>
                </div>
              ) : contactState.revealed && !contactState.hasContact ? (
                <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-center text-xs text-muted-foreground">
                  The provider did not provide a WhatsApp number for this listing.
                </div>
              ) : (
                <Button
                  onClick={handleRevealContact}
                  disabled={contactState.loading}
                  className="w-full h-11 gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-sm shadow-sm"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>{contactState.loading ? "Connecting..." : "Contact provider on WhatsApp"}</span>
                </Button>
              )}

              {/* Error Alert */}
              {contactState.error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{contactState.error}</p>
                    {contactState.error.includes("verify your profile") && (
                      <Link href="/profile" className="font-semibold underline mt-1 inline-block">
                        Go to Profile Verification →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Safety Warning Card */}
          <section
            aria-label="Safety tips"
            className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs space-y-2.5"
          >
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Safety Rules for Zed Market</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {SAFETY_DISCLAIMER}
            </p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
              <li>Never pay the full amount before seeing work. Agree terms clearly first.</li>
              <li>Agree project milestones, deliverables, and timelines in writing.</li>
              <li>For in-person services, meet in public, well-lit spaces or campus locations.</li>
            </ul>
          </section>
        </section>
      </div>

      {/* ── Report Listing Dialog ──────────────────────────────────────────── */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4 text-rose-500" />
              <span>Report this listing</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Help keep Zed Market safe for everyone. Verified reports trigger immediate moderation review.
            </DialogDescription>
          </DialogHeader>

          {reportSuccessMessage ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center text-xs text-emerald-800 dark:text-emerald-300 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <span>{reportSuccessMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-4 py-2">
              {reportError && (
                <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                  {reportError}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select reason</Label>
                <RadioGroup
                  value={reportReason}
                  onValueChange={(val) => setReportReason(val as MarketReportReason)}
                  className="space-y-1.5"
                >
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-2 text-xs">
                    <RadioGroupItem value="scam" id="reason-scam" />
                    <Label htmlFor="reason-scam" className="cursor-pointer flex-1">
                      Financial scam or suspicious provider behavior
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-2 text-xs">
                    <RadioGroupItem value="prohibited" id="reason-prohibited" />
                    <Label htmlFor="reason-prohibited" className="cursor-pointer flex-1">
                      Prohibited service or physical goods (Zed Market is services only)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-2 text-xs">
                    <RadioGroupItem value="duplicate" id="reason-duplicate" />
                    <Label htmlFor="reason-duplicate" className="cursor-pointer flex-1">
                      Duplicate or spam listing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-2 text-xs">
                    <RadioGroupItem value="other" id="reason-other" />
                    <Label htmlFor="reason-other" className="cursor-pointer flex-1">
                      Other policy violation
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-note" className="text-xs font-semibold">
                  Additional details (optional, max 300 chars)
                </Label>
                <Textarea
                  id="report-note"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  maxLength={300}
                  placeholder="Provide context for our moderation team..."
                  className="text-xs resize-none h-20"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={reportSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Unverified Seller Caution Dialog ──────────────────────────────── */}
      {isVerifiedBadgeEnabled() && (
        <Dialog open={cautionModalOpen} onOpenChange={setCautionModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <span>Unverified Provider Notice</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/80 pt-2 leading-relaxed">
                This provider is not verified. Deal at your own risk. Never pay the full amount before seeing work. Agree terms clearly first.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-3 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCautionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                onClick={() => {
                  setCautionModalOpen(false);
                  executeRevealContact();
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
