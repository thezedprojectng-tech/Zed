import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Row 1: 4 KPI Tiles (col-span-3 each) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={`kpi-r1-${i}`}
            className="rounded-lg border border-border/80 bg-card p-5 space-y-3 min-h-[140px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: 3 KPI Tiles (col-span-4 each) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={`kpi-r2-${i}`}
            className="rounded-lg border border-border/80 bg-card p-5 space-y-3 min-h-[140px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Signups chart (col-span-8) + Verification donut (col-span-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Signups Chart Skeleton */}
        <div className="lg:col-span-8 rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-3.5 w-60 rounded" />
            </div>
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="pt-6 space-y-4">
            <div className="h-48 flex items-end gap-2 px-2">
              {[40, 65, 30, 80, 55, 90, 45, 70, 85, 60, 95, 75].map((h, idx) => (
                <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                  <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        {/* Verification Donut Skeleton */}
        <div className="lg:col-span-4 rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between min-h-[380px]">
          <div className="space-y-1.5 pb-4 border-b border-border/40">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-3.5 w-48 rounded" />
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              <Skeleton className="h-44 w-44 rounded-full" />
              <div className="absolute h-24 w-24 rounded-full bg-card" />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Guide completion (col-span-6) + Civic levels (col-span-6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Guide Completion Skeleton */}
        <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between min-h-[360px]">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-3.5 w-52 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <div className="space-y-4 py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-6 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Civic Levels Skeleton */}
        <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between min-h-[360px]">
          <div className="space-y-1.5 pb-4 border-b border-border/40">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3.5 w-52 rounded" />
          </div>
          <div className="space-y-3.5 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
                <Skeleton className="h-5 rounded" style={{ width: `${85 - i * 14}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

