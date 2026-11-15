import { Skeleton } from "@/components/ui/skeleton";

export default function AlumniDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-pulse">
      <Skeleton className="h-4 w-36 rounded" />
      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 border-b border-border pb-5">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-8 w-56 rounded-md" />
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-4 w-60 rounded" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-16 w-full rounded" />
        </div>

        <div className="space-y-2 border-t border-border pt-5">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        <div className="space-y-2 border-t border-border pt-5">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
