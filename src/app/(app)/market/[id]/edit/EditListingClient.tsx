"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_DEFINITIONS,
  CONDITION_LABELS,
} from "@/lib/market/helpers";
import {
  MAX_IMAGES_PER_LISTING,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
} from "@/lib/market/validation";
import { updateListing, uploadListingImage } from "@/lib/market/actions";
import type { MarketCategory, MarketCondition, MarketListing } from "@/lib/market/types";

interface EditListingClientProps {
  listing: MarketListing;
  initialWhatsapp?: string | null;
}

export function EditListingClient({ listing, initialWhatsapp }: EditListingClientProps) {
  const router = useRouter();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [category, setCategory] = useState<MarketCategory>(listing.category);
  const [condition, setCondition] = useState<MarketCondition>(listing.condition);
  const [priceNgn, setPriceNgn] = useState(listing.price_ngn !== null ? listing.price_ngn.toString() : "");
  const [location, setLocation] = useState(listing.location);
  const [contactWhatsapp, setContactWhatsapp] = useState(initialWhatsapp || "");

  const [uploadedPaths, setUploadedPaths] = useState<string[]>(listing.image_paths || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedPaths.length + files.length > MAX_IMAGES_PER_LISTING) {
      setErrorMessage(`You can upload at most ${MAX_IMAGES_PER_LISTING} photos.`);
      return;
    }

    setErrorMessage(null);
    setUploadingImage(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setErrorMessage(`"${file.name}" exceeds 2 MB.`);
        continue;
      }

      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        setErrorMessage(`"${file.name}" is not a supported image format.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadListingImage(formData);
      if (res.success && res.path) {
        setUploadedPaths((prev) => [...prev, res.path!]);
      } else {
        setErrorMessage(res.error || `Failed to upload "${file.name}".`);
      }
    }

    setUploadingImage(false);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setUploadedPaths((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    const res = await updateListing(listing.id, {
      title,
      description,
      category,
      price_ngn: priceNgn ? parseFloat(priceNgn.replace(/,/g, "")) : null,
      condition,
      location,
      image_paths: uploadedPaths,
      contact_whatsapp: contactWhatsapp.trim() || null,
    });

    setSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to update listing.");
      return;
    }

    router.push(`/market/${listing.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-muted-foreground hover:text-foreground -ml-2">
          <Link href={`/market/${listing.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Edit Listing</h1>
          <p className="text-xs text-muted-foreground">Update your listing details and photos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
        {errorMessage && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="edit-title" className="text-xs font-semibold">
            Listing Title <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={3}
            maxLength={120}
            required
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Category</Label>
            <Select value={category} onValueChange={(val) => setCategory(val as MarketCategory)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Condition</Label>
            <Select value={condition} onValueChange={(val) => setCondition(val as MarketCondition)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-price" className="text-xs font-semibold">Price (₦ NGN)</Label>
            <Input
              id="edit-price"
              type="number"
              min={0}
              step="any"
              value={priceNgn}
              onChange={(e) => setPriceNgn(e.target.value)}
              placeholder="Leave blank for 'Contact for price'"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-location" className="text-xs font-semibold">
              Location <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              minLength={2}
              maxLength={80}
              required
              className="text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-whatsapp" className="text-xs font-semibold">WhatsApp Number</Label>
          <Input
            id="edit-whatsapp"
            value={contactWhatsapp}
            onChange={(e) => setContactWhatsapp(e.target.value)}
            placeholder="+234 801 234 5678"
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-description" className="text-xs font-semibold">
            Description <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={20}
            maxLength={2000}
            required
            className="text-sm min-h-28 resize-y"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Photos (up to 4)</Label>
            <span className="text-[10px] text-muted-foreground">{uploadedPaths.length}/4</span>
          </div>

          {uploadedPaths.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {uploadedPaths.map((path, idx) => (
                <div key={path} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                  <Image
                    src={`/api/market/image?path=${encodeURIComponent(path)}`}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadedPaths.length < MAX_IMAGES_PER_LISTING && (
            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-5 text-center cursor-pointer hover:bg-accent/40 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs font-semibold text-foreground">
                {uploadingImage ? "Uploading photo..." : "Upload photos"}
              </span>
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

        <Button type="submit" disabled={submitting || uploadingImage} className="w-full h-10 text-sm font-semibold">
          {submitting ? "Saving changes..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
