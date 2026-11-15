import { Skeleton } from "@/components/ui/skeleton";

export default function ZedSettingsLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border/70 bg-card shadow-2xs divide-y divide-border/60">
            {/* Token price section */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            {/* Toggle section */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full shrink-0" />
            </div>

            {/* Limits section */}
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
            </div>

            {/* Min level section */}
            <div className="p-5 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>

          {/* Save bar skeleton */}
          <div className="rounded-lg border border-border/70 bg-card/95 px-5 py-3.5 flex items-center justify-between gap-4">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>

          {/* Price history table skeleton */}
          <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="divide-y divide-border/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-5">
          <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/60">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="px-4 pb-4 pt-2 space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card shadow-2xs p-4 space-y-2">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
