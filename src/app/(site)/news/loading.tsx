import { Skeleton } from "@/components/ui/skeleton";

export default function PublicNewsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Title & subtitle skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* SegmentedControl skeleton */}
      <div className="w-full -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none pb-1">
        <Skeleton className="h-9 w-80 rounded-lg min-w-max" />
      </div>

      {/* Cards grid skeleton */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-6 rounded-lg border border-border/70 bg-card space-y-4"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-4/5 rounded-md" />
            </div>
            <div className="pt-4 border-t border-border/60 flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-4 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
