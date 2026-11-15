import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      {/* Back button skeleton */}
      <Skeleton className="h-6 w-28 rounded-md" />

      {/* Meta skeleton */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <Skeleton className="h-10 w-full max-w-xl rounded-md" />
        <Skeleton className="h-5 w-full max-w-md rounded-md" />
      </div>

      <div className="h-px bg-border" />

      {/* Body skeleton */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </article>
  );
}
