import { Skeleton } from "@/components/ui/skeleton";

export default function MyListingsLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse">
      {/* Page Header */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36 rounded" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-72 rounded" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md shrink-0" />
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/70">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      {/* Flat List separated by dividers */}
      <div className="rounded-lg border border-border bg-card divide-y divide-border/60 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <Skeleton className="h-20 w-24 sm:h-22 sm:w-28 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-14 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="h-4 w-48 sm:w-72 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 w-full sm:w-auto justify-end">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
