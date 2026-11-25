"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { adminUpdateTrackCertificateAction } from "@/lib/skill/admin-actions";
import {
  CERTIFICATE_FIELD_KEYS,
  CERTIFICATE_FIELD_LABELS,
  DEFAULT_CERTIFICATE_LAYOUT,
  certificateLayoutSchema,
  type CertificateAlign,
  type CertificateFieldKey,
  type CertificateFont,
  type CertificateLayout,
} from "@/lib/certificate/layout";
import {
  drawCertificateWithImage,
  loadCertificateImage,
} from "@/lib/certificate/render";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BUCKET_NAME = "certificate-templates";
const MAX_TEMPLATE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

interface CertificateTemplateEditorProps {
  trackId: string;
  trackTitle: string;
  initialTemplatePath: string | null;
  initialLayout: CertificateLayout | null;
}

function clampFraction(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.round(Math.min(max, Math.max(min, value)) * 1000) / 1000;
}

export function CertificateTemplateEditor({
  trackId,
  trackTitle,
  initialTemplatePath,
  initialLayout,
}: CertificateTemplateEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const [templatePath, setTemplatePath] = useState<string | null>(
    initialTemplatePath
  );
  const [layout, setLayout] = useState<CertificateLayout>(
    () => initialLayout ?? structuredClone(DEFAULT_CERTIFICATE_LAYOUT)
  );
  const [savedLayoutJson, setSavedLayoutJson] = useState<string>(() =>
    JSON.stringify(initialLayout ?? DEFAULT_CERTIFICATE_LAYOUT)
  );
  const [selectedField, setSelectedField] =
    useState<CertificateFieldKey>("name");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [draggingField, setDraggingField] =
    useState<CertificateFieldKey | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const publicTemplateUrl = useMemo(() => {
    if (!templatePath) return null;
    const supabase = createClient();
    return supabase.storage.from(BUCKET_NAME).getPublicUrl(templatePath).data
      .publicUrl;
  }, [templatePath]);

  const sampleData = useMemo(
    () => ({
      name: "Amina Okafor",
      course: trackTitle || "Course Title",
      score: 82,
      remark: "Merit",
      date: "26 Nov 2026",
      code: "ZED-ABC1234567",
    }),
    [trackTitle]
  );

  // Load template image whenever URL changes
  useEffect(() => {
    if (!publicTemplateUrl) {
      setLoadedImage(null);
      setImageLoadError(null);
      return;
    }

    let cancelled = false;
    setImageLoadError(null);
    loadCertificateImage(publicTemplateUrl)
      .then((img) => {
        if (!cancelled) {
          setLoadedImage(img);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedImage(null);
          setImageLoadError(
            "Could not load template preview. Check that the file exists and is publicly readable."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [publicTemplateUrl]);

  // Redraw canvas whenever image, layout, or sample data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
    drawCertificateWithImage(canvas, loadedImage, layout, sampleData);
  }, [loadedImage, layout, sampleData]);

  const isLayoutDirty = useMemo(
    () => JSON.stringify(layout) !== savedLayoutJson,
    [layout, savedLayoutJson]
  );

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErrorMsg(null);
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setErrorMsg("Only PNG and JPG images are supported.");
      return;
    }
    if (file.size > MAX_TEMPLATE_BYTES) {
      setErrorMsg("Template image must be 5 MB or smaller.");
      return;
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const storagePath = `${trackId}/${Date.now()}.${ext}`;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadErr) {
        setErrorMsg(uploadErr.message || "Failed to upload template image.");
        return;
      }

      const saveRes = await adminUpdateTrackCertificateAction(trackId, {
        certificate_template_path: storagePath,
      });

      if (!saveRes.ok) {
        setErrorMsg(saveRes.error || "Failed to save template path.");
        return;
      }

      setTemplatePath(storagePath);
      toast.success("Certificate template uploaded");
    } catch {
      setErrorMsg("Unexpected error while uploading template.");
    } finally {
      setIsUploading(false);
    }
  };

  const updateField = <K extends CertificateFieldKey>(
    key: K,
    patch: Partial<CertificateLayout["fields"][K]>
  ) => {
    setErrorMsg(null);
    setLayout((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: {
          ...prev.fields[key],
          ...patch,
        },
      },
    }));
  };

  const updatePointerPosition = (
    clientX: number,
    clientY: number,
    fieldKey: CertificateFieldKey
  ) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nextX = clampFraction((clientX - rect.left) / rect.width);
    const nextY = clampFraction((clientY - rect.top) / rect.height);
    updateField(fieldKey, { x: nextX, y: nextY });
  };

  const handleMarkerPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    fieldKey: CertificateFieldKey
  ) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedField(fieldKey);
    setDraggingField(fieldKey);
    updatePointerPosition(e.clientX, e.clientY, fieldKey);
  };

  const handleMarkerPointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
    fieldKey: CertificateFieldKey
  ) => {
    if (draggingField !== fieldKey) return;
    updatePointerPosition(e.clientX, e.clientY, fieldKey);
  };

  const handleMarkerPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    fieldKey: CertificateFieldKey
  ) => {
    if (draggingField === fieldKey) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingField(null);
    }
  };

  const handleResetLayout = () => {
    setErrorMsg(null);
    setLayout(structuredClone(DEFAULT_CERTIFICATE_LAYOUT));
  };

  const handleSaveLayout = () => {
    setErrorMsg(null);
    const parsed = certificateLayoutSchema.safeParse(layout);
    if (!parsed.success) {
      setErrorMsg(
        parsed.error.issues[0]?.message ?? "Please check the layout values."
      );
      return;
    }

    startTransition(async () => {
      const res = await adminUpdateTrackCertificateAction(trackId, {
        certificate_layout: parsed.data,
      });

      if (!res.ok) {
        setErrorMsg(res.error || "Failed to save certificate layout.");
        return;
      }

      setSavedLayoutJson(JSON.stringify(parsed.data));
      toast.success("Certificate layout saved");
    });
  };

  const activeField = layout.fields[selectedField];
  const isQrSelected = selectedField === "qr";

  return (
    <div className="rounded-lg border border-border/70 bg-card p-5 space-y-5">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Template image
          </p>
          <p className="text-xs text-muted-foreground">
            {templatePath
              ? `Uploaded: ${templatePath}`
              : "Upload a PNG or JPG Canva export (max 5 MB)."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileSelected}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading || isPending}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 text-xs rounded-lg gap-1.5 border-border/70"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{templatePath ? "Replace template" : "Upload template"}</span>
          </Button>
        </div>
      </div>

      {/* Preview stage */}
      {!publicTemplateUrl ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto stroke-[1.5]" />
          <p className="text-sm font-medium text-foreground">
            No certificate template uploaded yet
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Upload your certificate background image to preview sample learner
            data and position the fields.
          </p>
        </div>
      ) : imageLoadError ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-400">
          {imageLoadError}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Drag any marker on the preview or adjust coordinates below.
            </span>
            <span className="tabular-nums">
              Selected: {CERTIFICATE_FIELD_LABELS[selectedField]}
            </span>
          </div>

          <div
            ref={stageRef}
            className="relative w-full overflow-hidden rounded-lg border border-border/70 bg-muted/30 select-none touch-none"
          >
            <canvas
              ref={canvasRef}
              className="block w-full h-auto"
              aria-label="Live certificate preview"
            />

            {loadedImage &&
              CERTIFICATE_FIELD_KEYS.map((fieldKey) => {
                const f = layout.fields[fieldKey];
                const isSelected = selectedField === fieldKey;
                return (
                  <button
                    key={fieldKey}
                    type="button"
                    onPointerDown={(e) => handleMarkerPointerDown(e, fieldKey)}
                    onPointerMove={(e) => handleMarkerPointerMove(e, fieldKey)}
                    onPointerUp={(e) => handleMarkerPointerUp(e, fieldKey)}
                    style={{
                      left: `${f.x * 100}%`,
                      top: `${f.y * 100}%`,
                    }}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-xs cursor-grab active:cursor-grabbing transition-colors duration-150 motion-reduce:transition-none",
                      isSelected
                        ? "z-20 border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "z-10 border-border bg-background/90 text-foreground hover:bg-background"
                    )}
                  >
                    {CERTIFICATE_FIELD_LABELS[fieldKey]}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Field selector & controls */}
      <div className="space-y-4 border-t border-border/60 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {CERTIFICATE_FIELD_KEYS.map((key) => {
            const isActive = selectedField === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedField(key)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {CERTIFICATE_FIELD_LABELS[key]}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="certFieldX" className="text-xs font-medium">
              X position (0 – 1)
            </Label>
            <Input
              id="certFieldX"
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={activeField.x}
              onChange={(e) =>
                updateField(selectedField, {
                  x: clampFraction(Number(e.target.value), 0, 1),
                })
              }
              className="h-9 rounded-lg text-sm tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certFieldY" className="text-xs font-medium">
              Y position (0 – 1)
            </Label>
            <Input
              id="certFieldY"
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={activeField.y}
              onChange={(e) =>
                updateField(selectedField, {
                  y: clampFraction(Number(e.target.value), 0, 1),
                })
              }
              className="h-9 rounded-lg text-sm tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certFieldSize" className="text-xs font-medium">
              {isQrSelected ? "QR width (0.02 – 0.5)" : "Font size (0.005 – 0.5)"}
            </Label>
            <Input
              id="certFieldSize"
              type="number"
              step={0.005}
              min={isQrSelected ? 0.02 : 0.005}
              max={0.5}
              value={activeField.size}
              onChange={(e) =>
                updateField(selectedField, {
                  size: clampFraction(
                    Number(e.target.value),
                    isQrSelected ? 0.02 : 0.005,
                    0.5
                  ),
                })
              }
              className="h-9 rounded-lg text-sm tabular-nums"
            />
          </div>

          {!isQrSelected && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="certFieldMaxWidth" className="text-xs font-medium">
                  Max width (0.05 – 1)
                </Label>
                <Input
                  id="certFieldMaxWidth"
                  type="number"
                  step={0.01}
                  min={0.05}
                  max={1}
                  value={layout.fields[selectedField].maxWidth}
                  onChange={(e) =>
                    updateField(selectedField, {
                      maxWidth: clampFraction(Number(e.target.value), 0.05, 1),
                    })
                  }
                  className="h-9 rounded-lg text-sm tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="certFieldColor" className="text-xs font-medium">
                  Text color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Pick text color"
                    type="color"
                    value={layout.fields[selectedField].color}
                    onChange={(e) =>
                      updateField(selectedField, { color: e.target.value })
                    }
                    className="h-9 w-10 shrink-0 rounded-lg border border-border bg-background p-1 cursor-pointer"
                  />
                  <Input
                    id="certFieldColor"
                    type="text"
                    value={layout.fields[selectedField].color}
                    onChange={(e) =>
                      updateField(selectedField, { color: e.target.value })
                    }
                    placeholder="#111111"
                    className="h-9 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium block">Alignment</span>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/70 bg-muted/30 p-1">
                  {(
                    [
                      { value: "left", icon: AlignLeft, label: "Left" },
                      { value: "center", icon: AlignCenter, label: "Center" },
                      { value: "right", icon: AlignRight, label: "Right" },
                    ] as Array<{
                      value: CertificateAlign;
                      icon: typeof AlignLeft;
                      label: string;
                    }>
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const active =
                      layout.fields[selectedField].align === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateField(selectedField, { align: opt.value })
                        }
                        aria-label={`Align ${opt.label}`}
                        className={cn(
                          "flex items-center justify-center rounded-md h-7 text-xs transition-colors duration-150 motion-reduce:transition-none",
                          active
                            ? "bg-card text-foreground shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium block">Font family</span>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-muted/30 p-1">
                  {(
                    [
                      { value: "serif", label: "Serif" },
                      { value: "sans", label: "Sans" },
                    ] as Array<{ value: CertificateFont; label: string }>
                  ).map((opt) => {
                    const active =
                      layout.fields[selectedField].font === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateField(selectedField, { font: opt.value })
                        }
                        className={cn(
                          "flex items-center justify-center rounded-md h-7 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none",
                          active
                            ? "bg-card text-foreground shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleResetLayout}
          className="h-8 text-xs rounded-lg gap-1.5 border-border/70"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset layout</span>
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={isPending || !isLayoutDirty}
          onClick={handleSaveLayout}
          className="h-8 text-xs rounded-lg gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>Save layout</span>
        </Button>
      </div>
    </div>
  );
}
