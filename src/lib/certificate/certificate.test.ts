import { describe, it, expect } from "vitest";
import {
  DEFAULT_CERTIFICATE_LAYOUT,
  certificateLayoutSchema,
  parseCertificateLayout,
} from "./layout";
import { fitFontSizeToWidth } from "./render";

describe("certificateLayoutSchema", () => {
  it("accepts the default certificate layout", () => {
    const parsed = certificateLayoutSchema.safeParse(DEFAULT_CERTIFICATE_LAYOUT);
    expect(parsed.success).toBe(true);
  });

  it("accepts the exact canonical layout JSON shape", () => {
    const sample = {
      fields: {
        name: {
          x: 0.5,
          y: 0.45,
          size: 0.06,
          color: "#111111",
          align: "center",
          font: "serif",
          maxWidth: 0.6,
        },
        course: {
          x: 0.5,
          y: 0.55,
          size: 0.035,
          color: "#222222",
          align: "center",
          font: "sans",
          maxWidth: 0.7,
        },
        score: {
          x: 0.35,
          y: 0.65,
          size: 0.03,
          color: "#111111",
          align: "left",
          font: "sans",
          maxWidth: 0.25,
        },
        remark: {
          x: 0.65,
          y: 0.65,
          size: 0.03,
          color: "#111111",
          align: "right",
          font: "sans",
          maxWidth: 0.25,
        },
        date: {
          x: 0.25,
          y: 0.82,
          size: 0.025,
          color: "#333333",
          align: "center",
          font: "sans",
          maxWidth: 0.3,
        },
        code: {
          x: 0.5,
          y: 0.88,
          size: 0.02,
          color: "#444444",
          align: "center",
          font: "sans",
          maxWidth: 0.4,
        },
        qr: {
          x: 0.88,
          y: 0.82,
          size: 0.1,
        },
      },
    };

    expect(certificateLayoutSchema.safeParse(sample).success).toBe(true);
  });

  it("rejects out-of-range coordinates, invalid hex color, and invalid font", () => {
    const badX = structuredClone(DEFAULT_CERTIFICATE_LAYOUT);
    badX.fields.name.x = 1.2;
    expect(certificateLayoutSchema.safeParse(badX).success).toBe(false);

    const badColor = structuredClone(DEFAULT_CERTIFICATE_LAYOUT);
    badColor.fields.name.color = "red";
    expect(certificateLayoutSchema.safeParse(badColor).success).toBe(false);

    const badFont = structuredClone(DEFAULT_CERTIFICATE_LAYOUT);
    // @ts-expect-error testing invalid runtime font value
    badFont.fields.course.font = "monospace";
    expect(certificateLayoutSchema.safeParse(badFont).success).toBe(false);

    const badQrSize = structuredClone(DEFAULT_CERTIFICATE_LAYOUT);
    badQrSize.fields.qr.size = 0.005;
    expect(certificateLayoutSchema.safeParse(badQrSize).success).toBe(false);
  });

  it("falls back to default layout when parsing invalid raw data", () => {
    expect(parseCertificateLayout(null)).toEqual(DEFAULT_CERTIFICATE_LAYOUT);
    expect(parseCertificateLayout({ fields: {} })).toEqual(
      DEFAULT_CERTIFICATE_LAYOUT
    );
  });
});

describe("fitFontSizeToWidth", () => {
  it("keeps initialSizePx when text already fits within maxWidthPx", () => {
    const result = fitFontSizeToWidth({
      initialSizePx: 60,
      maxWidthPx: 500,
      measureWidth: (size) => size * 6, // 60 * 6 = 360 <= 500
    });
    expect(result).toBe(60);
  });

  it("shrinks font size until measured width fits within maxWidthPx", () => {
    const result = fitFontSizeToWidth({
      initialSizePx: 80,
      maxWidthPx: 400,
      measureWidth: (size) => size * 10, // 80 * 10 = 800 > 400; fits at <= 40
    });
    expect(result).toBeLessThanOrEqual(40);
    expect(result).toBeGreaterThanOrEqual(39.5);
  });

  it("clamps to minSizePx when even the minimum size exceeds maxWidthPx", () => {
    const result = fitFontSizeToWidth({
      initialSizePx: 48,
      maxWidthPx: 50,
      minSizePx: 10,
      measureWidth: (size) => size * 10, // 10 * 10 = 100 > 50
    });
    expect(result).toBe(10);
  });
});
