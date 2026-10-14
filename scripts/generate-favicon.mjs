import fs from "node:fs";
import path from "node:path";

// Canvas size
const W = 32;
const H = 32;

// Colors in RGBA
const BG = [0x0B, 0x0B, 0x0C, 255]; // Obsidian #0B0B0C
const BORDER = [0xFF, 0xFF, 0xFF, 36]; // White border ~14%
const WHITE = [0xFF, 0xFF, 0xFF, 255]; // White glyph
const GREEN = [0x3E, 0xCF, 0x8E, 255]; // Emerald #3ECF8E
const TRANS = [0, 0, 0, 0];

// Create pixel buffer (RGBA, row 0 is top)
const pixels = Array.from({ length: H }, () => Array.from({ length: W }, () => [...TRANS]));

// Helper: blend src over dst
function blend(dst, src) {
  const sa = src[3] / 255;
  const da = dst[3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA === 0) return [0, 0, 0, 0];
  const outR = Math.round((src[0] * sa + dst[0] * da * (1 - sa)) / outA);
  const outG = Math.round((src[1] * sa + dst[1] * da * (1 - sa)) / outA);
  const outB = Math.round((src[2] * sa + dst[2] * da * (1 - sa)) / outA);
  return [outR, outG, outB, Math.round(outA * 255)];
}

function setPixel(x, y, color) {
  if (x >= 0 && x < W && y >= 0 && y < H) {
    pixels[y][x] = blend(pixels[y][x], color);
  }
}

// 1. Draw rounded squircle base (rx=6 on 32x32)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    // Distance from center / corner radius check
    const r = 6;
    let inside = true;
    let distToCorner = 0;

    const cornerX = x < r ? r - x : x >= W - r ? x - (W - 1 - r) : 0;
    const cornerY = y < r ? r - y : y >= H - r ? y - (H - 1 - r) : 0;

    if (cornerX > 0 && cornerY > 0) {
      const d = Math.sqrt(cornerX * cornerX + cornerY * cornerY);
      if (d > r) {
        inside = false;
      } else if (d > r - 1) {
        // antialias edge
        const alpha = Math.max(0, Math.min(1, r - d));
        setPixel(x, y, [BG[0], BG[1], BG[2], Math.round(BG[3] * alpha)]);
        continue;
      }
    }

    if (inside) {
      // Check border
      const isBorder =
        x === 0 || x === W - 1 || y === 0 || y === H - 1 ||
        (cornerX > 0 && cornerY > 0 && Math.sqrt(cornerX * cornerX + cornerY * cornerY) > r - 1.2);
      
      setPixel(x, y, BG);
      if (isBorder) {
        setPixel(x, y, BORDER);
      }
    }
  }
}

// 2. Draw crisp geometric "Z"
// Top horizontal bar: y=7, 8, x from 7 to 22
for (let y = 7; y <= 9; y++) {
  for (let x = 7; x <= 22; x++) {
    setPixel(x, y, WHITE);
  }
}

// Diagonal bar from (21, 9) down to (8, 22)
// Width ~ 3px
for (let y = 9; y <= 22; y++) {
  const progress = (y - 9) / (22 - 9); // 0 at y=9, 1 at y=22
  const centerX = 20 - progress * 11.5;
  for (let dx = -1.5; dx <= 1.5; dx += 0.5) {
    const x = Math.round(centerX + dx);
    const dist = Math.abs(centerX + dx - (centerX + dx));
    setPixel(x, y, WHITE);
  }
}

// Bottom horizontal bar: y=21, 22, 23, x from 7 to 20
for (let y = 21; y <= 23; y++) {
  for (let x = 7; x <= 20; x++) {
    setPixel(x, y, WHITE);
  }
}

// 3. Draw signature Emerald Dot at (25, 22) - radius ~ 2.2
const dotCx = 24.5;
const dotCy = 22;
const dotR = 2.4;
for (let y = 19; y <= 25; y++) {
  for (let x = 22; x <= 28; x++) {
    const d = Math.sqrt((x - dotCx) ** 2 + (y - dotCy) ** 2);
    if (d <= dotR) {
      const alpha = d > dotR - 0.7 ? Math.max(0, (dotR - d) / 0.7) : 1;
      setPixel(x, y, [GREEN[0], GREEN[1], GREEN[2], Math.round(255 * alpha)]);
    }
  }
}

// Build standard Windows ICO binary (DIB / BMP format inside ICO)
const bpp = 32;
const imageSize = 40 + (W * H * 4) + (W * H / 8); // Header (40) + Pixel data (RGBA) + AND mask
const totalSize = 6 + 16 + imageSize;

const buffer = Buffer.alloc(totalSize);

// ICONDIR
buffer.writeUInt16LE(0, 0); // Reserved
buffer.writeUInt16LE(1, 2); // 1 = ICO
buffer.writeUInt16LE(1, 4); // 1 image

// ICONDIRENTRY
buffer.writeUInt8(W, 6); // Width
buffer.writeUInt8(H, 7); // Height
buffer.writeUInt8(0, 8); // Color count
buffer.writeUInt8(0, 9); // Reserved
buffer.writeUInt16LE(1, 10); // Color planes
buffer.writeUInt16LE(bpp, 12); // Bits per pixel
buffer.writeUInt32LE(imageSize, 14); // Image data size
buffer.writeUInt32LE(22, 18); // Offset of image data (6 + 16)

// BITMAPINFOHEADER
let offset = 22;
buffer.writeUInt32LE(40, offset); // Header size
buffer.writeInt32LE(W, offset + 4); // Width
buffer.writeInt32LE(H * 2, offset + 8); // Height x2 for ICO (XOR + AND masks)
buffer.writeUInt16LE(1, offset + 12); // Planes
buffer.writeUInt16LE(32, offset + 14); // BPP
buffer.writeUInt32LE(0, offset + 16); // BI_RGB (no compression)
buffer.writeUInt32LE(W * H * 4, offset + 20); // Image size
buffer.writeInt32LE(0, offset + 24); // XPelsPerMeter
buffer.writeInt32LE(0, offset + 28); // YPelsPerMeter
buffer.writeUInt32LE(0, offset + 32); // Colors used
buffer.writeUInt32LE(0, offset + 36); // Important colors

offset += 40;

// XOR mask: 32-bit BGRA pixels from bottom row to top row (BMP order)
for (let y = H - 1; y >= 0; y--) {
  for (let x = 0; x < W; x++) {
    const p = pixels[y][x];
    buffer.writeUInt8(p[2], offset++); // B
    buffer.writeUInt8(p[1], offset++); // G
    buffer.writeUInt8(p[0], offset++); // R
    buffer.writeUInt8(p[3], offset++); // A
  }
}

// AND mask: 1 bit per pixel (0 = opaque, 1 = transparent), bottom row to top row
for (let y = H - 1; y >= 0; y--) {
  let byte = 0;
  for (let x = 0; x < W; x++) {
    const isTrans = pixels[y][x][3] === 0 ? 1 : 0;
    const bitPos = 7 - (x % 8);
    byte |= (isTrans << bitPos);
    if (x % 8 === 7) {
      buffer.writeUInt8(byte, offset++);
      byte = 0;
    }
  }
}

const outPath = path.resolve("src/app/favicon.ico");
fs.writeFileSync(outPath, buffer);
console.log(`Successfully generated ${outPath} (${buffer.length} bytes)`);
