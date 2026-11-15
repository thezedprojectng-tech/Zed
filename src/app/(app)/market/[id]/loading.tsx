import { Skeleton } from "@/components/ui/skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse">
      <Skeleton className="h-4 w-28 rounded" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* On mobile: Details card first (order-1), Gallery second (order-2) */}
        <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
          <Skeleton className="aspect-4/3 sm:aspect-auto sm:h-[480px] lg:h-[540px] max-h-[560px] w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-16 w-20 rounded-md" />
            <Skeleton className="h-16 w-20 rounded-md" />
            <Skeleton className="h-16 w-20 rounded-md" />
          </div>
          <div className="rounded-lg border border-border/70 bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-20 w-full rounded" />
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5 space-y-6">
          <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-5">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
            <Skeleton className="h-8 w-3/4 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-8 w-44 rounded" />
            </div>
            <div className="space-y-2.5 pt-4 border-t border-border/60">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <div className="pt-4 border-t border-border/60 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
