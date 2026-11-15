import { Skeleton } from "@/components/ui/skeleton";

export default function PublicNewsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Title & subtitle skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-5 w-96 max-w-full rounded-md" />
      </div>

      {/* Category chips skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-[#EAEAE6] dark:border-white/10 bg-white dark:bg-[#121214] space-y-4"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
