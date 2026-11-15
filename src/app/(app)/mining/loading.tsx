import { Skeleton } from "@/components/ui/skeleton";

export default function MiningLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Hero row (7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-10 w-44 rounded" />
            <Skeleton className="h-3.5 w-36 rounded" />
          </div>
          <div className="flex items-center gap-4 pt-3 border-t border-border/50">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-28 rounded" />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Level matrix */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Claim history */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="rounded-lg border border-border/70 bg-card overflow-hidden divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
