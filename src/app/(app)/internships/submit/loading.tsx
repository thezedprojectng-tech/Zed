import { Skeleton } from "@/components/ui/skeleton";

export default function SubmitInternshipLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-60 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>

      <div className="flex border-b border-border gap-4 pb-2">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      <div className="bg-card border border-border rounded-lg p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
