import { Skeleton } from "@/components/ui/skeleton";

export default function AdminNotificationsLoading() {
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
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Filter chips skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* List skeleton */}
      <div className="rounded-lg border border-border bg-card divide-y divide-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-start gap-3.5">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3.5 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
