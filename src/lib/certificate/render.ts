import QRCode from "qrcode";
import {
  CERTIFICATE_TEXT_FIELD_KEYS,
  FONT_STACKS,
  type CertificateLayout,
  type CertificateTextFieldKey,
} from "./layout";

export interface CertificateRenderData {
  name: string;
  course: string;
  score: number | string;
  remark: string;
  date: string;
  code: string;
  qrValue?: string;
}

export interface FitFontSizeParams {
  initialSizePx: number;
  maxWidthPx: number;
  measureWidth: (fontSizePx: number) => number;
  minSizePx?: number;
}

/**
 * Shrinks a font size until the measured text fits within maxWidthPx.
 * Uses binary search for fast, deterministic convergence.
 */
export function fitFontSizeToWidth({
  initialSizePx,
  maxWidthPx,
  measureWidth,
  minSizePx = 8,
}: FitFontSizeParams): number {
  if (initialSizePx <= 0 || maxWidthPx <= 0) {
    return Math.max(1, initialSizePx);
  }

  const effectiveMin = Math.min(minSizePx, initialSizePx);
  if (measureWidth(initialSizePx) <= maxWidthPx) {
    return initialSizePx;
  }
  if (measureWidth(effectiveMin) > maxWidthPx) {
    return effectiveMin;
  }

  let low = effectiveMin;
  let high = initialSizePx;
  for (let i = 0; i < 16; i += 1) {
    const mid = (low + high) / 2;
    if (measureWidth(mid) <= maxWidthPx) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round(low * 10) / 10;
}

/**
 * Loads an image with anonymous CORS so the canvas can be exported without tainting.
 */
export function loadCertificateImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load certificate template image"));
    img.src = src;
  });
}

function getFieldText(
  key: CertificateTextFieldKey,
  data: CertificateRenderData
): string {
  switch (key) {
    case "name":
      return data.name;
    case "course":
      return data.course;
    case "score":
      return typeof data.score === "number" ? `${data.score}%` : data.score;
    case "remark":
      return data.remark;
    case "date":
      return data.date;
    case "code":
      return data.code;
  }
}

function drawQrToCanvas(
  ctx: CanvasRenderingContext2D,
  value: string,
  centerX: number,
  centerY: number,
  sizePx: number
): void {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const moduleCount = qr.modules.size;
  const quietModules = 2;
  const totalModules = moduleCount + quietModules * 2;
  const cellSize = sizePx / totalModules;

  const startX = centerX - sizePx / 2;
  const startY = centerY - sizePx / 2;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(startX, startY, sizePx, sizePx);

  ctx.fillStyle = "#111111";
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.modules.get(row, col)) {
        const x = startX + (col + quietModules) * cellSize;
        const y = startY + (row + quietModules) * cellSize;
        ctx.fillRect(x, y, Math.ceil(cellSize), Math.ceil(cellSize));
      }
    }
  }
  ctx.restore();
}

/**
 * Draws the certificate onto a canvas using an already-loaded HTMLImageElement.
 */
export function drawCertificateWithImage(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  layout: CertificateLayout,
  data: CertificateRenderData
): void {
  const width = img.naturalWidth || img.width || 1600;
  const height = img.naturalHeight || img.height || 1131;

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  for (const key of CERTIFICATE_TEXT_FIELD_KEYS) {
    const field = layout.fields[key];
    const text = getFieldText(key, data);
    if (!text) continue;

    const fontStack = FONT_STACKS[field.font];
    const fontWeight = key === "name" ? "600 " : "";
    const initialSizePx = field.size * height;
    const maxWidthPx = field.maxWidth * width;

    const fittedSize = fitFontSizeToWidth({
      initialSizePx,
      maxWidthPx,
      measureWidth: (sizePx) => {
        ctx.font = `${fontWeight}${sizePx}px ${fontStack}`;
        return ctx.measureText(text).width;
      },
      minSizePx: Math.max(8, Math.round(height * 0.008)),
    });

    ctx.save();
    ctx.font = `${fontWeight}${fittedSize}px ${fontStack}`;
    ctx.fillStyle = field.color;
    ctx.textAlign = field.align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, field.x * width, field.y * height);
    ctx.restore();
  }

  const qrField = layout.fields.qr;
  const qrSizePx = Math.max(24, qrField.size * width);
  const qrValue = data.qrValue ?? data.code;
  if (qrValue) {
    drawQrToCanvas(
      ctx,
      qrValue,
      qrField.x * width,
      qrField.y * height,
      qrSizePx
    );
  }
}

/**
 * Shared certificate renderer for both admin preview and learner download.
 */
export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  templateUrl: string,
  layout: CertificateLayout,
  data: CertificateRenderData
): Promise<void> {
  const img = await loadCertificateImage(templateUrl);
  drawCertificateWithImage(canvas, img, layout, data);
}
