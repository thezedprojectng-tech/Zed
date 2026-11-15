import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2 border-b border-border/60 pb-5">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Day group skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="rounded-lg border border-border bg-card/60 divide-y divide-border/60 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-start gap-3.5">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3.5 w-full max-w-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
