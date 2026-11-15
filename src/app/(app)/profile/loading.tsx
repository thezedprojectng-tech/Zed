import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-8 w-44 rounded-md" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      {/* Section 1: Personal Information */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6">
        <div className="space-y-1 border-b border-border/50 pb-4">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3.5 w-72 rounded" />
        </div>

        {/* Avatar block */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3.5 w-60 rounded" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-3 w-64 rounded" />
        </div>
      </div>

      {/* Section 2: Account Details */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-6">
        <div className="space-y-1 border-b border-border/50 pb-4">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-lg border border-border/60 bg-secondary/20 p-4 space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/20 p-4 space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        </div>
      </div>

      {/* Section 3: Security & Session */}
      <div className="rounded-lg border border-border/70 bg-card p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
