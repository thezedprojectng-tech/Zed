import type { NextConfig } from "next";

// Note: @serwist/next is wrapped in a safe dynamic import block.
// The withSerwist wrapper is applied at build time via the exported function.
// In development (next dev), Serwist is disabled so HMR works normally.

const baseConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Apply Serwist PWA wrapper only in production builds
let exportedConfig: NextConfig | Promise<NextConfig>;

if (process.env.NODE_ENV === "production") {
  // Dynamic import so dev server starts fast without loading Serwist
  exportedConfig = import("@serwist/next").then(({ default: withSerwist }) =>
    withSerwist({
      swSrc: "src/app/sw.ts",
      swDest: "public/sw.js",
      reloadOnOnline: true,
    })(baseConfig)
  );
} else {
  exportedConfig = baseConfig;
}

export default exportedConfig;
