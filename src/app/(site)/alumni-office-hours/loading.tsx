import { Skeleton } from "@/components/ui/skeleton";

export default function AlumniDirectoryLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-pulse">
      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        <Skeleton className="sm:col-span-8 h-10 rounded-lg" />
        <Skeleton className="sm:col-span-4 h-10 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-3.5 w-40 rounded" />
                </div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <div className="space-y-1 border-y border-border/60 py-2.5">
                <Skeleton className="h-3.5 w-48 rounded" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
              <Skeleton className="h-12 w-full rounded" />
            </div>
            <div className="pt-3 border-t border-border/60 flex justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
