import { Skeleton } from "@/components/ui/skeleton";

export default function AdminNewsLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/70">
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Tabs and search skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <Skeleton className="h-9 w-64 rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-secondary/20 px-3 py-3 flex gap-4">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 flex-1 max-w-sm" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-3 py-3.5 flex items-center gap-4">
              <Skeleton className="h-4 w-6 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-20 rounded-md shrink-0" />
              <Skeleton className="h-5 w-20 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-7 w-7 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
