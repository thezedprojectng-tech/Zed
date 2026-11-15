import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <article className="w-full max-w-[70ch] mx-auto space-y-6">
        {/* Back button skeleton */}
        <Skeleton className="h-5 w-28 rounded-md" />

        {/* Meta & title skeleton */}
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <Skeleton className="h-8 w-full max-w-xl rounded-md" />
          <Skeleton className="h-4 w-full max-w-md rounded-md" />
        </div>

        <div className="h-px bg-border/70" />

        {/* Body skeleton */}
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-24 w-full rounded-lg my-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </article>
    </div>
  );
}
