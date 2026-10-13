// Explicit type declarations for @serwist/next/worker to ensure IDEs
// and TypeScript language servers with various module resolution modes resolve it cleanly.

declare module "@serwist/next/worker" {
  import type { RuntimeCaching } from "serwist";

  export const PAGES_CACHE_NAME: {
    readonly rscPrefetch: "pages-rsc-prefetch";
    readonly rsc: "pages-rsc";
    readonly html: "pages";
  };

  export const defaultCache: RuntimeCaching[];
}
