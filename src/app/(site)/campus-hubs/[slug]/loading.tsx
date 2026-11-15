import { Skeleton } from "@/components/ui/skeleton";

export default function CampusHubDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
      <Skeleton className="h-4 w-36 rounded" />

      <div className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-3 w-64 rounded" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
