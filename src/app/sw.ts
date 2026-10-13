/**
 * Zed Service Worker – powered by Serwist.
 *
 * Precaches the app shell at build time.
 * Runtime-caches /nav/* routes and /data/nav/* JSON files so
 * civil guides work fully offline on 3G/4G.
 */

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ServiceWorkerGlobalScope extends WorkerGlobalScope {}
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Nav routes – stale-while-revalidate for near-instant loads
    {
      matcher: ({ url }) => url.pathname.startsWith("/nav"),
      handler: new StaleWhileRevalidate({
        cacheName: "zed-nav-pages",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
    // Flow JSON data – stale-while-revalidate
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/_next/static/") &&
        url.pathname.includes("flow.json"),
      handler: new StaleWhileRevalidate({
        cacheName: "zed-nav-data",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    // Google Fonts
    {
      matcher: ({ url }) => url.origin === "https://fonts.googleapis.com",
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
      }),
    },
    // Default runtime caching
    ...defaultCache,
  ],
});

serwist.addEventListeners();
