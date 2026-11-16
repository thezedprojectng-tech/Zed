import { Skeleton } from "@/components/ui/skeleton";

export default function CdsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Compact stat row skeleton */}
      <div className="rounded-lg border border-border/70 bg-card divide-y sm:divide-y-0 sm:divide-x divide-border/60 grid grid-cols-1 sm:grid-cols-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 sm:p-5 space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Info callout skeleton */}
      <Skeleton className="h-14 w-full rounded-lg" />

      {/* Session log section skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <Skeleton className="h-4 w-2/5 rounded-md" />
                <Skeleton className="h-3.5 w-3/5 rounded-md" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
