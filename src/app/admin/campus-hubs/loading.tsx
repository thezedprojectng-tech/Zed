export default function Loading() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/70">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-md bg-muted" />
            <div className="h-4 w-80 rounded bg-muted/60" />
          </div>
        </div>
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>

      {/* Filter / Search skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="h-10 w-80 rounded-lg bg-muted/70" />
        <div className="h-10 w-64 rounded-lg bg-muted/50" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="h-12 border-b border-border bg-muted/30" />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-16 border-b border-border/60 last:border-b-0 px-4 flex items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="h-4 w-48 rounded bg-muted/80" />
              <div className="h-3 w-32 rounded bg-muted/50" />
            </div>
            <div className="h-4 w-28 rounded bg-muted/60 hidden md:block" />
            <div className="h-5 w-20 rounded-full bg-muted/50" />
            <div className="h-8 w-20 rounded-lg bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
