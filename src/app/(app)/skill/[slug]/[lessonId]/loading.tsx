import { Skeleton } from "@/components/ui/skeleton";

export default function LessonLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse motion-reduce:animate-none max-w-4xl">
      <Skeleton className="h-4 w-40 rounded-md" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-8 w-80 max-w-full rounded-md" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      {/* Video placeholder */}
      <Skeleton className="aspect-video w-full rounded-lg" />

      {/* Content */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="h-4 w-4/6 rounded-md" />
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-border/70 bg-card p-4 flex items-center justify-between">
        <Skeleton className="h-4 w-44 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}
