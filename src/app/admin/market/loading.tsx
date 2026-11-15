import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMarketLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/70">
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Tab row skeleton */}
      <div className="flex gap-1">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-secondary/20 px-3 py-3 flex gap-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-3 py-3 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
