import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReferralsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading referral management">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/70">
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-52 rounded" />
            <Skeleton className="h-4 w-80 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-border/70 bg-card space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Grid: Settings + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-lg border border-border/70 bg-card space-y-4">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-2 p-5 rounded-lg border border-border/70 bg-card space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>

      {/* Ledger Skeleton */}
      <div className="p-5 rounded-lg border border-border/70 bg-card space-y-4">
        <Skeleton className="h-6 w-36 rounded" />
        <div className="divide-y divide-border/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
