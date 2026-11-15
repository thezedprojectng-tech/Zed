import { Skeleton } from "@/components/ui/skeleton";

export default function SingleInternshipLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-pulse">
      <Skeleton className="h-4 w-40 rounded" />

      <div className="bg-card border border-border rounded-lg p-5 sm:p-6 space-y-5">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
          <Skeleton className="h-8 w-72 rounded-md" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-20 w-full rounded-lg" />

      <div className="bg-card border border-border rounded-lg p-5 sm:p-6 space-y-4">
        <Skeleton className="h-6 w-36 rounded" />
        <Skeleton className="h-24 w-full rounded" />
      </div>
    </div>
  );
}
