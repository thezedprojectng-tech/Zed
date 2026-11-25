import { Skeleton } from "@/components/ui/skeleton";

export default function TrackDetailLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse motion-reduce:animate-none">
      {/* Back button */}
      <Skeleton className="h-4 w-32 rounded-md" />

      {/* Track Header */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        <div className="space-y-2 pt-2 max-w-md">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-12 rounded-md" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-lg" />
        </div>
      </div>

      {/* Lessons List + Certificate Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48 rounded-md" />
                    <Skeleton className="h-3 w-64 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-lg border border-border/70 bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="divide-y divide-border/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-2.5 flex justify-between">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-3.5 w-16 rounded-md" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
