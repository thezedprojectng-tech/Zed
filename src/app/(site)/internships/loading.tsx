import { Skeleton } from "@/components/ui/skeleton";

export default function InternshipsLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-8 w-56 rounded-md" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>

      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 sm:p-5 rounded-lg bg-card border border-border space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-8 w-full rounded" />
            <div className="flex gap-2 pt-2 border-t border-border/60">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
