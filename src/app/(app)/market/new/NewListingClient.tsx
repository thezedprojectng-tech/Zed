"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileCheck,
  Info,
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
  SAFETY_DISCLAIMER,
} from "@/lib/market/helpers";
import {
  MAX_IMAGES_PER_LISTING,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
} from "@/lib/market/validation";
import { createListing, uploadListingImage } from "@/lib/market/actions";
import type { MarketCategory } from "@/lib/market/types";

interface NewListingClientProps {
  isVerified: boolean;
  userPhone?: string | null;
}

export function NewListingClient({ isVerified, userPhone }: NewListingClientProps) {
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

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prohibitedModalOpen, setProhibitedModalOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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
    // Reset input
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setUploadedPaths((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!confirmAllowed) {
      setErrorMessage("Please confirm that this item is allowed under our rules and that you own it.");
      return;
    }

    setSubmitting(true);

    const res = await createListing({
      title,
      description,
      category,
      price_ngn: priceNgn ? parseFloat(priceNgn.replace(/,/g, "")) : null,
      condition: "na",
      location,
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-muted-foreground hover:text-foreground -ml-2">
          <Link href="/market">
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Create Listing</h1>
          <p className="text-xs text-muted-foreground">Offer a service on Zed Market — design, tutoring, tech, photography, and more</p>
        </div>
      </div>

      {/* ── Safety Disclaimer ──────────────────────────────────────────────── */}
      <aside
        aria-label="Safety advice"
        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5"
      >
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold">Safety Reminder</span>
          <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
            {SAFETY_DISCLAIMER}
          </p>
        </div>
      </aside>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
        {errorMessage && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="listing-title" className="text-xs font-semibold">
            Listing Title <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="listing-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. iPhone 13 Pro 128GB Sierra Blue"
            minLength={3}
            maxLength={120}
            required
            className="text-sm"
          />
          <span className="text-[10px] text-muted-foreground">{title.length}/120 characters (min 3)</span>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Category <span className="text-rose-500">*</span>
          </Label>
          <Select value={category} onValueChange={(val) => setCategory(val as MarketCategory)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select a service category" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CATEGORY_DEFINITIONS).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="listing-price" className="text-xs font-semibold">
              Starting Price (₦)
            </Label>
            <Input
              id="listing-price"
              type="number"
              min={0}
              step="any"
              value={priceNgn}
              onChange={(e) => setPriceNgn(e.target.value)}
              placeholder="Leave blank for 'Contact for price'"
              className="text-sm"
            />
            <span className="text-[10px] text-muted-foreground">Optional. Leave blank for &apos;Contact for price&apos;.</span>
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
              className="text-sm"
            />
          </div>
        </div>

        {/* WhatsApp Contact */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="listing-whatsapp" className="text-xs font-semibold">
              WhatsApp Contact Number
            </Label>
            <span className="text-[10px] text-muted-foreground">Only shown to signed-in users</span>
          </div>
          <Input
            id="listing-whatsapp"
            value={contactWhatsapp}
            onChange={(e) => setContactWhatsapp(e.target.value)}
            placeholder="e.g. +234 801 234 5678"
            className="text-sm"
          />
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
            className="text-sm min-h-28 resize-y"
          />
          <span className="text-[10px] text-muted-foreground">{description.length}/2000 characters (min 20)</span>
        </div>

        {/* Image Upload Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Photos (up to 4, max 2 MB each)</Label>
            <span className="text-[10px] text-muted-foreground">{uploadedPaths.length}/4 photos</span>
          </div>

          {/* Thumbnail preview list */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {imagePreviews.map((previewUrl, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                  <Image src={previewUrl} alt={`Uploaded ${idx + 1}`} fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadedPaths.length < MAX_IMAGES_PER_LISTING && (
            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-5 text-center cursor-pointer hover:bg-accent/40 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground mb-1.5" />
              <span className="text-xs font-semibold text-foreground">
                {uploadingImage ? "Uploading photos..." : "Click or drag photos here"}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WebP up to 2 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploadingImage}
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* ── Marketplace Rules Box (Services Only) ────────────────────────── */}
        <aside
          aria-label="Marketplace rules"
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
            <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
            <span>Marketplace Rules — Services Only</span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            Zed Market is strictly for listing <strong>services</strong> (such as design, tech, tutoring, writing, repairs, photography, and event support). Selling physical goods, packaged products, food, or electronics is strictly prohibited.
          </p>
          <div className="space-y-1.5 pt-1 border-t border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Prohibited on Zed Market:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
              {PROHIBITED_ITEMS.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold leading-none mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium pt-1.5 border-t border-border/60">
            Safety rule: Never pay the full amount before seeing work. Agree terms clearly first.
          </div>
        </aside>

        {/* Confirmation & Prohibited Items */}
        <div className="pt-2 border-t border-border space-y-3">
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
              <div className="text-[11px] text-muted-foreground">
                I agree not to offer adult services, counterfeit work, academic dishonesty, or anything prohibited.{" "}
                <button
                  type="button"
                  onClick={() => setProhibitedModalOpen(true)}
                  className="text-primary hover:underline font-semibold"
                >
                  View prohibited items list
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting || uploadingImage || !confirmAllowed}
          className="w-full h-10 text-sm font-semibold shadow-sm"
        >
          {submitting ? "Publishing service..." : "Publish Service Listing"}
        </Button>
      </form>

      {/* ── Prohibited Items Modal ────────────────────────────────────────── */}
      <Dialog open={prohibitedModalOpen} onOpenChange={setProhibitedModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <span>Prohibited Items & Activities</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              To safeguard all youth users, the following items are strictly forbidden on Zed Market:
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 py-2 text-xs text-foreground/90">
            {PROHIBITED_ITEMS.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button size="sm" onClick={() => setProhibitedModalOpen(false)}>
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
