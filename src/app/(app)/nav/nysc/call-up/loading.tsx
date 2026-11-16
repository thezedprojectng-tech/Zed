import { Skeleton } from "@/components/ui/skeleton";

export default function CallUpLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Two-column layout shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Checklist left */}
        <div className="lg:col-span-7 space-y-4 order-last lg:order-first">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-4 w-44 rounded-md" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-9 w-80 rounded-lg" />
          <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex items-start gap-3.5">
                <Skeleton className="h-6 w-6 rounded-md shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/5 rounded-md" />
                  <Skeleton className="h-3.5 w-4/5 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary card right */}
        <div className="lg:col-span-5 space-y-4 order-first lg:order-last">
          <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <div className="h-px bg-border/60" />
            <div className="space-y-1">
              <Skeleton className="h-7 w-40 rounded-md" />
              <Skeleton className="h-3.5 w-48 rounded-md" />
            </div>
            <div className="h-px bg-border/60" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
            <div className="h-px bg-border/60" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
