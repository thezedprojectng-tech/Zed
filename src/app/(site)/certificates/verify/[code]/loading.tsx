import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyCertificateLoading() {
  return (
    <div
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6 animate-pulse motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Verifying certificate"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-8 w-56 rounded-md" />
      </div>

      <div className="rounded-lg border border-border/70 bg-card p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3 border-b border-border/60 pb-5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-4 w-64 max-w-full rounded-md" />
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
