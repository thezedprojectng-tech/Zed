import { Skeleton } from "@/components/ui/skeleton";

export default function AdminFundingLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/70">
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-44 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
      </div>

      {/* Filters bar skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Skeleton className="h-9 w-full max-w-sm rounded-md" />
        <Skeleton className="h-9 w-72 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border/70 bg-card shadow-2xs overflow-hidden">
        {/* Table header */}
        <div className="border-b border-border/70 bg-secondary/30 px-4 py-3 grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 rounded" />
          ))}
        </div>

        {/* Table rows */}
        <div className="divide-y divide-border/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3.5 grid grid-cols-7 gap-4 items-center"
            >
              {/* Project title + category */}
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              {/* Applicant */}
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              {/* Stage */}
              <Skeleton className="h-5 w-16 rounded-md" />
              {/* Amount */}
              <Skeleton className="h-3.5 w-20 rounded" />
              {/* Status */}
              <Skeleton className="h-5 w-18 rounded-full" />
              {/* Date */}
              <Skeleton className="h-3 w-20 rounded" />
              {/* Action */}
              <div className="flex justify-end">
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
