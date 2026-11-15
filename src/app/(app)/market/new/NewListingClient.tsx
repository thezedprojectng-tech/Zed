"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  ShieldAlert,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CATEGORY_DEFINITIONS,
  PROHIBITED_ITEMS,
} from "@/lib/market/helpers";
import {
  MAX_IMAGES_PER_LISTING,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
} from "@/lib/market/validation";
import { createListing, uploadListingImage } from "@/lib/market/actions";
import type { MarketCategory } from "@/lib/market/types";
import { cn } from "@/lib/utils";

interface NewListingClientProps {
  isVerified: boolean;
  userPhone?: string | null;
}

export function NewListingClient({ isVerified: _isVerified, userPhone }: NewListingClientProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MarketCategory>("design-and-creative");
  const [priceNgn, setPriceNgn] = useState("");
  const [location, setLocation] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState(userPhone || "");
  const [confirmAllowed, setConfirmAllowed] = useState(false);

  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prohibitedModalOpen, setProhibitedModalOpen] = useState(false);

  // Dirty state tracking
  const isDirty = useMemo(() => {
    return (
      title.trim() !== "" ||
      description.trim() !== "" ||
      priceNgn !== "" ||
      location.trim() !== "" ||
      contactWhatsapp.trim() !== (userPhone || "").trim() ||
      uploadedPaths.length > 0 ||
      confirmAllowed
    );
  }, [title, description, priceNgn, location, contactWhatsapp, userPhone, uploadedPaths, confirmAllowed]);

  // Leave-page warning when form is dirty
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    if (uploadedPaths.length + files.length > MAX_IMAGES_PER_LISTING) {
      setErrorMessage(`You can upload at most ${MAX_IMAGES_PER_LISTING} photos per listing.`);
      return;
    }

    setErrorMessage(null);
    setUploadingImage(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setErrorMessage(`"${file.name}" exceeds the 2 MB file size limit.`);
        continue;
      }

      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Please use JPEG, PNG, or WebP.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadListingImage(formData);
      if (res.success && res.path) {
        setUploadedPaths((prev) => [...prev, res.path!]);
        setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
      } else {
        setErrorMessage(res.error || `Failed to upload "${file.name}".`);
      }
    }

    setUploadingImage(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      void processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedPaths((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const disabledReason = useMemo(() => {
    if (submitting) return "Publishing service…";
    if (uploadingImage) return "Uploading photos…";
    if (!title.trim() || title.trim().length < 3) return "Enter a title (min 3 characters)";
    if (!location.trim() || location.trim().length < 2) return "Enter a location (min 2 characters)";
    if (!description.trim() || description.trim().length < 20) return "Enter a description (min 20 characters)";
    if (!confirmAllowed) return "Confirm the checkbox to publish";
    return null;
  }, [submitting, uploadingImage, title, location, description, confirmAllowed]);

  const isSubmitDisabled = Boolean(disabledReason);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!confirmAllowed) {
      setErrorMessage("Please confirm that this service is allowed under our rules and that you are authorized to offer it.");
      return;
    }

    setSubmitting(true);

    const res = await createListing({
      title: title.trim(),
      description: description.trim(),
      category,
      price_ngn: priceNgn ? parseFloat(priceNgn.replace(/,/g, "")) : null,
      condition: "na",
      location: location.trim(),
      image_paths: uploadedPaths,
      contact_whatsapp: contactWhatsapp.trim() || null,
      confirm_allowed: confirmAllowed,
    });

    setSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to create listing.");
      return;
    }

    router.push(`/market/${res.id}`);
  };

  // Compact rules callout element
  const rulesCallout = (
    <aside
      aria-label="Marketplace rules"
      className="rounded-lg border border-border border-l-2 border-l-[var(--data-flows)] bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Marketplace rules</span>
      </div>
      <p className="text-xs text-foreground/90 leading-relaxed">
        Zed Market is strictly for listing <strong>services</strong> (such as design, tech, tutoring, writing, repairs, photography, and event support). Selling physical goods, packaged products, food, or electronics is prohibited.
      </p>
      <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium pt-1 border-t border-border/60 leading-relaxed">
        Safety rule: Never pay the full amount before seeing work. Agree terms clearly first.
      </div>
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setProhibitedModalOpen(true)}
          className="h-8 text-xs w-full sm:w-auto cursor-pointer"
        >
          View prohibited items
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-32 sm:pb-32">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
            <Link href="/market">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to marketplace</span>
            </Link>
          </Button>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Create listing
          </h1>
          <p className="text-xs text-muted-foreground">
            Offer a service on Zed Market — design, tutoring, tech, photography, writing, and more
          </p>
        </div>
      </div>

      {/* ── On mobile: rules callout collapsed right under header ─────────── */}
      <div className="lg:hidden">
        {rulesCallout}
      </div>

      {/* ── Form Error Banner ────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Two-Column Layout from 1024px ─────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form sections separated by dividers (8 cols) */}
        <div className="lg:col-span-8 space-y-8 divide-y divide-border/60">
          {/* Section 1: Details */}
          <section aria-labelledby="details-heading" className="space-y-4">
            <div>
              <h2 id="details-heading" className="text-sm font-semibold text-foreground">
                Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Title, primary category, and full description of the service deliverables.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="listing-title" className="text-xs font-semibold">
                Listing title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="listing-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Logo design for small businesses"
                minLength={3}
                maxLength={120}
                required
                className="h-10 text-sm bg-background"
              />
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-0.5">
                <span>Minimum 3 characters</span>
                <span className="font-sans tabular-nums">{title.length}/120</span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="listing-category" className="text-xs font-semibold">
                Category <span className="text-rose-500">*</span>
              </Label>
              <Select value={category} onValueChange={(val) => setCategory(val as MarketCategory)}>
                <SelectTrigger id="listing-category" className="w-full h-10 text-sm bg-background">
                  <SelectValue placeholder="Select a service category" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {Object.values(CATEGORY_DEFINITIONS).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="listing-description" className="text-xs font-semibold">
                Description <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="listing-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your service, deliverables, turnaround time, or requirements..."
                minLength={20}
                maxLength={2000}
                required
                className="text-sm min-h-28 resize-y bg-background"
              />
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-0.5">
                <span>Minimum 20 characters</span>
                <span className="font-sans tabular-nums">{description.length}/2000</span>
              </div>
            </div>
          </section>

          {/* Section 2: Price and location */}
          <section aria-labelledby="pricing-heading" className="space-y-4 pt-8">
            <div>
              <h2 id="pricing-heading" className="text-sm font-semibold text-foreground">
                Price and location
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Specify your starting rate and geographic or campus coverage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="listing-price" className="text-xs font-semibold">
                  Starting price (₦)
                </Label>
                <Input
                  id="listing-price"
                  type="number"
                  min={0}
                  step="any"
                  value={priceNgn}
                  onChange={(e) => setPriceNgn(e.target.value)}
                  placeholder="e.g. 15000"
                  className="h-10 text-sm bg-background"
                />
                <div className="text-[11px] text-muted-foreground pt-0.5">
                  Optional. Leave blank for &apos;Contact for price&apos;.
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="listing-location" className="text-xs font-semibold">
                  Location (City / Campus / State) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="listing-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. UNILAG Akoka, Lagos"
                  minLength={2}
                  maxLength={80}
                  required
                  className="h-10 text-sm bg-background"
                />
                <div className="text-[11px] text-muted-foreground pt-0.5">
                  Campus name, city, or nationwide coverage
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Contact */}
          <section aria-labelledby="contact-heading" className="space-y-4 pt-8">
            <div>
              <h2 id="contact-heading" className="text-sm font-semibold text-foreground">
                Contact
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Direct WhatsApp contact for clients to reach you.
              </p>
            </div>

            <div className="space-y-1.5 max-w-md">
              <Label htmlFor="listing-whatsapp" className="text-xs font-semibold">
                WhatsApp contact number
              </Label>
              <Input
                id="listing-whatsapp"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                placeholder="e.g. +234 801 234 5678"
                className="h-10 text-sm bg-background"
              />
              <p className="text-[11px] text-muted-foreground pt-0.5">
                Only revealed to verified, signed-in users on Zed Market.
              </p>
            </div>
          </section>

          {/* Section 4: Photos */}
          <section aria-labelledby="photos-heading" className="space-y-4 pt-8">
            <div>
              <h2 id="photos-heading" className="text-sm font-semibold text-foreground">
                Photos
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add portfolio samples, flyer images, or past completed work.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Upload up to 4 photos (max 2 MB each)</span>
                <span className="text-[11px] text-muted-foreground font-sans tabular-nums">
                  {uploadedPaths.length}/4 photos
                </span>
              </div>

              {/* Photo tiles grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {imagePreviews.map((previewUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square w-full rounded-lg border border-border bg-muted overflow-hidden group"
                  >
                    <Image
                      src={previewUrl}
                      alt={`Uploaded preview ${idx + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors"
                      aria-label={`Remove photo ${idx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {uploadedPaths.length < MAX_IMAGES_PER_LISTING && (
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    className={cn(
                      "flex flex-col items-center justify-center aspect-square w-full rounded-lg border border-dashed text-center cursor-pointer transition-colors p-3",
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
                    )}
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mb-1 stroke-[1.5]" />
                    <span className="text-xs font-semibold text-foreground">
                      {uploadingImage ? "Uploading…" : "Add photo"}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      Max 4, 2 MB each
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      JPEG, PNG, WebP
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploadingImage}
                      onChange={handleFileSelect}
                      className="sr-only"
                      aria-label="Upload service photos"
                    />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* Section 5: Confirmation */}
          <section aria-labelledby="confirmation-heading" className="space-y-4 pt-8">
            <h2 id="confirmation-heading" className="sr-only">
              Confirmation
            </h2>

            <div className="flex items-start space-x-2.5">
              <Checkbox
                id="confirm-allowed"
                checked={confirmAllowed}
                onCheckedChange={(checked) => setConfirmAllowed(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <label
                  htmlFor="confirm-allowed"
                  className="text-xs font-medium leading-none cursor-pointer text-foreground"
                >
                  I confirm this service is allowed and I am authorized to offer it.
                </label>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  I agree not to offer adult services, counterfeit work, academic dishonesty, or anything prohibited.{" "}
                  <button
                    type="button"
                    onClick={() => setProhibitedModalOpen(true)}
                    className="text-primary hover:underline font-semibold cursor-pointer"
                  >
                    View prohibited items list
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Sticky aside with one compact rules callout from 1024px (4 cols) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
          {rulesCallout}
        </aside>

        {/* ── Sticky Bottom Action Bar ───────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-4 sm:px-6 lg:px-8 py-3 shadow-lg">
          <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
              {isSubmitDisabled && disabledReason ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">{disabledReason}</span>
              ) : isDirty ? (
                <span>Unsaved changes</span>
              ) : null}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end order-1 sm:order-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                asChild
                className="h-9 px-4 text-xs font-medium"
              >
                <Link href="/market">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-9 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    <span>Publishing service…</span>
                  </>
                ) : (
                  <span>Publish service listing</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Prohibited Items Modal ────────────────────────────────────────── */}
      <Dialog open={prohibitedModalOpen} onOpenChange={setProhibitedModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <span>Prohibited items & activities</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              To safeguard all youth users, the following items are strictly forbidden on Zed Market:
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 py-2 text-xs text-foreground/90 max-h-64 overflow-y-auto">
            {PROHIBITED_ITEMS.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button size="sm" onClick={() => setProhibitedModalOpen(false)} className="text-xs">
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
