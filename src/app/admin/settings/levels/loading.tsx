import { Skeleton } from "@/components/ui/skeleton";

export default function LevelRulesLoading() {
  return (
    <div className="space-y-5 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3.5 w-96" />
        </div>
      </div>

      {/* Sticky action bar skeleton */}
      <div className="rounded-lg border border-border/70 bg-card/95 shadow-sm p-3.5 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* 2×2 Level card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/70 bg-card shadow-2xs flex flex-col"
          >
            {/* Level header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-border/60">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>

            {/* 4 requirement rows */}
            <div className="px-5 py-4 space-y-2 flex-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-secondary/20"
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-3.5 w-12" />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="px-5 pb-4">
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
