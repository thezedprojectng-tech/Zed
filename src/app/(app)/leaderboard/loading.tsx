import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Skeleton className="h-9 w-full sm:w-64 rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-44 rounded-lg" />
      </div>

      {/* Podium skeleton */}
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 pt-4">
        {/* 2nd place (left) */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
          <Skeleton className="h-3.5 w-16 sm:w-24 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-16 sm:h-20 w-full rounded-t-lg rounded-b-none" />
        </div>
        {/* 1st place (center, tallest) */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-14 w-14 sm:h-20 sm:w-20 rounded-full" />
          <Skeleton className="h-4 w-20 sm:w-28 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-24 sm:h-28 w-full rounded-t-lg rounded-b-none" />
        </div>
        {/* 3rd place (right) */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
          <Skeleton className="h-3.5 w-16 sm:w-24 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-12 sm:h-16 w-full rounded-t-lg rounded-b-none" />
        </div>
      </div>

      {/* Ranks 4-20 list skeleton */}
      <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-6 w-6 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-1.5 w-full max-w-xs rounded-full" />
            </div>
            <Skeleton className="h-4 w-16 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
