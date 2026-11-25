import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSkillCertificatesLoading() {
  return (
    <div
      className="max-w-[1120px] mx-auto space-y-6 pb-16 animate-pulse motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Loading certificates"
    >
      {/* Back link + header skeleton */}
      <div className="space-y-4 border-b border-border/70 pb-6">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-44 rounded-md" />
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Tabs + filter toolbar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>

      {/* Table / stacked list skeleton */}
      <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
        <div className="h-10 bg-muted/30 border-b border-border/60" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border/50 last:border-b-0 gap-3"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-44 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
