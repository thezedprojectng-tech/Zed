import { Skeleton } from "@/components/ui/skeleton";

export default function SkillLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-8 w-44 rounded-md" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Points & Progression row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border/70 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-9 w-24 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
          <div className="pt-2 border-t border-border/50">
            <Skeleton className="h-3.5 w-40 rounded" />
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3.5 w-60 rounded" />
        </div>
      </div>

      {/* Tracks list */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/70 bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-10 w-full rounded" />
              <div className="space-y-2 pt-2 border-t border-border/50">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
