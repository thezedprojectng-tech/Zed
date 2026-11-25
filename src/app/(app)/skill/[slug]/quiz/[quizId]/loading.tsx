import { Skeleton } from "@/components/ui/skeleton";

export default function QuizLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse motion-reduce:animate-none max-w-3xl">
      <Skeleton className="h-4 w-36 rounded-md" />

      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-3">
        <Skeleton className="h-7 w-56 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/70 bg-card p-5 space-y-3"
          >
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-5 w-full max-w-md rounded-md" />
            <div className="space-y-2 pt-1">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-10 w-36 rounded-lg" />
    </div>
  );
}
