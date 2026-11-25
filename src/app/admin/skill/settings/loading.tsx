import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSkillSettingsLoading() {
  return (
    <div
      className="max-w-[960px] mx-auto space-y-6 pb-16 animate-pulse motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Loading skill settings"
    >
      {/* Back link + header skeleton */}
      <div className="space-y-4 border-b border-border/70 pb-6">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-44 rounded-md" />
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Defaults card skeleton */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-72 max-w-full rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Score bands card skeleton */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="divide-y divide-border/50">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3 flex items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Payment card skeleton */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
        <Skeleton className="h-5 w-44 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}
