import { Skeleton } from "@/components/ui/skeleton";

export default function NavLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-8 w-44 rounded-md" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-10 w-full rounded" />
            <div className="space-y-2 pt-3 border-t border-border/50">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tools Section */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-5 w-28 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
