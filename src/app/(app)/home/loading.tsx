import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* ── 1. Header Skeleton ──────────────────────────────────── */}
      <div className="space-y-2 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <Skeleton className="h-8 w-60 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-md mt-1 sm:mt-0" />
        </div>
        <Skeleton className="h-3.5 w-44 rounded" />
      </div>

      {/* ── 2. Hero Row Skeleton (12 cols, items-start) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Mining Card (8 cols) */}
        <div className="lg:col-span-8 rounded-lg border border-border/70 bg-card p-5 sm:p-6 flex flex-col gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-10 w-44 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <Skeleton className="h-10 w-32 rounded-md" />
            <div className="flex items-center gap-4 pt-3 border-t border-border/50">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>
          </div>
        </div>

        {/* Level Card (4 cols) */}
        <div className="lg:col-span-4 rounded-lg border border-border/70 bg-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="space-y-2 pt-2 border-t border-border/40">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Stat Row Skeleton (3 tiles) ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/70 bg-card p-5 flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
            <Skeleton className="h-3.5 w-24 rounded pt-1" />
          </div>
        ))}
      </div>

      {/* ── 4. Two-up Row Skeleton ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3.5 w-full rounded" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md pt-2" />
          </div>
        ))}
      </div>

      {/* ── 5. Modules Skeleton ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3.5 w-44 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/70 bg-card p-3.5 flex items-start gap-3"
            >
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-8 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
