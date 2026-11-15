import { Skeleton } from "@/components/ui/skeleton";

export default function NewListingLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-32 sm:pb-32 animate-pulse">
      {/* Page Header */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36 rounded-md" />
          <Skeleton className="h-3.5 w-80 rounded" />
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form sections (8 cols) */}
        <div className="lg:col-span-8 space-y-8 divide-y divide-border/60">
          {/* Section 1: Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-3 w-64 rounded" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          </div>

          {/* Section 2: Price and location */}
          <div className="space-y-4 pt-8">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
          <div className="space-y-4 pt-8">
            <div className="space-y-1">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          {/* Section 4: Photos */}
          <div className="space-y-4 pt-8">
            <div className="space-y-1">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="aspect-square w-full rounded-lg" />
            </div>
          </div>

          {/* Section 5: Confirmation */}
          <div className="pt-8 flex items-start gap-3">
            <Skeleton className="h-4 w-4 rounded shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-72 rounded" />
              <Skeleton className="h-3 w-96 max-w-full rounded" />
            </div>
          </div>
        </div>

        {/* Right Sticky Aside (4 cols) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
          <div className="rounded-lg border border-border border-l-2 border-l-[var(--data-flows)] bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-14 w-full rounded" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-4 sm:px-6 lg:px-8 py-3">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
