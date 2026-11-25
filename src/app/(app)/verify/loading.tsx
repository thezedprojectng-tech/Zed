import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-pulse motion-reduce:animate-none">
      {/* Header skeleton */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-8 w-52 rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>

      {/* Main 12-col layout matching VerifyBankClient */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left main card */}
        <div className="lg:col-span-7 rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Right unlocks card */}
        <div className="lg:col-span-5 rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
          <Skeleton className="h-5 w-44 rounded-md" />
          <div className="divide-y divide-border/50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
