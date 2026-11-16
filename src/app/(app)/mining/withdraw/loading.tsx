import { Skeleton } from "@/components/ui/skeleton";

export default function WithdrawLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header skeleton with 2 stat blocks */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
          <div className="flex gap-3">
            <div className="p-3 rounded-lg border border-border/70 bg-card space-y-1 w-32">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
            <div className="p-3 rounded-lg border border-border/70 bg-card space-y-1 w-32">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Form card skeleton */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>

        <div className="h-px bg-border/60" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>

        <div className="h-px bg-border/60" />

        <div className="space-y-4">
          <Skeleton className="h-4 w-24 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Withdrawal history skeleton */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-6 w-40 rounded-md" />
        <div className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 sm:p-5 flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <Skeleton className="h-3.5 w-48 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
