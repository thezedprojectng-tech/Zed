import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B0C",
          borderRadius: 7,
          border: "1px solid rgba(255, 255, 255, 0.15)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bold geometric Z */}
          <path
            d="M7 8.5H23L9.5 23.5H20.5"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Signature Zed emerald dot */}
          <circle cx="25" cy="23.5" r="2.2" fill="#3ECF8E" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
