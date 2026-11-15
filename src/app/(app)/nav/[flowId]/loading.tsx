import { Skeleton } from "@/components/ui/skeleton";

export default function FlowPageLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse">
      {/* Back button */}
      <Skeleton className="h-4 w-28 rounded" />

      {/* Header */}
      <div className="space-y-2 border-b border-border/50 pb-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      {/* Progress & Step runner skeleton */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
